<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;

/**
 * Payment provider seam. Implemented for COD now; Stripe/PayMongo/Xendit can be
 * added later as drop-in implementations without touching the rest of the app.
 */
interface PaymentGateway
{
    public function method(): PaymentMethod;

    /** Create/record the payment for an order (no upfront charge for COD). */
    public function createForOrder(Order $order): Payment;

    /** Mark a payment as paid (for COD, collected on delivery). */
    public function markPaid(Payment $payment): Payment;

    /** Refund/void a payment. */
    public function refund(Payment $payment): Payment;
}
