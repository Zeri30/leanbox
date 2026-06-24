<?php

use App\Services\Payments\CodGateway;

return [

    /*
    | Default payment method. COD only for now (Stripe/PayMongo deferred).
    */
    'default_method' => env('PAYMENTS_DEFAULT_METHOD', 'cod'),

    /*
    | Map a payment method to its gateway implementation. Add 'gcash'/'card'
    | entries here when those gateways are introduced — no other code changes.
    */
    'gateways' => [
        'cod' => CodGateway::class,
    ],

];
