<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Cache;

class AnalyticsService
{
    /** Dashboard totals; cached briefly to keep the admin home fast. */
    public function summary(): array
    {
        return Cache::remember('admin.dashboard.summary', now()->addSeconds(60), function () {
            $orderRevenue = (float) Order::where('status', OrderStatus::Delivered)->sum('total');
            $subscriptionRevenue = (float) SubscriptionPayment::where('status', PaymentStatus::Paid)->sum('amount');

            return [
                'products' => Product::where('is_active', true)->count(),
                'orders' => Order::count(),
                'active_subscriptions' => Subscription::where('status', SubscriptionStatus::Active)->count(),
                'revenue' => sprintf('%.2f', $orderRevenue + $subscriptionRevenue),
            ];
        });
    }

    /**
     * Best-selling products ranked by units sold (then revenue), excluding cancelled orders.
     *
     * @return array<int, array<string, mixed>>
     */
    public function bestSellers(int $limit = 10): array
    {
        return OrderItem::query()
            ->select('product_id')
            ->selectRaw('SUM(quantity) as units')
            ->selectRaw('SUM(line_total) as revenue')
            ->whereHas('order', fn ($q) => $q->where('status', '!=', OrderStatus::Cancelled))
            ->groupBy('product_id')
            ->orderByDesc('units')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->with('product:id,name,slug')
            ->get()
            ->map(fn (OrderItem $row) => [
                'product_id' => $row->product_id,
                'name' => $row->product?->name,
                'units' => (int) $row->units,
                'revenue' => sprintf('%.2f', (float) $row->revenue),
            ])
            ->all();
    }
}
