<?php

namespace Tests\Feature\Subscription;

use App\Enums\SubscriptionStatus;
use App\Events\SubscriptionRenewed;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RecurringBillingTest extends TestCase
{
    use RefreshDatabase;

    private function dueSubscription(): Subscription
    {
        $plan = SubscriptionPlan::factory()->create(['price' => 1499]);

        return Subscription::factory()->create([
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'next_delivery_date' => Carbon::today()->toDateString(),
        ]);
    }

    public function test_processing_a_due_cycle_creates_payment_and_delivery_and_advances_date(): void
    {
        Event::fake([SubscriptionRenewed::class]);
        $sub = $this->dueSubscription();

        app(SubscriptionService::class)->processCycle($sub);

        $this->assertSame(1, $sub->payments()->count());
        $this->assertSame(1, $sub->deliveries()->count());
        $this->assertTrue($sub->fresh()->next_delivery_date->isFuture());
        $this->assertDatabaseHas('subscription_payments', ['subscription_id' => $sub->id, 'status' => 'pending']);
        $this->assertDatabaseHas('deliveries', ['subscription_id' => $sub->id, 'order_id' => null, 'status' => 'pending']);
        Event::assertDispatched(SubscriptionRenewed::class);
    }

    public function test_processing_is_idempotent_per_cycle(): void
    {
        $sub = $this->dueSubscription();
        $service = app(SubscriptionService::class);

        $service->processCycle($sub);
        $service->processCycle($sub->fresh()); // already advanced -> no-op

        $this->assertSame(1, $sub->payments()->count());
        $this->assertSame(1, $sub->deliveries()->count());
    }

    public function test_subscriptions_not_yet_due_are_skipped(): void
    {
        $plan = SubscriptionPlan::factory()->create();
        $sub = Subscription::factory()->create([
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'next_delivery_date' => Carbon::tomorrow()->toDateString(),
        ]);

        app(SubscriptionService::class)->processCycle($sub);

        $this->assertSame(0, $sub->payments()->count());
    }

    public function test_paused_subscriptions_are_skipped(): void
    {
        $plan = SubscriptionPlan::factory()->create();
        $sub = Subscription::factory()->paused()->create([
            'plan_id' => $plan->id,
            'next_delivery_date' => Carbon::today()->toDateString(),
        ]);

        app(SubscriptionService::class)->processCycle($sub);

        $this->assertSame(0, $sub->payments()->count());
    }

    public function test_the_command_processes_only_due_active_subscriptions(): void
    {
        $due = $this->dueSubscription();
        $notDue = Subscription::factory()->create([
            'status' => SubscriptionStatus::Active,
            'next_delivery_date' => Carbon::tomorrow()->toDateString(),
        ]);
        $paused = Subscription::factory()->paused()->create([
            'next_delivery_date' => Carbon::today()->toDateString(),
        ]);

        $this->artisan('subscriptions:process-due')->assertSuccessful();

        $this->assertSame(1, $due->payments()->count());
        $this->assertSame(0, $notDue->payments()->count());
        $this->assertSame(0, $paused->payments()->count());
    }
}
