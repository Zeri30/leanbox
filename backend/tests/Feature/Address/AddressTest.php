<?php

namespace Tests\Feature\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_only_the_users_addresses_default_first(): void
    {
        $user = User::factory()->create();
        Address::factory()->nonDefault()->for($user)->create(['label' => 'Work']);
        Address::factory()->for($user)->create(['label' => 'Home', 'is_default' => true]);
        Address::factory()->create(); // another user's address

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/addresses')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.label', 'Home')
            ->assertJsonPath('data.0.is_default', true);
    }

    public function test_first_address_is_marked_default(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/addresses', [
            'recipient_name' => 'Maya Cruz',
            'phone' => '09171234567',
            'line1' => '123 Mabini St',
            'city' => 'Quezon City',
        ])
            ->assertCreated()
            ->assertJsonPath('data.is_default', true)
            ->assertJsonPath('data.recipient_name', 'Maya Cruz')
            ->assertJsonPath('data.country', 'Philippines');
    }

    public function test_new_default_unsets_the_previous_default(): void
    {
        $user = User::factory()->create();
        $first = Address::factory()->for($user)->create(['is_default' => true]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/addresses', [
            'recipient_name' => 'Maya Cruz',
            'phone' => '09171234567',
            'line1' => '456 Rizal Ave',
            'city' => 'Makati',
            'is_default' => true,
        ])->assertCreated()->assertJsonPath('data.is_default', true);

        $this->assertDatabaseHas('addresses', ['id' => $first->id, 'is_default' => false]);
        $this->assertSame(1, $user->addresses()->where('is_default', true)->count());
    }

    public function test_validation_requires_core_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/addresses', ['label' => 'Home'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_error')
            ->assertJsonStructure([
                'error' => ['details' => ['recipient_name', 'phone', 'line1', 'city']],
            ]);
    }

    public function test_addresses_require_authentication(): void
    {
        $this->getJson('/api/v1/addresses')->assertStatus(401);
        $this->postJson('/api/v1/addresses', [])->assertStatus(401);
    }
}
