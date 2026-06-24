<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Events\DeliveryAssigned;
use App\Exceptions\DeliveryException;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DeliveryService
{
    public function __construct(private readonly OrderService $orders) {}

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

    /**
     * Rider status update (out_for_delivery → delivered/failed). On delivered, syncs
     * the linked order to Delivered (which marks COD paid + notifies the customer).
     */
    public function riderUpdateStatus(Delivery $delivery, DeliveryStatus $to): Delivery
    {
        if (! $delivery->status->canTransitionTo($to)) {
            throw new DeliveryException(
                'invalid_transition',
                "Cannot change delivery from {$delivery->status->value} to {$to->value}.",
            );
        }

        $delivery->status = $to;
        if ($to === DeliveryStatus::Delivered) {
            $delivery->delivered_at = now();
        }
        $delivery->save();

        if ($to === DeliveryStatus::Delivered && $delivery->order_id !== null) {
            $this->orders->markDelivered($delivery->order);
        }

        return $delivery;
    }

    /** Attach proof-of-delivery photo (Supabase Storage) + notes. */
    public function attachProof(Delivery $delivery, UploadedFile $photo, ?string $notes): Delivery
    {
        $path = $photo->store("deliveries/{$delivery->id}", 'supabase');

        $delivery->update([
            'proof_image_url' => Storage::disk('supabase')->url($path),
            'delivery_notes' => $notes ?? $delivery->delivery_notes,
        ]);

        return $delivery;
    }
}
