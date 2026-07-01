<?php

namespace Tests\Feature\Notification;

use App\Enums\OrderStatus;
use App\Events\DeliveryAssigned;
use App\Events\OrderStatusChanged;
use App\Events\StockChanged;
use App\Events\SubscriptionRenewed;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_placing_an_order_notifies_the_customer_and_admins(): void
    {
        $customer = User::factory()->customer()->create();
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['user_id' => $customer->id]);

        event(new OrderStatusChanged($order, null, OrderStatus::Pending));

        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'type' => 'order_update']);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'type' => 'new_order']);
    }

    public function test_status_change_notifies_only_the_customer(): void
    {
        $customer = User::factory()->customer()->create();
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['user_id' => $customer->id]);

        event(new OrderStatusChanged($order, OrderStatus::Pending, OrderStatus::Confirmed));

        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'type' => 'order_update']);
        $this->assertDatabaseMissing('notifications', ['user_id' => $admin->id, 'type' => 'new_order']);
    }

    public function test_subscription_renewal_notifies_the_customer(): void
    {
        $sub = Subscription::factory()->create();
        $payment = SubscriptionPayment::factory()->create(['subscription_id' => $sub->id]);

        event(new SubscriptionRenewed($sub, $payment));

        $this->assertDatabaseHas('notifications', ['user_id' => $sub->user_id, 'type' => 'subscription']);
    }

    public function test_delivery_assignment_notifies_the_rider(): void
    {
        $rider = User::factory()->rider()->create();
        $delivery = Delivery::factory()->assigned($rider->id)->create();

        event(new DeliveryAssigned($delivery));

        $this->assertDatabaseHas('notifications', ['user_id' => $rider->id, 'type' => 'delivery_assigned']);
    }

    public function test_low_stock_notifies_admins_but_healthy_stock_does_not(): void
    {
        $admin = User::factory()->admin()->create();
        $low = Product::factory()->create(['stock_quantity' => 2, 'low_stock_threshold' => 10]);
        $healthy = Product::factory()->create(['stock_quantity' => 50, 'low_stock_threshold' => 10]);

        event(new StockChanged($low->id));
        event(new StockChanged($healthy->id));

        $this->assertSame(1, Notification::where('user_id', $admin->id)->where('type', 'low_stock')->count());
    }

    public function test_feed_returns_notifications_with_unread_count(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(2)->unread()->create(['user_id' => $user->id]);
        Notification::factory()->create(['user_id' => $user->id, 'is_read' => true]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 2)
            ->assertJsonPath('meta.pagination.total', 3);
    }

    public function test_unread_count_endpoint_returns_only_the_users_unread_total(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->unread()->create(['user_id' => $user->id]);
        Notification::factory()->create(['user_id' => $user->id, 'is_read' => true]);
        Notification::factory()->count(5)->unread()->create(); // other users
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.count', 3);
    }

    public function test_unread_count_requires_authentication(): void
    {
        $this->getJson('/api/v1/notifications/unread-count')->assertStatus(401);
    }

    public function test_marking_a_notification_read(): void
    {
        $user = User::factory()->create();
        $note = Notification::factory()->unread()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/notifications/{$note->id}/read")
            ->assertOk()->assertJsonPath('data.is_read', true);

        $this->assertTrue($note->fresh()->is_read);
    }

    public function test_cannot_mark_another_users_notification_read(): void
    {
        $note = Notification::factory()->unread()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/notifications/{$note->id}/read")->assertStatus(403);
    }

    public function test_feed_requires_authentication(): void
    {
        $this->getJson('/api/v1/notifications')->assertStatus(401);
    }
}
