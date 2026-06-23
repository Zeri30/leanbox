<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubscriptionPayment>
 */
class SubscriptionPaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subscription_id' => Subscription::factory(),
            'amount' => fake()->randomFloat(2, 999, 4999),
            'status' => PaymentStatus::Paid,
            'billing_date' => now()->toDateString(),
            'paid_at' => now(),
        ];
    }
}
