<?php

namespace App\Enums;

enum DeliverySchedule: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';
}
