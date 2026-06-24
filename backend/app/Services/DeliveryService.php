<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Events\DeliveryAssigned;
use App\Exceptions\DeliveryException;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;

class DeliveryService
{
    /** Create a delivery for a one-off order (orders are 1:1 with deliveries). */
    public function createFromOrder(Order $order): Delivery
    {
        if ($order->delivery()->exists()) {
            throw new DeliveryException('delivery_exists', 'This order already has a delivery.');
        }

        return Delivery::create([
            'order_id' => $order->id,
            'delivery_address_id' => $order->delivery_address_id,
            'status' => DeliveryStatus::Pending,
        ]);
    }

    /** Create a delivery for a subscription cycle. */
    public function createFromSubscription(Subscription $subscription): Delivery
    {
        return Delivery::create([
            'subscription_id' => $subscription->id,
            'delivery_address_id' => $subscription->delivery_address_id,
            'status' => DeliveryStatus::Pending,
        ]);
    }

    /** Assign (or reassign) a rider; notifies the rider. */
    public function assign(Delivery $delivery, User $rider): Delivery
    {
        if (in_array($delivery->status, [DeliveryStatus::Delivered, DeliveryStatus::Failed], true)) {
            throw new DeliveryException('not_assignable', 'A completed or failed delivery cannot be reassigned.');
        }

        $delivery->update([
            'rider_id' => $rider->id,
            'status' => DeliveryStatus::Assigned,
            'assigned_at' => $delivery->assigned_at ?? now(),
        ]);

        DeliveryAssigned::dispatch($delivery);

        return $delivery;
    }

    public function markFailed(Delivery $delivery): Delivery
    {
        if ($delivery->status === DeliveryStatus::Delivered) {
            throw new DeliveryException('not_failable', 'A delivered order cannot be marked failed.');
        }

        $delivery->update(['status' => DeliveryStatus::Failed]);

        return $delivery;
    }
}
