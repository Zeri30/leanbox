<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use RuntimeException;

/** Resolves a PaymentGateway for a payment method from config (config/payments.php). */
class PaymentGatewayManager
{
    public function for(PaymentMethod $method): PaymentGateway
    {
        /** @var array<string, class-string<PaymentGateway>> $gateways */
        $gateways = config('payments.gateways', []);
        $class = $gateways[$method->value] ?? null;

        if ($class === null) {
            throw new RuntimeException("No payment gateway configured for '{$method->value}'.");
        }

        return app($class);
    }
}
