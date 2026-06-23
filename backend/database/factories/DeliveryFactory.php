<?php

namespace Database\Factories;

use App\Enums\DeliveryStatus;
use App\Models\Address;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Delivery>
 */
class DeliveryFactory extends Factory
{
    /**
     * Defaults to an order-based delivery (exactly one target, per the model rule).
     * Foreign keys are lazy so overriding them in the seeder won't spawn orphans.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'subscription_id' => null,
            'rider_id' => null,
            'delivery_address_id' => Address::factory(),
            'status' => DeliveryStatus::Pending,
            'assigned_at' => null,
            'delivered_at' => null,
            'proof_image_url' => null,
            'delivery_notes' => null,
        ];
    }

    /** Switch to a subscription-cycle delivery (clears order_id to keep exactly one target). */
    public function forSubscription(?Subscription $subscription = null): static
    {
        $subscription ??= Subscription::factory()->create();

        return $this->state(fn (array $attributes) => [
            'order_id' => null,
            'subscription_id' => $subscription->id,
            'delivery_address_id' => $subscription->delivery_address_id,
        ]);
    }

    public function assigned(int $riderId): static
    {
        return $this->state(fn (array $attributes) => [
            'rider_id' => $riderId,
            'status' => DeliveryStatus::Assigned,
            'assigned_at' => now()->subDay(),
        ]);
    }

    public function delivered(int $riderId): static
    {
        return $this->state(fn (array $attributes) => [
            'rider_id' => $riderId,
            'status' => DeliveryStatus::Delivered,
            'assigned_at' => now()->subDays(2),
            'delivered_at' => now()->subDay(),
            'proof_image_url' => 'https://placehold.co/600x800/png?text=POD',
            'delivery_notes' => 'Left with recipient.',
        ]);
    }
}
