<?php

namespace Tests\Feature\Review;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private function deliveredOrderWith(User $user, Product $product): Order
    {
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => OrderStatus::Delivered]);
        $order->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'quantity' => 1, 'unit_price' => $product->price, 'line_total' => $product->price,
        ]);

        return $order;
    }

    public function test_a_customer_with_a_delivered_order_can_review(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $this->deliveredOrderWith($user, $product);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 5, 'comment' => 'Great!'])
            ->assertCreated()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.product_id', $product->id);
    }

    public function test_cannot_review_without_a_delivered_order(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 5])
            ->assertStatus(422)->assertJsonPath('error.code', 'not_eligible');
    }

    public function test_cannot_review_when_order_is_not_yet_delivered(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => OrderStatus::Pending]);
        $order->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'quantity' => 1, 'unit_price' => $product->price, 'line_total' => $product->price,
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 4])
            ->assertStatus(422)->assertJsonPath('error.code', 'not_eligible');
    }

    public function test_cannot_review_the_same_product_twice(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $this->deliveredOrderWith($user, $product);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 5])->assertCreated();
        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 4])
            ->assertStatus(422)->assertJsonPath('error.code', 'already_reviewed');
    }

    public function test_rating_is_validated(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $this->deliveredOrderWith($user, $product);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 6])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_public_listing_excludes_hidden_reviews(): void
    {
        $product = Product::factory()->create();
        Review::factory()->for($product)->create(['rating' => 5]);
        Review::factory()->for($product)->hidden()->create(['rating' => 1]);

        $this->getJson("/api/v1/products/{$product->id}/reviews")
            ->assertOk()->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_a_user_can_list_their_own_reviews(): void
    {
        $user = User::factory()->create();
        Review::factory()->count(2)->create(['user_id' => $user->id]);
        Review::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reviews/me')->assertOk()->assertJsonPath('meta.pagination.total', 2);
    }

    public function test_my_reviews_include_the_product_name(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Rainbow Buddha Bowl']);
        Review::factory()->for($product)->create(['user_id' => $user->id, 'rating' => 5]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reviews/me')
            ->assertOk()
            ->assertJsonPath('data.0.product_name', 'Rainbow Buddha Bowl');
    }

    public function test_admin_can_hide_a_review_and_it_disappears_from_the_storefront(): void
    {
        $product = Product::factory()->create();
        $review = Review::factory()->for($product)->create(['rating' => 5]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/reviews/{$review->id}", ['is_hidden' => true])
            ->assertOk()->assertJsonPath('data.is_hidden', true);

        $this->getJson("/api/v1/products/{$product->id}/reviews")
            ->assertOk()->assertJsonPath('meta.pagination.total', 0);
        $this->assertDatabaseHas('reviews', ['id' => $review->id]); // retained, not deleted
    }

    public function test_admin_review_stats(): void
    {
        $product = Product::factory()->create();
        Review::factory()->for($product)->create(['rating' => 4]);
        Review::factory()->for($product)->create(['rating' => 5]);
        Review::factory()->for($product)->hidden()->create(['rating' => 1]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/reviews/stats')
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.hidden', 1)
            ->assertJsonPath('data.visible', 2)
            ->assertJsonPath('data.average_rating', 4.5);
    }

    public function test_non_admins_cannot_moderate_or_view_stats(): void
    {
        $review = Review::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->patchJson("/api/v1/admin/reviews/{$review->id}", ['is_hidden' => true])->assertStatus(403);
        $this->getJson('/api/v1/admin/reviews/stats')->assertStatus(403);
    }

    public function test_reviewing_requires_authentication(): void
    {
        $product = Product::factory()->create();
        $this->postJson("/api/v1/products/{$product->id}/reviews", ['rating' => 5])->assertStatus(401);
    }
}
