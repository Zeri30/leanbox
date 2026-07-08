<?php

namespace App\Listeners;

use App\Enums\DeliveryStatus;
use App\Enums\NotificationType;
use App\Events\DeliveryStatusChanged;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notify the customer as a rider advances their delivery. Order-linked deliveries
 * already announce "delivered" through the order status change, so here we only add
 * the "out for delivery" notice for orders; subscription-cycle deliveries have no
 * backing order, so they get both notices from here.
 */
class SendDeliveryStatusNotification implements ShouldQueue
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(DeliveryStatusChanged $event): void
    {
        $delivery = $event->delivery;
        $customerId = $delivery->customerId();

        if ($customerId === null) {
            return;
        }

        $isSubscription = $delivery->subscription_id !== null;
        $type = $isSubscription ? NotificationType::Subscription : NotificationType::OrderUpdate;
        $label = $isSubscription ? 'meal-prep delivery' : 'order';

        if ($event->to === DeliveryStatus::OutForDelivery) {
            $this->notifications->notify(
                $customerId,
                $type,
                'On the way',
                "Your {$label} is out for delivery.",
            );

            return;
        }

        // Order deliveries already notify on delivered via the order status change.
        if ($event->to === DeliveryStatus::Delivered && $isSubscription) {
            $this->notifications->notify(
                $customerId,
                $type,
                'Delivered',
                'Your meal-prep delivery has arrived.',
            );
        }
    }
}
