<?php

namespace Tests\Feature\Cart;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewing_the_cart_creates_an_empty_one(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.item_count', 0)
            ->assertJsonPath('data.subtotal', '0.00')
            ->assertJsonCount(0, 'data.items');
    }

    public function test_adding_an_item_snapshots_the_unit_price(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['price' => 100, 'stock_quantity' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertCreated()
            ->assertJsonPath('data.item_count', 2)
            ->assertJsonPath('data.subtotal', '200.00')
            ->assertJsonPath('data.items.0.unit_price', '100.00');
    }

    public function test_price_snapshot_survives_later_product_price_changes(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['price' => 100, 'stock_quantity' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $product->update(['price' => 150]);

        $this->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.items.0.unit_price', '100.00')
            ->assertJsonPath('data.subtotal', '100.00');
    }

    public function test_adding_the_same_product_increments_quantity(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['price' => 50, 'stock_quantity' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])->assertCreated();
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 3])
            ->assertCreated()
            ->assertJsonPath('data.item_count', 5)
            ->assertJsonCount(1, 'data.items');
    }

    public function test_cannot_add_more_than_available_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['stock_quantity' => 3]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 5])
            ->assertStatus(422)->assertJsonPath('error.code', 'insufficient_stock');
    }

    public function test_cannot_add_an_inactive_product(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['is_active' => false, 'stock_quantity' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertStatus(422)->assertJsonPath('error.code', 'product_unavailable');
    }

    public function test_updating_quantity_recomputes_totals(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = Product::factory()->create(['price' => 80, 'stock_quantity' => 10]);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $item = Cart::first()->items()->first();

        $this->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 3])
            ->assertOk()
            ->assertJsonPath('data.item_count', 3)
            ->assertJsonPath('data.subtotal', '240.00');
    }

    public function test_updating_beyond_stock_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['stock_quantity' => 2]);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $item = Cart::first()->items()->first();

        $this->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 9])
            ->assertStatus(422)->assertJsonPath('error.code', 'insufficient_stock');
    }

    public function test_removing_an_item(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = Product::factory()->create(['stock_quantity' => 10]);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])->assertCreated();
        $item = Cart::first()->items()->first();

        $this->deleteJson("/api/v1/cart/items/{$item->id}")
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);

        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }

    public function test_a_user_cannot_modify_another_users_cart_item(): void
    {
        $owner = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 10]);
        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $item = Cart::first()->items()->first();

        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 2])->assertStatus(403);
        $this->deleteJson("/api/v1/cart/items/{$item->id}")->assertStatus(403);
    }

    public function test_cart_requires_authentication(): void
    {
        $this->getJson('/api/v1/cart')->assertStatus(401);
    }
}
