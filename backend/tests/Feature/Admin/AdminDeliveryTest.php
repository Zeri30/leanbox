<?php

namespace Tests\Feature\Admin;

use App\Enums\DeliveryStatus;
use App\Events\DeliveryAssigned;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
    }

    public function test_admin_can_create_a_delivery_from_an_order(): void
    {
        $this->actingAdmin();
        $order = Order::factory()->create();

        $this->postJson('/api/v1/admin/deliveries', ['order_id' => $order->id])
            ->assertCreated()
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_an_order_cannot_have_two_deliveries(): void
    {
        $this->actingAdmin();
        $order = Order::factory()->create();

        $this->postJson('/api/v1/admin/deliveries', ['order_id' => $order->id])->assertCreated();
        $this->postJson('/api/v1/admin/deliveries', ['order_id' => $order->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'delivery_exists');
    }

    public function test_admin_can_create_a_delivery_from_a_subscription(): void
    {
        $this->actingAdmin();
        $subscription = Subscription::factory()->create();

        $this->postJson('/api/v1/admin/deliveries', ['subscription_id' => $subscription->id])
            ->assertCreated()
            ->assertJsonPath('data.subscription_id', $subscription->id);
    }

    public function test_must_supply_exactly_one_source(): void
    {
        $this->actingAdmin();
        $order = Order::factory()->create();
        $subscription = Subscription::factory()->create();

        $this->postJson('/api/v1/admin/deliveries', ['order_id' => $order->id, 'subscription_id' => $subscription->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');

        $this->postJson('/api/v1/admin/deliveries', [])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_admin_can_list_deliveries_filtered_by_status_and_rider(): void
    {
        $rider = User::factory()->rider()->create();
        Delivery::factory()->create(['status' => DeliveryStatus::Pending]);
        Delivery::factory()->assigned($rider->id)->create();
        $this->actingAdmin();

        $this->getJson('/api/v1/admin/deliveries?status=pending')
            ->assertOk()->assertJsonPath('meta.pagination.total', 1);

        $this->getJson("/api/v1/admin/deliveries?rider_id={$rider->id}")
            ->assertOk()->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_admin_can_assign_a_rider_and_the_rider_is_notified(): void
    {
        Event::fake([DeliveryAssigned::class]);
        $rider = User::factory()->rider()->create();
        $delivery = Delivery::factory()->create(['status' => DeliveryStatus::Pending]);
        $this->actingAdmin();

        $this->postJson("/api/v1/admin/deliveries/{$delivery->id}/assign", ['rider_id' => $rider->id])
            ->assertOk()
            ->assertJsonPath('data.status', 'assigned')
            ->assertJsonPath('data.rider_id', $rider->id);

        $this->assertNotNull($delivery->fresh()->assigned_at);
        Event::assertDispatched(DeliveryAssigned::class);
    }

    public function test_assigning_a_non_rider_is_rejected(): void
    {
        $customer = User::factory()->customer()->create();
        $delivery = Delivery::factory()->create();
        $this->actingAdmin();

        $this->postJson("/api/v1/admin/deliveries/{$delivery->id}/assign", ['rider_id' => $customer->id])
            ->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_admin_can_reassign_to_a_different_rider(): void
    {
        $riderA = User::factory()->rider()->create();
        $riderB = User::factory()->rider()->create();
        $delivery = Delivery::factory()->assigned($riderA->id)->create();
        $this->actingAdmin();

        $this->postJson("/api/v1/admin/deliveries/{$delivery->id}/assign", ['rider_id' => $riderB->id])
            ->assertOk()->assertJsonPath('data.rider_id', $riderB->id);
    }

    public function test_admin_can_mark_a_delivery_failed(): void
    {
        $delivery = Delivery::factory()->create(['status' => DeliveryStatus::Pending]);
        $this->actingAdmin();

        $this->patchJson("/api/v1/admin/deliveries/{$delivery->id}", ['status' => 'failed'])
            ->assertOk()->assertJsonPath('data.status', 'failed');
    }

    public function test_non_admins_cannot_manage_deliveries(): void
    {
        $delivery = Delivery::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/deliveries')->assertStatus(403);
        $this->postJson('/api/v1/admin/deliveries', ['order_id' => 1])->assertStatus(403);
        $this->postJson("/api/v1/admin/deliveries/{$delivery->id}/assign", ['rider_id' => 1])->assertStatus(403);
    }
}
