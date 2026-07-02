<?php

namespace App\Http\Resources;

use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Delivery
 */
class DeliveryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'subscription_id' => $this->subscription_id,
            'rider_id' => $this->rider_id,
            'delivery_address_id' => $this->delivery_address_id,
            'status' => $this->status->value,
            'assigned_at' => $this->assigned_at,
            'delivered_at' => $this->delivered_at,
            'proof_image_url' => $this->proof_image_url,
            'delivery_notes' => $this->delivery_notes,
            'created_at' => $this->created_at,
            'rider' => UserResource::make($this->whenLoaded('rider')),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
            ]),
            'address' => AddressResource::make($this->whenLoaded('deliveryAddress')),
            // Line items (order deliveries) — only when order.items is eager-loaded
            // (rider endpoints); guarded so admin's lighter eager-load isn't affected.
            'items' => $this->when(
                $this->relationLoaded('order') && $this->order?->relationLoaded('items'),
                fn () => $this->order->items->map(fn ($item) => [
                    'product_name' => $item->product_name,
                    'quantity' => $item->quantity,
                ])->all(),
            ),
            // Plan summary (subscription deliveries) — only when subscription.plan is loaded.
            'plan' => $this->when(
                $this->relationLoaded('subscription') && $this->subscription?->relationLoaded('plan'),
                fn () => $this->subscription->plan ? [
                    'name' => $this->subscription->plan->name,
                    'meals_per_cycle' => $this->subscription->plan->meals_per_cycle,
                ] : null,
            ),
        ];
    }
}
