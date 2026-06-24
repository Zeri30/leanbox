<?php

namespace App\Enums;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

enum DeliverySchedule: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';

    /** The next delivery/cycle date from a given point. */
    public function nextDateFrom(CarbonInterface $from): Carbon
    {
        return match ($this) {
            self::Daily => Carbon::instance($from)->addDay(),
            self::Weekly => Carbon::instance($from)->addWeek(),
            self::Biweekly => Carbon::instance($from)->addWeeks(2),
        };
    }
}
