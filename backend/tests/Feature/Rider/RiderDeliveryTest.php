<?php

namespace Tests\Feature\Rider;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusChanged;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderDeliveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_rider_sees_only_their_assigned_deliveries(): void
    {
        $rider = User::factory()->rider()->create();
        Delivery::factory()->assigned($rider->id)->create();
        Delivery::factory()->assigned(User::factory()->rider()->create()->id)->create();
        Sanctum::actingAs($rider);

        $this->getJson('/api/v1/rider/deliveries')
            ->assertOk()->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_rider_can_mark_out_for_delivery(): void
    {
        $rider = User::factory()->rider()->create();
        $delivery = Delivery::factory()->assigned($rider->id)->create(['status' => DeliveryStatus::Assigned]);
        Sanctum::actingAs($rider);

        $this->patchJson("/api/v1/rider/deliveries/{$delivery->id}/status", ['status' => 'out_for_delivery'])
            ->assertOk()->assertJsonPath('data.status', 'out_for_delivery');
    }

    public function test_marking_delivered_syncs_the_order_and_marks_cod_paid(): void
    {
        Event::fake([OrderStatusChanged::class]);
        $rider = User::factory()->rider()->create();
        $order = Order::factory()->create(['status' => OrderStatus::Shipped]);
        $order->payment()->create(['method' => 'cod', 'status' => 'pending', 'amount' => $order->total]);
        $delivery = Delivery::factory()->create([
            'order_id' => $order->id,
            'delivery_address_id' => $order->delivery_address_id,
            'rider_id' => $rider->id,
            'status' => DeliveryStatus::OutForDelivery,
        ]);
        Sanctum::actingAs($rider);

        $this->patchJson("/api/v1/rider/deliveries/{$delivery->id}/status", ['status' => 'delivered'])
            ->assertOk()->assertJsonPath('data.status', 'delivered');

        $this->assertNotNull($delivery->fresh()->delivered_at);
        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Paid, $order->payment->fresh()->status);
        Event::assertDispatched(OrderStatusChanged::class);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $rider = User::factory()->rider()->create();
        $delivery = Delivery::factory()->assigned($rider->id)->create(['status' => DeliveryStatus::Assigned]);
        Sanctum::actingAs($rider);

        // assigned cannot jump straight to delivered
        $this->patchJson("/api/v1/rider/deliveries/{$delivery->id}/status", ['status' => 'delivered'])
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_transition');
    }

    public function test_a_rider_cannot_touch_another_riders_delivery(): void
    {
        $otherDelivery = Delivery::factory()->assigned(User::factory()->rider()->create()->id)->create();
        Sanctum::actingAs(User::factory()->rider()->create());

        $this->patchJson("/api/v1/rider/deliveries/{$otherDelivery->id}/status", ['status' => 'out_for_delivery'])
            ->assertStatus(403);
    }

    public function test_rider_can_upload_proof_of_delivery(): void
    {
        Storage::fake('supabase');
        $rider = User::factory()->rider()->create();
        $delivery = Delivery::factory()->assigned($rider->id)->create();
        Sanctum::actingAs($rider);

        $this->post(
            "/api/v1/rider/deliveries/{$delivery->id}/proof",
            ['image' => UploadedFile::fake()->create('proof.jpg', 120, 'image/jpeg'), 'notes' => 'Left with guard.'],
            ['Accept' => 'application/json'],
        )->assertOk();

        $fresh = $delivery->fresh();
        $this->assertNotNull($fresh->proof_image_url);
        $this->assertSame('Left with guard.', $fresh->delivery_notes);
        $this->assertNotEmpty(Storage::disk('supabase')->allFiles());
    }

    public function test_non_riders_cannot_access_rider_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/rider/deliveries')->assertStatus(403);
    }
}
