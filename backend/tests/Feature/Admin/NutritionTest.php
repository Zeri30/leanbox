<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NutritionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_nutrition_facts_as_one_to_one(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();

        $this->putJson("/api/v1/admin/products/{$product->id}/nutrition", [
            'serving_size' => '1 bowl',
            'calories' => 420,
            'protein_g' => 30,
        ])->assertOk()->assertJsonPath('data.calories', 420);

        // Upsert again — still exactly one row for the product.
        $this->putJson("/api/v1/admin/products/{$product->id}/nutrition", ['calories' => 500])
            ->assertOk()->assertJsonPath('data.calories', 500);

        $this->assertSame(1, $product->nutritionFacts()->count());
        $this->assertDatabaseHas('nutrition_facts', ['product_id' => $product->id, 'calories' => 500]);
    }

    public function test_nutrition_is_returned_on_product_detail(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();
        $product->nutritionFacts()->create(['calories' => 250, 'protein_g' => 12]);

        $this->getJson("/api/v1/admin/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.nutrition.calories', 250);
    }

    public function test_non_admins_cannot_manage_nutrition(): void
    {
        Sanctum::actingAs(User::factory()->customer()->create());
        $product = Product::factory()->create();

        $this->putJson("/api/v1/admin/products/{$product->id}/nutrition", ['calories' => 100])
            ->assertStatus(403);
    }
}
