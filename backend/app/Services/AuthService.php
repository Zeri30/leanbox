<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;

class AuthService
{
    /**
     * Register a new customer. Password is hashed by the User model's 'hashed' cast.
     *
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): User
    {
        return User::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => UserRole::Customer,
            'status' => UserStatus::Active,
        ]);
    }
}
