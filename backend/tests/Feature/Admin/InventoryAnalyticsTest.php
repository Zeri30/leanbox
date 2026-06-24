<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_stock_low_fires_a_low_stock_alert(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create(['stock_quantity' => 50, 'low_stock_threshold' => 10]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/products/{$product->id}/stock", ['stock_quantity' => 3])
            ->assertOk()->assertJsonPath('data.stock_quantity', 3);

        $this->assertSame(1, Notification::where('user_id', $admin->id)->where('type', 'low_stock')->count());
    }

    public function test_updating_stock_healthy_does_not_alert(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create(['stock_quantity' => 2, 'low_stock_threshold' => 10]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/products/{$product->id}/stock", ['stock_quantity' => 80])->assertOk();

        $this->assertSame(0, Notification::where('type', 'low_stock')->count());
    }

    public function test_low_stock_list_returns_only_active_low_products(): void
    {
        Product::factory()->create(['is_active' => true, 'stock_quantity' => 2, 'low_stock_threshold' => 10]);
        Product::factory()->create(['is_active' => true, 'stock_quantity' => 50, 'low_stock_threshold' => 10]);
        Product::factory()->create(['is_active' => false, 'stock_quantity' => 1, 'low_stock_threshold' => 10]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/inventory/low-stock')
            ->assertOk()->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_dashboard_summary_is_accurate(): void
    {
        Product::factory()->count(2)->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);
        Order::factory()->create(['status' => OrderStatus::Delivered, 'total' => 349]);
        Order::factory()->create(['status' => OrderStatus::Pending]);
        $sub = Subscription::factory()->create(['status' => SubscriptionStatus::Active]);
        SubscriptionPayment::factory()->create(['subscription_id' => $sub->id, 'status' => PaymentStatus::Paid, 'amount' => 1499]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.products', 2)
            ->assertJsonPath('data.orders', 2)
            ->assertJsonPath('data.active_subscriptions', 1)
            ->assertJsonPath('data.revenue', '1848.00'); // 349 delivered + 1499 paid sub
    }

    public function test_best_sellers_ranks_by_units_and_excludes_cancelled(): void
    {
        $a = Product::factory()->create(['name' => 'Top Seller']);
        $b = Product::factory()->create(['name' => 'Runner Up']);

        $order = Order::factory()->create(['status' => OrderStatus::Delivered]);
        $order->items()->create(['product_id' => $a->id, 'product_name' => $a->name, 'quantity' => 5, 'unit_price' => 10, 'line_total' => 50]);
        $order->items()->create(['product_id' => $b->id, 'product_name' => $b->name, 'quantity' => 2, 'unit_price' => 10, 'line_total' => 20]);

        $cancelled = Order::factory()->create(['status' => OrderStatus::Cancelled]);
        $cancelled->items()->create(['product_id' => $b->id, 'product_name' => $b->name, 'quantity' => 100, 'unit_price' => 10, 'line_total' => 1000]);

        Sanctum::actingAs(User::factory()->admin()->create());

        $res = $this->getJson('/api/v1/admin/analytics/best-sellers')->assertOk();
        $this->assertSame($a->id, $res->json('data.0.product_id'));
        $this->assertSame(5, $res->json('data.0.units'));
        $this->assertSame(2, $res->json('data.1.units')); // cancelled order's 100 excluded
    }

    public function test_non_admins_cannot_access_inventory_or_analytics(): void
    {
        $product = Product::factory()->create();
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/dashboard/summary')->assertStatus(403);
        $this->getJson('/api/v1/admin/analytics/best-sellers')->assertStatus(403);
        $this->getJson('/api/v1/admin/inventory/low-stock')->assertStatus(403);
        $this->patchJson("/api/v1/admin/products/{$product->id}/stock", ['stock_quantity' => 5])->assertStatus(403);
    }
}
