<?php

namespace App\Events;

use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a subscription cycle is processed (payment + delivery generated).
 * The Notifications epic listens to send the renewal notification.
 */
class SubscriptionRenewed
{
    use Dispatchable;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly SubscriptionPayment $payment,
    ) {}
}
