<?php

namespace Tests\Feature\Admin;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_lists_subscriptions_with_customer_and_plan(): void
    {
        Subscription::factory()->count(2)->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $res = $this->getJson('/api/v1/admin/subscriptions')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 2);

        // Admin listing eager-loads the customer + plan onto each row.
        $this->assertNotNull($res->json('data.0.user.email'));
        $this->assertNotNull($res->json('data.0.plan.name'));
    }

    public function test_index_filters_by_status(): void
    {
        Subscription::factory()->create(); // active
        Subscription::factory()->cancelled()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/subscriptions?status=cancelled')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.status', 'cancelled');
    }

    public function test_index_searches_by_customer(): void
    {
        $alice = User::factory()->customer()->create(['full_name' => 'Alice Cruz']);
        Subscription::factory()->create(['user_id' => $alice->id]);
        Subscription::factory()->create(); // someone else
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/subscriptions?search=Alice')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.user.full_name', 'Alice Cruz');
    }

    public function test_show_returns_a_single_subscription_with_payments(): void
    {
        $sub = Subscription::factory()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson("/api/v1/admin/subscriptions/{$sub->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $sub->id)
            ->assertJsonPath('data.user.id', $sub->user_id);
    }

    public function test_non_admins_cannot_access_admin_subscriptions(): void
    {
        $sub = Subscription::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/subscriptions')->assertStatus(403);
        $this->getJson("/api/v1/admin/subscriptions/{$sub->id}")->assertStatus(403);
    }
}
