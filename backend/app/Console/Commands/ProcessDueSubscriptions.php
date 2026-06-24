<?php

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Jobs\ProcessSubscriptionCycle;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ProcessDueSubscriptions extends Command
{
    protected $signature = 'subscriptions:process-due';

    protected $description = 'Queue a billing/delivery cycle for every active subscription that is due.';

    public function handle(): int
    {
        $due = Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->whereNotNull('next_delivery_date')
            ->whereDate('next_delivery_date', '<=', Carbon::today())
            ->pluck('id');

        $due->each(fn (int $id) => ProcessSubscriptionCycle::dispatch($id));

        $this->info("Queued {$due->count()} due subscription(s).");

        return self::SUCCESS;
    }
}
