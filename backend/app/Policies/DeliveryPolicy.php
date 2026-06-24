<?php

namespace App\Policies;

use App\Models\Delivery;
use App\Models\User;

class DeliveryPolicy
{
    /** Admins see all deliveries; riders see only the ones assigned to them. */
    public function view(User $user, Delivery $delivery): bool
    {
        return $user->isAdmin() || ($user->isRider() && $delivery->rider_id === $user->id);
    }

    public function update(User $user, Delivery $delivery): bool
    {
        return $this->view($user, $delivery);
    }
}
