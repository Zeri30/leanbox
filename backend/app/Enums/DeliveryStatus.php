<?php

namespace App\Enums;

enum DeliveryStatus: string
{
    case Pending = 'pending';
    case Assigned = 'assigned';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case Failed = 'failed';

    /**
     * Allowed lifecycle transitions (pending→assigned is the admin assign action).
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Assigned],
            self::Assigned => [self::OutForDelivery, self::Failed],
            self::OutForDelivery => [self::Delivered, self::Failed],
            self::Delivered, self::Failed => [],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTransitions(), true);
    }
}
