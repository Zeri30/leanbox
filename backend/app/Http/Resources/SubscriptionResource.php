<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Subscription
 */
class SubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'delivery_schedule' => $this->delivery_schedule->value,
            'start_date' => $this->start_date?->toDateString(),
            'next_delivery_date' => $this->next_delivery_date?->toDateString(),
            'cancelled_at' => $this->cancelled_at?->toDateString(),
            'delivery_address_id' => $this->delivery_address_id,
            'plan' => SubscriptionPlanResource::make($this->whenLoaded('plan')),
            'payments' => SubscriptionPaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
