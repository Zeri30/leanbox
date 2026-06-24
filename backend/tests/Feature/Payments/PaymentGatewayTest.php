<?php

namespace Tests\Feature\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\Payments\CodGateway;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_resolves_the_cod_gateway(): void
    {
        $gateway = app(PaymentGatewayManager::class)->for(PaymentMethod::Cod);

        $this->assertInstanceOf(CodGateway::class, $gateway);
        $this->assertSame(PaymentMethod::Cod, $gateway->method());
    }

    public function test_manager_throws_for_an_unconfigured_method(): void
    {
        $this->expectException(RuntimeException::class);
        app(PaymentGatewayManager::class)->for(PaymentMethod::Gcash);
    }

    public function test_cod_gateway_creates_a_pending_payment_for_the_order(): void
    {
        $order = Order::factory()->create(['total' => 349]);
        $payment = (new CodGateway)->createForOrder($order);

        $this->assertSame(PaymentMethod::Cod, $payment->method);
        $this->assertSame(PaymentStatus::Pending, $payment->status);
        $this->assertSame('349.00', $payment->amount);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'method' => 'cod', 'status' => 'pending']);
    }

    public function test_cod_gateway_marks_paid_and_refunds(): void
    {
        $order = Order::factory()->create(['total' => 100]);
        $gateway = new CodGateway;
        $payment = $gateway->createForOrder($order);

        $gateway->markPaid($payment);
        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertNotNull($payment->fresh()->paid_at);

        $gateway->refund($payment);
        $this->assertSame(PaymentStatus::Refunded, $payment->fresh()->status);
    }
}
