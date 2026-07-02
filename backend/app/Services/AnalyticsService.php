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
     * Daily gross revenue for the last $days days (delivered orders + paid subscription
     * payments), zero-filled so the chart always has a continuous axis. Bucketed in PHP
     * to stay portable across Postgres (dev) and SQLite (tests); cached briefly.
     *
     * @return array<int, array{date: string, revenue: string}>
     */
    public function revenueSeries(int $days = 30): array
    {
        $days = max(7, min($days, 90));
        $start = now()->startOfDay()->subDays($days - 1);

        return Cache::remember("admin.dashboard.revenue.{$days}", now()->addSeconds(60), function () use ($days, $start) {
            // Zero-filled buckets keyed by Y-m-d, oldest first.
            $buckets = [];
            for ($i = 0; $i < $days; $i++) {
                $buckets[$start->copy()->addDays($i)->toDateString()] = 0.0;
            }

            $add = function ($createdAt, $amount) use (&$buckets): void {
                $key = $createdAt?->toDateString();
                if ($key !== null && isset($buckets[$key])) {
                    $buckets[$key] += (float) $amount;
                }
            };

            Order::query()
                ->where('status', OrderStatus::Delivered)
                ->where('created_at', '>=', $start)
                ->get(['created_at', 'total'])
                ->each(fn (Order $o) => $add($o->created_at, $o->total));

            SubscriptionPayment::query()
                ->where('status', PaymentStatus::Paid)
                ->where('created_at', '>=', $start)
                ->get(['created_at', 'amount'])
                ->each(fn (SubscriptionPayment $p) => $add($p->created_at, $p->amount));

            return array_map(
                fn (string $date, float $revenue) => ['date' => $date, 'revenue' => sprintf('%.2f', $revenue)],
                array_keys($buckets),
                array_values($buckets),
            );
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
