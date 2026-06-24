<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Events\StockChanged;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function seedCart(User $user, Product $product, int $qty, ?float $price = null): void
    {
        $cart = $user->cart()->firstOrCreate([]);
        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $qty,
            'unit_price' => $price ?? $product->price,
        ]);
    }

    public function test_checkout_creates_a_pending_order_decrements_stock_and_clears_cart(): void
    {
        Event::fake([StockChanged::class, OrderStatusChanged::class]);

        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['price' => 100, 'stock_quantity' => 10]);
        $this->seedCart($user, $product, 3);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.subtotal', '300.00')
            ->assertJsonPath('data.shipping_fee', '49.00')
            ->assertJsonPath('data.total', '349.00')
            ->assertJsonPath('data.items.0.line_total', '300.00');

        $this->assertSame(7, $product->fresh()->stock_quantity);
        $this->assertSame(0, $user->cart->items()->count());
        Event::assertDispatched(StockChanged::class);
        Event::assertDispatched(OrderStatusChanged::class);
    }

    public function test_order_items_are_snapshots_not_live_references(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['name' => 'Original Name', 'price' => 100, 'stock_quantity' => 10]);
        $this->seedCart($user, $product, 1);
        Sanctum::actingAs($user);

        $orderId = $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertCreated()->json('data.id');

        $product->update(['name' => 'Renamed', 'price' => 999]);

        $this->getJson("/api/v1/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.items.0.product_name', 'Original Name')
            ->assertJsonPath('data.items.0.unit_price', '100.00');
    }

    public function test_checkout_fails_when_a_line_exceeds_stock_and_nothing_is_charged(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['stock_quantity' => 2]);
        $this->seedCart($user, $product, 5);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'insufficient_stock');

        $this->assertSame(2, $product->fresh()->stock_quantity); // unchanged
        $this->assertSame(0, Order::count());
    }

    public function test_checkout_requires_a_non_empty_cart(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'cart_empty');
    }

    public function test_checkout_rejects_an_address_that_is_not_the_users(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 5]);
        $this->seedCart($user, $product, 1);
        $foreignAddress = Address::factory()->create(); // belongs to someone else
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/orders', ['delivery_address_id' => $foreignAddress->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_a_user_only_sees_their_own_orders(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(2)->create(['user_id' => $user->id]);
        Order::factory()->create(); // someone else's
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 2);
    }

    public function test_a_user_cannot_view_another_users_order(): void
    {
        $other = Order::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/v1/orders/{$other->id}")->assertStatus(403);
    }

    public function test_cancelling_a_pending_order_restocks_items(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['stock_quantity' => 10]);
        $this->seedCart($user, $product, 4);
        Sanctum::actingAs($user);

        $orderId = $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertCreated()->json('data.id');
        $this->assertSame(6, $product->fresh()->stock_quantity);

        $this->patchJson("/api/v1/orders/{$orderId}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(10, $product->fresh()->stock_quantity); // restocked
    }

    public function test_only_pending_orders_can_be_cancelled(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => OrderStatus::Confirmed]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/orders/{$order->id}/cancel")
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_transition');
    }

    public function test_a_user_cannot_cancel_another_users_order(): void
    {
        $order = Order::factory()->create(['status' => OrderStatus::Pending]);
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/orders/{$order->id}/cancel")->assertStatus(403);
    }

    public function test_checkout_requires_authentication(): void
    {
        $this->postJson('/api/v1/orders', ['delivery_address_id' => 1])->assertStatus(401);
    }
}
