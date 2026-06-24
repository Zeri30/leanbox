<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductAdminTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
    }

    public function test_admin_can_create_a_product_with_an_auto_generated_slug(): void
    {
        $this->actingAdmin();
        $category = Category::factory()->create();

        $this->postJson('/api/v1/admin/products', [
            'category_id' => $category->id,
            'name' => 'Garden Power Bowl',
            'price' => 220,
            'stock_quantity' => 30,
            'is_featured' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Garden Power Bowl')
            ->assertJsonPath('data.slug', 'garden-power-bowl')
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('products', ['name' => 'Garden Power Bowl', 'slug' => 'garden-power-bowl']);
    }

    public function test_duplicate_names_get_distinct_slugs(): void
    {
        $this->actingAdmin();
        $category = Category::factory()->create();
        $payload = fn () => [
            'category_id' => $category->id, 'name' => 'Protein Box', 'price' => 310, 'stock_quantity' => 10,
        ];

        $first = $this->postJson('/api/v1/admin/products', $payload())->assertCreated()->json('data.slug');
        $second = $this->postJson('/api/v1/admin/products', $payload())->assertCreated()->json('data.slug');

        $this->assertSame('protein-box', $first);
        $this->assertSame('protein-box-2', $second);
    }

    public function test_product_creation_is_validated(): void
    {
        $this->actingAdmin();
        $category = Category::factory()->create();

        $this->postJson('/api/v1/admin/products', [
            'category_id' => $category->id, 'name' => 'Bad', 'price' => -5, 'stock_quantity' => 3,
        ])->assertStatus(422)->assertJsonPath('error.code', 'validation_error');

        $this->postJson('/api/v1/admin/products', [
            'category_id' => 99999, 'name' => 'Ghost', 'price' => 5, 'stock_quantity' => 3,
        ])->assertStatus(422);
    }

    public function test_admin_can_update_a_product_and_toggle_flags(): void
    {
        $this->actingAdmin();
        $product = Product::factory()->create(['price' => 100, 'is_best_selling' => false]);

        $this->patchJson("/api/v1/admin/products/{$product->id}", [
            'price' => 175.50,
            'stock_quantity' => 5,
            'is_best_selling' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.price', '175.50')
            ->assertJsonPath('data.stock_quantity', 5)
            ->assertJsonPath('data.is_best_selling', true);
    }

    public function test_deleting_a_product_soft_deletes_it(): void
    {
        $this->actingAdmin();
        $product = Product::factory()->create(['is_active' => true]);

        $this->deleteJson("/api/v1/admin/products/{$product->id}")->assertOk();

        // Row remains (order history intact), just deactivated.
        $this->assertDatabaseHas('products', ['id' => $product->id, 'is_active' => false]);
    }

    public function test_admin_can_list_products_with_search_and_category_filter(): void
    {
        $this->actingAdmin();
        $catA = Category::factory()->create();
        $catB = Category::factory()->create();
        Product::factory()->create(['name' => 'Vegan Wrap', 'category_id' => $catA->id]);
        Product::factory()->create(['name' => 'Beef Bowl', 'category_id' => $catB->id]);

        $this->getJson('/api/v1/admin/products?search=vegan')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.name', 'Vegan Wrap');

        $this->getJson("/api/v1/admin/products?category_id={$catB->id}")
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.name', 'Beef Bowl');
    }

    public function test_non_admins_cannot_manage_products(): void
    {
        $category = Category::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/products')->assertStatus(403);
        $this->postJson('/api/v1/admin/products', [
            'category_id' => $category->id, 'name' => 'X', 'price' => 1, 'stock_quantity' => 1,
        ])->assertStatus(403);
    }

    public function test_managing_products_requires_authentication(): void
    {
        $this->getJson('/api/v1/admin/products')->assertStatus(401);
    }
}
