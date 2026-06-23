<?php

namespace Database\Factories;

use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(NotificationType::cases()),
            'title' => fake()->sentence(4),
            'message' => fake()->sentence(),
            'is_read' => fake()->boolean(40),
        ];
    }

    public function unread(): static
    {
        return $this->state(fn (array $attributes) => ['is_read' => false]);
    }
}
