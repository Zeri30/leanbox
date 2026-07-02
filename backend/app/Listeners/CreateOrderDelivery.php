<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Services\DeliveryService;

/**
 * Once an order is accepted (confirmed) — or reaches any later fulfilment stage —
 * ensure it has a delivery so admins can assign a rider and the order can be
 * completed. Runs synchronously (not queued) so the delivery shows up immediately.
 * Idempotent: skips when a delivery already exists, so re-firing on later
 * transitions never duplicates.
 */
class CreateOrderDelivery
{
    /** Order statuses at which a delivery should exist. */
    private const FULFILMENT_STATUSES = [
        OrderStatus::Confirmed,
        OrderStatus::Preparing,
        OrderStatus::Shipped,
    ];

    public function __construct(private readonly DeliveryService $deliveries) {}

    public function handle(OrderStatusChanged $event): void
    {
        if (! in_array($event->to, self::FULFILMENT_STATUSES, true)) {
            return;
        }

        if ($event->order->delivery()->exists()) {
            return;
        }

        $this->deliveries->createFromOrder($event->order);
    }
}
