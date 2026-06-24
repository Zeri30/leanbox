<?php

namespace Tests\Feature\Subscription;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManageSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_lists_only_their_subscriptions(): void
    {
        $user = User::factory()->create();
        Subscription::factory()->count(2)->create(['user_id' => $user->id]);
        Subscription::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/subscriptions')
            ->assertOk()->assertJsonPath('meta.pagination.total', 2);
    }

    public function test_a_user_cannot_view_another_users_subscription(): void
    {
        $other = Subscription::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/v1/subscriptions/{$other->id}")->assertStatus(403);
    }

    public function test_pause_an_active_subscription(): void
    {
        $user = User::factory()->create();
        $sub = Subscription::factory()->create(['user_id' => $user->id, 'status' => SubscriptionStatus::Active]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/subscriptions/{$sub->id}", ['action' => 'pause'])
            ->assertOk()->assertJsonPath('data.status', 'paused');
    }

    public function test_resume_a_paused_subscription_reschedules_delivery(): void
    {
        $user = User::factory()->create();
        $sub = Subscription::factory()->paused()->create(['user_id' => $user->id, 'next_delivery_date' => null]);
        Sanctum::actingAs($user);

        $res = $this->patchJson("/api/v1/subscriptions/{$sub->id}", ['action' => 'resume'])
            ->assertOk()->assertJsonPath('data.status', 'active');

        $this->assertNotNull($res->json('data.next_delivery_date'));
    }

    public function test_cancel_a_subscription(): void
    {
        $user = User::factory()->create();
        $sub = Subscription::factory()->create(['user_id' => $user->id, 'status' => SubscriptionStatus::Active]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/subscriptions/{$sub->id}", ['action' => 'cancel'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.next_delivery_date', null);

        $this->assertNotNull($sub->fresh()->cancelled_at);
    }

    public function test_invalid_action_for_current_state_is_rejected(): void
    {
        $user = User::factory()->create();
        $sub = Subscription::factory()->paused()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        // Can't pause an already-paused subscription.
        $this->patchJson("/api/v1/subscriptions/{$sub->id}", ['action' => 'pause'])
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_action');
    }

    public function test_a_user_cannot_manage_another_users_subscription(): void
    {
        $other = Subscription::factory()->create(['status' => SubscriptionStatus::Active]);
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/subscriptions/{$other->id}", ['action' => 'cancel'])->assertStatus(403);
    }

    public function test_managing_requires_authentication(): void
    {
        $this->getJson('/api/v1/subscriptions')->assertStatus(401);
    }
}
