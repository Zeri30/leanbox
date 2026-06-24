<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrderTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
    }

    public function test_admin_can_list_all_orders_and_filter_by_status(): void
    {
        Order::factory()->count(2)->create(['status' => OrderStatus::Pending]);
        Order::factory()->create(['status' => OrderStatus::Shipped]);
        $this->actingAdmin();

        $this->getJson('/api/v1/admin/orders')
            ->assertOk()->assertJsonPath('meta.pagination.total', 3);

        $this->getJson('/api/v1/admin/orders?status=pending')
            ->assertOk()->assertJsonPath('meta.pagination.total', 2);
    }

    public function test_admin_can_search_orders_by_number(): void
    {
        $order = Order::factory()->create();
        Order::factory()->create();
        $this->actingAdmin();

        $res = $this->getJson('/api/v1/admin/orders?search='.$order->order_number)->assertOk();
        $this->assertSame(1, $res->json('meta.pagination.total'));
    }

    public function test_admin_can_view_order_detail_with_customer(): void
    {
        $order = Order::factory()->create();
        $this->actingAdmin();

        $this->getJson("/api/v1/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonStructure(['data' => ['customer' => ['id', 'email'], 'items']]);
    }

    public function test_admin_can_advance_status_through_legal_transitions(): void
    {
        Event::fake([OrderStatusChanged::class]);
        $order = Order::factory()->create(['status' => OrderStatus::Pending]);
        $this->actingAdmin();

        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertOk()->assertJsonPath('data.status', 'confirmed');
        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'preparing'])
            ->assertOk()->assertJsonPath('data.status', 'preparing');
        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertOk()->assertJsonPath('data.status', 'shipped');

        Event::assertDispatched(OrderStatusChanged::class);
    }

    public function test_illegal_status_jump_is_rejected(): void
    {
        $order = Order::factory()->create(['status' => OrderStatus::Pending]);
        $this->actingAdmin();

        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_transition');
    }

    public function test_admin_cannot_set_delivered_via_status_endpoint(): void
    {
        $order = Order::factory()->create(['status' => OrderStatus::Shipped]);
        $this->actingAdmin();

        // `delivered` is the rider's action — rejected by request validation.
        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_admin_cancel_restocks_items(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 5]);
        $order = Order::factory()->create(['status' => OrderStatus::Confirmed]);
        $order->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'quantity' => 3, 'unit_price' => $product->price, 'line_total' => $product->price * 3,
        ]);
        $this->actingAdmin();

        $this->patchJson("/api/v1/admin/orders/{$order->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(8, $product->fresh()->stock_quantity); // 5 + 3 restocked
    }

    public function test_admin_cannot_cancel_a_shipped_order(): void
    {
        $order = Order::factory()->create(['status' => OrderStatus::Shipped]);
        $this->actingAdmin();

        $this->patchJson("/api/v1/admin/orders/{$order->id}/cancel")
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_transition');
    }

    public function test_non_admins_cannot_manage_orders(): void
    {
        $order = Order::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/orders')->assertStatus(403);
        $this->getJson("/api/v1/admin/orders/{$order->id}")->assertStatus(403);
        $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'confirmed'])->assertStatus(403);
        $this->patchJson("/api/v1/admin/orders/{$order->id}/cancel")->assertStatus(403);
    }
}
