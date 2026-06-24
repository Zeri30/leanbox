<?php

namespace App\Http\Resources;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SubscriptionPlan
 */
class SubscriptionPlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'meal_type' => $this->meal_type->value,
            'price' => $this->price,
            'billing_interval' => $this->billing_interval->value,
            'meals_per_cycle' => $this->meals_per_cycle,
            'is_active' => $this->is_active,
        ];
    }
}
