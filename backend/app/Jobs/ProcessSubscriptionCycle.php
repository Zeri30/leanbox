<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/** Processes one due subscription cycle on the (database) queue. */
class ProcessSubscriptionCycle implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $subscriptionId) {}

    public function handle(SubscriptionService $subscriptions): void
    {
        $subscription = Subscription::find($this->subscriptionId);

        if ($subscription !== null) {
            $subscriptions->processCycle($subscription);
        }
    }
}
