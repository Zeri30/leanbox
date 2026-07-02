<?php

namespace Tests\Feature\Admin;

use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_lists_all_reviews_with_product_and_reviewer(): void
    {
        Review::factory()->count(2)->create();
        Review::factory()->hidden()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $res = $this->getJson('/api/v1/admin/reviews')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 3);

        $this->assertNotNull($res->json('data.0.product_name'));
        $this->assertNotNull($res->json('data.0.reviewer'));
    }

    public function test_index_filters_by_hidden_flag(): void
    {
        Review::factory()->create();
        Review::factory()->hidden()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/reviews?hidden=1')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.is_hidden', true);

        $this->getJson('/api/v1/admin/reviews?hidden=0')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.is_hidden', false);
    }

    public function test_admin_can_hide_and_unhide_a_review(): void
    {
        $review = Review::factory()->create(['is_hidden' => false]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/reviews/{$review->id}", ['is_hidden' => true])
            ->assertOk()->assertJsonPath('data.is_hidden', true);
        $this->assertTrue($review->fresh()->is_hidden);

        $this->patchJson("/api/v1/admin/reviews/{$review->id}", ['is_hidden' => false])
            ->assertOk()->assertJsonPath('data.is_hidden', false);
    }

    public function test_stats_reports_totals_and_distribution(): void
    {
        Review::factory()->create(['rating' => 5]);
        Review::factory()->create(['rating' => 3]);
        Review::factory()->hidden()->create(['rating' => 1]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/reviews/stats')
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.hidden', 1)
            ->assertJsonPath('data.visible', 2);
    }

    public function test_non_admins_cannot_access_admin_reviews(): void
    {
        $review = Review::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/reviews')->assertStatus(403);
        $this->getJson('/api/v1/admin/reviews/stats')->assertStatus(403);
        $this->patchJson("/api/v1/admin/reviews/{$review->id}", ['is_hidden' => true])->assertStatus(403);
    }
}
