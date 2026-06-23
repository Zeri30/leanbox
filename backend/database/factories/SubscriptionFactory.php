<?php

namespace Database\Factories;

use App\Enums\DeliverySchedule;
use App\Enums\SubscriptionStatus;
use App\Models\Address;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'plan_id' => SubscriptionPlan::factory(),
            'delivery_address_id' => Address::factory(),
            'status' => SubscriptionStatus::Active,
            'delivery_schedule' => fake()->randomElement(DeliverySchedule::cases()),
            'start_date' => now()->subWeeks(2)->toDateString(),
            'next_delivery_date' => now()->addWeek()->toDateString(),
            'cancelled_at' => null,
        ];
    }

    public function paused(): static
    {
        return $this->state(fn (array $attributes) => ['status' => SubscriptionStatus::Paused]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now()->toDateString(),
            'next_delivery_date' => null,
        ]);
    }
}
