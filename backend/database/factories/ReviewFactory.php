<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'order_id' => Order::factory(),
            'rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->optional()->sentence(),
            'is_hidden' => false,
        ];
    }

    public function hidden(): static
    {
        return $this->state(fn (array $attributes) => ['is_hidden' => true]);
    }
}
