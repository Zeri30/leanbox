<?php

namespace Tests\Feature\Payments;

use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CodCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function checkout(): array
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['price' => 100, 'stock_quantity' => 10]);
        $cart = $user->cart()->firstOrCreate([]);
        $cart->items()->create(['product_id' => $product->id, 'quantity' => 2, 'unit_price' => $product->price]);
        Sanctum::actingAs($user);

        return [$user, $address];
    }

    public function test_checkout_records_a_pending_cod_payment(): void
    {
        [$user, $address] = $this->checkout();

        $res = $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.payment.method', 'cod')
            ->assertJsonPath('data.payment.status', 'pending');

        $this->assertSame('249.00', $res->json('data.payment.amount')); // 200 + 49 shipping
        $this->assertDatabaseHas('payments', [
            'order_id' => $res->json('data.id'),
            'method' => 'cod',
            'status' => 'pending',
        ]);
    }

    public function test_unsupported_payment_method_is_rejected(): void
    {
        [$user, $address] = $this->checkout();

        $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id, 'payment_method' => 'gcash'])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_mark_paid_hook_marks_the_payment_paid(): void
    {
        [$user, $address] = $this->checkout();
        $orderId = $this->postJson('/api/v1/orders', ['delivery_address_id' => $address->id])
            ->assertCreated()->json('data.id');

        $order = Order::findOrFail($orderId);
        $payment = app(OrderService::class)->markPaid($order);

        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertNotNull($payment->fresh()->paid_at);
    }
}
