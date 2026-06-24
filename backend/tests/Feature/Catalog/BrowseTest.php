<?php

namespace Tests\Feature\Catalog;

use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrowseTest extends TestCase
{
    use RefreshDatabase;

    public function test_listing_returns_only_active_products_and_is_public(): void
    {
        Product::factory()->count(2)->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $res = $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'price', 'stock_status']],
                'meta' => ['pagination' => ['current_page', 'last_page', 'per_page', 'total']],
                'error',
            ]);

        $this->assertSame(2, $res->json('meta.pagination.total'));
    }

    public function test_search_filters_by_name(): void
    {
        Product::factory()->create(['name' => 'Vegan Power Bowl']);
        Product::factory()->create(['name' => 'Beef Steak Box']);

        $res = $this->getJson('/api/v1/products?search=vegan')->assertOk();

        $this->assertSame(1, $res->json('meta.pagination.total'));
        $this->assertSame('Vegan Power Bowl', $res->json('data.0.name'));
    }

    public function test_filter_by_category_slug(): void
    {
        $veg = Category::factory()->create(['slug' => 'veg', 'is_active' => true]);
        $sup = Category::factory()->create(['slug' => 'supps', 'is_active' => true]);
        Product::factory()->for($veg)->create();
        Product::factory()->for($sup)->create();

        $res = $this->getJson('/api/v1/products?category=veg')->assertOk();

        $this->assertSame(1, $res->json('meta.pagination.total'));
        $this->assertSame($veg->id, $res->json('data.0.category_id'));
    }

    public function test_sort_by_price(): void
    {
        Product::factory()->create(['name' => 'Cheap', 'price' => 50]);
        Product::factory()->create(['name' => 'Pricey', 'price' => 500]);

        $low = $this->getJson('/api/v1/products?sort=price_low')->assertOk();
        $this->assertSame('Cheap', $low->json('data.0.name'));

        $high = $this->getJson('/api/v1/products?sort=price_high')->assertOk();
        $this->assertSame('Pricey', $high->json('data.0.name'));
    }

    public function test_featured_filter(): void
    {
        Product::factory()->create(['is_featured' => true, 'name' => 'Featured One']);
        Product::factory()->create(['is_featured' => false]);

        $res = $this->getJson('/api/v1/products?featured=1')->assertOk();
        $this->assertSame(1, $res->json('meta.pagination.total'));
        $this->assertSame('Featured One', $res->json('data.0.name'));
    }

    public function test_pagination_caps_the_page_size(): void
    {
        Product::factory()->count(15)->create();

        $res = $this->getJson('/api/v1/products?per_page=12')->assertOk();
        $this->assertSame(12, count($res->json('data')));
        $this->assertSame(15, $res->json('meta.pagination.total'));
        $this->assertSame(2, $res->json('meta.pagination.last_page'));
    }

    public function test_product_detail_includes_images_nutrition_and_review_summary(): void
    {
        $product = Product::factory()->create(['slug' => 'garden-bowl', 'stock_quantity' => 0]);
        $product->images()->create(['url' => 'https://x/1.jpg', 'is_primary' => true, 'sort_order' => 0]);
        $product->nutritionFacts()->create(['calories' => 300]);
        Review::factory()->for($product)->create(['rating' => 4]);
        Review::factory()->for($product)->create(['rating' => 5]);
        Review::factory()->for($product)->hidden()->create(['rating' => 1]);

        $this->getJson('/api/v1/products/garden-bowl')
            ->assertOk()
            ->assertJsonPath('data.slug', 'garden-bowl')
            ->assertJsonPath('data.stock_status', 'out_of_stock')
            ->assertJsonPath('data.nutrition.calories', 300)
            ->assertJsonPath('data.reviews_summary.count', 2) // hidden review excluded
            ->assertJsonPath('data.reviews_summary.average', 4.5)
            ->assertJsonCount(1, 'data.images');
    }

    public function test_inactive_or_unknown_product_returns_404(): void
    {
        $inactive = Product::factory()->create(['slug' => 'hidden-prod', 'is_active' => false]);

        $this->getJson('/api/v1/products/hidden-prod')->assertNotFound();
        $this->getJson('/api/v1/products/does-not-exist')->assertNotFound();
    }

    public function test_stock_status_is_computed(): void
    {
        Product::factory()->create(['slug' => 'in', 'stock_quantity' => 50, 'low_stock_threshold' => 10]);
        Product::factory()->create(['slug' => 'low', 'stock_quantity' => 5, 'low_stock_threshold' => 10]);

        $this->getJson('/api/v1/products/in')->assertJsonPath('data.stock_status', 'in_stock');
        $this->getJson('/api/v1/products/low')->assertJsonPath('data.stock_status', 'low_stock');
    }

    public function test_categories_endpoint_returns_only_active(): void
    {
        Category::factory()->create(['name' => 'Active Cat', 'is_active' => true]);
        Category::factory()->create(['is_active' => false]);

        $res = $this->getJson('/api/v1/categories')->assertOk();
        $this->assertSame(1, count($res->json('data')));
        $this->assertSame('Active Cat', $res->json('data.0.name'));
    }
}
