<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Events\OrderStatusChanged;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendOrderNotifications implements ShouldQueue
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;

        // Always tell the customer about the status (incl. placement).
        $this->notifications->notify(
            $order->user_id,
            NotificationType::OrderUpdate,
            "Order {$order->order_number}",
            "Your order is now {$event->to->value}.",
        );

        // On placement (from null → pending), alert admins of a new order.
        if ($event->from === null) {
            User::query()->where('role', UserRole::Admin)->pluck('id')
                ->each(fn (int $adminId) => $this->notifications->notify(
                    $adminId,
                    NotificationType::NewOrder,
                    'New order',
                    "Order {$order->order_number} was placed.",
                ));
        }
    }
}
