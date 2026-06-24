<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Generate due subscription cycles daily (payment + delivery per active, due subscription).
Schedule::command('subscriptions:process-due')->dailyAt('02:00');
