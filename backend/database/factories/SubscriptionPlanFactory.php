<?php

namespace Database\Factories;

use App\Enums\BillingInterval;
use App\Enums\MealType;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => Str::title(fake()->unique()->words(2, true)).' Plan',
            'description' => fake()->sentence(),
            'meal_type' => fake()->randomElement(MealType::cases()),
            'price' => fake()->randomFloat(2, 999, 4999),
            'billing_interval' => fake()->randomElement(BillingInterval::cases()),
            'meals_per_cycle' => fake()->randomElement([5, 7, 10, 14]),
            'is_active' => true,
        ];
    }
}
