<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 99, 1999),
            'stock_quantity' => fake()->numberBetween(0, 120),
            'low_stock_threshold' => 10,
            'is_featured' => fake()->boolean(25),
            'is_best_selling' => fake()->boolean(20),
            'is_active' => true,
        ];
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock_quantity' => fake()->numberBetween(0, 8)]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
