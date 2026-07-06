<?php

namespace Tests\Feature\Address;

use App\Models\Address;
use App\Models\Order;
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

    public function test_a_user_can_update_their_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->for($user)->create(['label' => 'Home', 'city' => 'Makati']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/addresses/{$address->id}", [
            'label' => 'Work',
            'recipient_name' => 'Maya Cruz',
            'phone' => '09171234567',
            'line1' => '789 Ayala Ave',
            'city' => 'Taguig',
        ])
            ->assertOk()
            ->assertJsonPath('data.label', 'Work')
            ->assertJsonPath('data.city', 'Taguig');

        $this->assertDatabaseHas('addresses', ['id' => $address->id, 'city' => 'Taguig', 'label' => 'Work']);
    }

    public function test_updating_an_address_to_default_unsets_the_previous_default(): void
    {
        $user = User::factory()->create();
        $current = Address::factory()->for($user)->create(['is_default' => true]);
        $other = Address::factory()->nonDefault()->for($user)->create();
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/addresses/{$other->id}", [
            'recipient_name' => 'Maya Cruz',
            'phone' => '09171234567',
            'line1' => '456 Rizal Ave',
            'city' => 'Makati',
            'is_default' => true,
        ])->assertOk()->assertJsonPath('data.is_default', true);

        $this->assertDatabaseHas('addresses', ['id' => $current->id, 'is_default' => false]);
        $this->assertSame(1, $user->addresses()->where('is_default', true)->count());
    }

    public function test_a_user_cannot_update_another_users_address(): void
    {
        $address = Address::factory()->create(); // someone else's
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/addresses/{$address->id}", [
            'recipient_name' => 'Hacker',
            'phone' => '09171234567',
            'line1' => 'Nope',
            'city' => 'Nowhere',
        ])->assertStatus(403);
    }

    public function test_a_user_can_delete_their_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->nonDefault()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/addresses/{$address->id}")->assertOk();

        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_deleting_the_default_promotes_another_address(): void
    {
        $user = User::factory()->create();
        $default = Address::factory()->for($user)->create(['is_default' => true]);
        $other = Address::factory()->nonDefault()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/addresses/{$default->id}")->assertOk();

        $this->assertDatabaseMissing('addresses', ['id' => $default->id]);
        $this->assertDatabaseHas('addresses', ['id' => $other->id, 'is_default' => true]);
    }

    public function test_an_address_used_by_an_order_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->for($user)->create();
        Order::factory()->create(['user_id' => $user->id, 'delivery_address_id' => $address->id]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/addresses/{$address->id}")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'address_in_use');

        $this->assertDatabaseHas('addresses', ['id' => $address->id]);
    }

    public function test_a_user_cannot_delete_another_users_address(): void
    {
        $address = Address::factory()->create(); // someone else's
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/v1/addresses/{$address->id}")->assertStatus(403);
    }
}
