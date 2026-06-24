<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Events\StockChanged;
use App\Models\Product;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendLowStockNotification implements ShouldQueue
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(StockChanged $event): void
    {
        $product = Product::find($event->productId);

        if ($product === null || $product->stock_quantity > $product->low_stock_threshold) {
            return;
        }

        User::query()->where('role', UserRole::Admin)->pluck('id')
            ->each(fn (int $adminId) => $this->notifications->notify(
                $adminId,
                NotificationType::LowStock,
                'Low stock',
                "{$product->name} is low on stock ({$product->stock_quantity} left).",
            ));
    }
}
