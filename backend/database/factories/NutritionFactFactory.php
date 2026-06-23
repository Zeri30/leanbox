<?php

namespace Database\Factories;

use App\Models\NutritionFact;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NutritionFact>
 */
class NutritionFactFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'serving_size' => fake()->randomElement(['100g', '1 serving', '250ml', '1 scoop']),
            'calories' => fake()->numberBetween(80, 600),
            'protein_g' => fake()->randomFloat(2, 1, 40),
            'carbs_g' => fake()->randomFloat(2, 0, 60),
            'fat_g' => fake()->randomFloat(2, 0, 30),
            'fiber_g' => fake()->randomFloat(2, 0, 15),
            'sugar_g' => fake()->randomFloat(2, 0, 30),
            'sodium_mg' => fake()->randomFloat(2, 0, 800),
            'ingredients' => fake()->words(8, true),
        ];
    }
}
