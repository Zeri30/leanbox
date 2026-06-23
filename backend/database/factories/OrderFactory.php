<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 150, 3000);
        $shipping = 49;
        $tax = 0;

        return [
            'user_id' => User::factory(),
            'delivery_address_id' => Address::factory(),
            'order_number' => 'ORD-'.strtoupper(Str::random(8)),
            'status' => OrderStatus::Pending,
            'subtotal' => $subtotal,
            'shipping_fee' => $shipping,
            'tax' => $tax,
            'total' => $subtotal + $shipping + $tax,
            'placed_at' => now(),
        ];
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn (array $attributes) => ['status' => $status]);
    }
}
