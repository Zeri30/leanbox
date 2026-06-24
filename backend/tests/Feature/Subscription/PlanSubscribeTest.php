<?php

namespace Tests\Feature\Subscription;

use App\Enums\SubscriptionStatus;
use App\Models\Address;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanSubscribeTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_plans_endpoint_returns_only_active_plans(): void
    {
        SubscriptionPlan::factory()->create(['is_active' => true]);
        SubscriptionPlan::factory()->create(['is_active' => false]);

        $res = $this->getJson('/api/v1/plans')->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_admin_can_crud_plans(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $id = $this->postJson('/api/v1/admin/plans', [
            'name' => 'Veggie Starter', 'meal_type' => 'vegetarian', 'price' => 1499,
            'billing_interval' => 'weekly', 'meals_per_cycle' => 5,
        ])->assertCreated()->assertJsonPath('data.is_active', true)->json('data.id');

        $this->getJson('/api/v1/admin/plans')->assertOk()->assertJsonPath('data.0.id', $id);

        $this->patchJson("/api/v1/admin/plans/{$id}", ['price' => 1599])
            ->assertOk()->assertJsonPath('data.price', '1599.00');

        $this->deleteJson("/api/v1/admin/plans/{$id}")->assertOk();
        $this->assertDatabaseHas('subscription_plans', ['id' => $id, 'is_active' => false]);
    }

    public function test_non_admins_cannot_manage_plans(): void
    {
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/plans')->assertStatus(403);
        $this->postJson('/api/v1/admin/plans', [])->assertStatus(403);
    }

    public function test_a_customer_can_subscribe_and_gets_a_first_pending_payment(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $plan = SubscriptionPlan::factory()->create(['price' => 1499, 'is_active' => true]);
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/subscriptions', [
            'plan_id' => $plan->id,
            'delivery_address_id' => $address->id,
            'delivery_schedule' => 'weekly',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.delivery_schedule', 'weekly')
            ->assertJsonPath('data.plan.id', $plan->id)
            ->assertJsonPath('data.payments.0.status', 'pending')
            ->assertJsonPath('data.payments.0.amount', '1499.00');

        $this->assertSame(Carbon::now()->addWeek()->toDateString(), $res->json('data.next_delivery_date'));
        $this->assertSame(1, Subscription::first()->payments()->count());
        $this->assertSame(SubscriptionStatus::Active, Subscription::first()->status);
    }

    public function test_cannot_subscribe_to_an_inactive_plan(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id]);
        $plan = SubscriptionPlan::factory()->create(['is_active' => false]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/subscriptions', [
            'plan_id' => $plan->id, 'delivery_address_id' => $address->id, 'delivery_schedule' => 'weekly',
        ])->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_cannot_subscribe_with_another_users_address(): void
    {
        $user = User::factory()->create();
        $plan = SubscriptionPlan::factory()->create(['is_active' => true]);
        $foreignAddress = Address::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/subscriptions', [
            'plan_id' => $plan->id, 'delivery_address_id' => $foreignAddress->id, 'delivery_schedule' => 'weekly',
        ])->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_subscribing_requires_authentication(): void
    {
        $this->postJson('/api/v1/subscriptions', [])->assertStatus(401);
    }
}
