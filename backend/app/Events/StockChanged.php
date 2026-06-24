<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a product's stock changes (order placed/cancelled).
 * The Inventory epic listens to raise low-stock alerts.
 */
class StockChanged
{
    use Dispatchable;

    public function __construct(public readonly int $productId) {}
}
