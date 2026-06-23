<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Card = 'card';
    case Gcash = 'gcash';
    case Paypal = 'paypal';
    case Cod = 'cod';
}
