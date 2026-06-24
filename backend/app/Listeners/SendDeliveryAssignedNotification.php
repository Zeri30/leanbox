<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\DeliveryAssigned;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendDeliveryAssignedNotification implements ShouldQueue
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(DeliveryAssigned $event): void
    {
        if ($event->delivery->rider_id === null) {
            return;
        }

        $this->notifications->notify(
            $event->delivery->rider_id,
            NotificationType::DeliveryAssigned,
            'New delivery assigned',
            'You have a new delivery to fulfill.',
        );
    }
}
