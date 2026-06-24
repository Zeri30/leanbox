<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a delivery is assigned/reassigned to a rider.
 * The Notifications epic listens to notify the rider.
 */
class DeliveryAssigned
{
    use Dispatchable;

    public function __construct(public readonly Delivery $delivery) {}
}
