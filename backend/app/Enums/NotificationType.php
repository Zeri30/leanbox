<?php

namespace App\Enums;

enum NotificationType: string
{
    case OrderUpdate = 'order_update';
    case Subscription = 'subscription';
    case Promotion = 'promotion';
    case NewOrder = 'new_order';
    case LowStock = 'low_stock';
    case DeliveryAssigned = 'delivery_assigned';
    case System = 'system';
}
