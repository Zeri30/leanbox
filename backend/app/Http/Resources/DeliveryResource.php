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
        ];
    }
}
