<?php

namespace App\Events;

use App\Enums\DeliveryStatus;
use App\Models\Delivery;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a rider advances a delivery (out for delivery / delivered / failed).
 * The Notifications epic listens to keep the customer informed of progress.
 */
class DeliveryStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly Delivery $delivery,
        public readonly DeliveryStatus $to,
    ) {}
}
