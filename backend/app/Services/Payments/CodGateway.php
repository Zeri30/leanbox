<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;

/** Cash on delivery: no upfront charge; amount is collected when the order is delivered. */
class CodGateway implements PaymentGateway
{
    public function method(): PaymentMethod
    {
        return PaymentMethod::Cod;
    }

    public function createForOrder(Order $order): Payment
    {
        return $order->payment()->create([
            'method' => PaymentMethod::Cod,
            'status' => PaymentStatus::Pending,
            'amount' => $order->total,
        ]);
    }

    public function markPaid(Payment $payment): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Paid,
            'paid_at' => now(),
        ]);

        return $payment;
    }

    public function refund(Payment $payment): Payment
    {
        $payment->update(['status' => PaymentStatus::Refunded]);

        return $payment;
    }
}
