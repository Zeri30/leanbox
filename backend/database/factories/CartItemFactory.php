<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CartItem>
 */
class CartItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $product = Product::factory()->create();

        return [
            'cart_id' => Cart::factory(),
            'product_id' => $product->id,
            'quantity' => fake()->numberBetween(1, 4),
            'unit_price' => $product->price,
        ];
    }
}
