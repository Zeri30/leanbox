<?php

namespace App\Http\Resources;

use App\Models\SubscriptionPayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SubscriptionPayment
 */
class SubscriptionPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'status' => $this->status->value,
            'billing_date' => $this->billing_date?->toDateString(),
            'paid_at' => $this->paid_at,
        ];
    }
}
