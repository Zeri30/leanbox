<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->randomElement(['Home', 'Work', 'Condo']),
            'recipient_name' => fake()->name(),
            'phone' => fake()->numerify('09#########'),
            'line1' => fake()->streetAddress(),
            'line2' => fake()->optional()->secondaryAddress(),
            'city' => fake()->city(),
            'state' => fake()->randomElement(['Metro Manila', 'Cebu', 'Davao']),
            'postal_code' => fake()->postcode(),
            'country' => 'Philippines',
            'is_default' => true,
        ];
    }

    public function nonDefault(): static
    {
        return $this->state(fn (array $attributes) => ['is_default' => false]);
    }
}
