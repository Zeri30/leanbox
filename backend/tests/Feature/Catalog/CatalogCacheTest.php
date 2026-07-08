<?php

namespace Tests\Feature\Catalog;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Storefront catalog reads are cached (Laravel `database` driver in prod) and busted
 * automatically when their source data changes. `withoutEvents` creates rows without
 * firing the CatalogCacheObserver — proving a plain read is served from cache — while
 * an ordinary Eloquent write must invalidate it.
 */
class CatalogCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_listing_is_cached_between_requests(): void
    {
        Category::factory()->create(['is_active' => true]);

        $this->assertSame(1, count($this->getJson('/api/v1/categories')->json('data')));

        // Added behind the observer's back — the cached response must not see it.
        Category::withoutEvents(fn () => Category::factory()->create(['is_active' => true]));

        $this->assertSame(1, count($this->getJson('/api/v1/categories')->json('data')));
    }

    public function test_writing_a_category_invalidates_the_cached_listing(): void
    {
        Category::factory()->create(['is_active' => true]);
        $this->assertSame(1, count($this->getJson('/api/v1/categories')->json('data')));

        // Ordinary Eloquent write → observer bumps the catalog cache version.
        Category::factory()->create(['is_active' => true]);
        $this->assertSame(2, count($this->getJson('/api/v1/categories')->json('data')));
    }

    public function test_product_listing_is_cached_between_requests(): void
    {
        Product::factory()->count(2)->create(['is_active' => true]);

        $this->assertSame(2, $this->getJson('/api/v1/products')->json('meta.pagination.total'));

        Product::withoutEvents(fn () => Product::factory()->create(['is_active' => true]));

        // Still 2 — the extra product bypassed cache invalidation.
        $this->assertSame(2, $this->getJson('/api/v1/products')->json('meta.pagination.total'));
    }

    public function test_creating_a_product_invalidates_the_cached_listing(): void
    {
        Product::factory()->count(2)->create(['is_active' => true]);
        $this->assertSame(2, $this->getJson('/api/v1/products')->json('meta.pagination.total'));

        Product::factory()->create(['is_active' => true]);
        $this->assertSame(3, $this->getJson('/api/v1/products')->json('meta.pagination.total'));
    }

    public function test_updating_a_product_invalidates_the_cached_listing(): void
    {
        $product = Product::factory()->create([
            'is_active' => true,
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        $this->assertSame(
            'in_stock',
            $this->getJson('/api/v1/products')->json('data.0.stock_status'),
        );

        $product->update(['stock_quantity' => 0]);

        $this->assertSame(
            'out_of_stock',
            $this->getJson('/api/v1/products')->json('data.0.stock_status'),
        );
    }
}
