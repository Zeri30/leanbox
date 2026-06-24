<?php

namespace App\Services;

use App\Enums\DeliverySchedule;
use App\Enums\DeliveryStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Events\SubscriptionRenewed;
use App\Exceptions\SubscriptionException;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    /**
     * Subscribe a user to a plan: create the subscription and the first cycle's
     * (COD, pending) payment row. No upfront card charge (Cashier deferred).
     *
     * @param  array{plan_id:int, delivery_address_id:int, delivery_schedule:string}  $data
     */
    public function subscribe(User $user, array $data): Subscription
    {
        return DB::transaction(function () use ($user, $data) {
            $plan = SubscriptionPlan::findOrFail($data['plan_id']);
            $schedule = DeliverySchedule::from($data['delivery_schedule']);

            $subscription = $user->subscriptions()->create([
                'plan_id' => $plan->id,
                'delivery_address_id' => $data['delivery_address_id'],
                'status' => SubscriptionStatus::Active,
                'delivery_schedule' => $schedule,
                'start_date' => now()->toDateString(),
                'next_delivery_date' => $schedule->nextDateFrom(now())->toDateString(),
            ]);

            // First cycle billed as COD (collected on delivery).
            $subscription->payments()->create([
                'amount' => $plan->price,
                'status' => PaymentStatus::Pending,
                'billing_date' => now()->toDateString(),
            ]);

            return $subscription;
        });
    }

    /** Pause an active subscription (halts cycle generation). */
    public function pause(Subscription $subscription): Subscription
    {
        if ($subscription->status !== SubscriptionStatus::Active) {
            throw new SubscriptionException('invalid_action', 'Only an active subscription can be paused.');
        }

        $subscription->update(['status' => SubscriptionStatus::Paused]);

        return $subscription;
    }

    /** Resume a paused subscription and reschedule the next delivery. */
    public function resume(Subscription $subscription): Subscription
    {
        if ($subscription->status !== SubscriptionStatus::Paused) {
            throw new SubscriptionException('invalid_action', 'Only a paused subscription can be resumed.');
        }

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'next_delivery_date' => $subscription->delivery_schedule->nextDateFrom(now())->toDateString(),
        ]);

        return $subscription;
    }

    /** Cancel a subscription (stops all future cycles). */
    public function cancel(Subscription $subscription): Subscription
    {
        if ($subscription->status === SubscriptionStatus::Cancelled) {
            throw new SubscriptionException('invalid_action', 'Subscription is already cancelled.');
        }

        $subscription->update([
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now()->toDateString(),
            'next_delivery_date' => null,
        ]);

        return $subscription;
    }

    /**
     * Process one due cycle for an active subscription: record a (COD, pending)
     * subscription_payment, create the cycle's delivery, advance next_delivery_date,
     * and emit a renewal event. Idempotent per cycle (skips if not due or already billed).
     */
    public function processCycle(Subscription $subscription): ?SubscriptionPayment
    {
        $subscription->loadMissing('plan');

        if ($subscription->status !== SubscriptionStatus::Active || $subscription->next_delivery_date === null) {
            return null;
        }

        // Only when due (next delivery date is today or past).
        if ($subscription->next_delivery_date->greaterThan(Carbon::today())) {
            return null;
        }

        $cycleDate = $subscription->next_delivery_date->toDateString();

        // Idempotency: never bill the same cycle twice.
        if ($subscription->payments()->whereDate('billing_date', $cycleDate)->exists()) {
            return null;
        }

        $payment = null;

        DB::transaction(function () use ($subscription, $cycleDate, &$payment) {
            $payment = $subscription->payments()->create([
                'amount' => $subscription->plan->price,
                'status' => PaymentStatus::Pending, // COD — collected on delivery
                'billing_date' => $cycleDate,
            ]);

            $subscription->deliveries()->create([
                'delivery_address_id' => $subscription->delivery_address_id,
                'status' => DeliveryStatus::Pending,
            ]);

            $subscription->update([
                'next_delivery_date' => $subscription->delivery_schedule
                    ->nextDateFrom($subscription->next_delivery_date)
                    ->toDateString(),
            ]);
        });

        SubscriptionRenewed::dispatch($subscription, $payment);

        return $payment;
    }
}
