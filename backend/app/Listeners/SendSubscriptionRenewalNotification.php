<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\SubscriptionRenewed;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSubscriptionRenewalNotification implements ShouldQueue
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(SubscriptionRenewed $event): void
    {
        $this->notifications->notify(
            $event->subscription->user_id,
            NotificationType::Subscription,
            'Subscription renewed',
            'Your next meal-prep cycle has been scheduled.',
        );
    }
}
