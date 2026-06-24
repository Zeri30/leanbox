<?php

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_view_their_profile(): void
    {
        Sanctum::actingAs(User::factory()->create(['email' => 'me@example.com']));

        $this->getJson('/api/v1/users/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'me@example.com');
    }

    public function test_a_user_can_update_their_profile(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/v1/users/me', ['full_name' => 'New Name', 'phone' => '09171234567'])
            ->assertOk()
            ->assertJsonPath('data.full_name', 'New Name')
            ->assertJsonPath('data.phone', '09171234567');
    }

    public function test_profile_update_rejects_an_email_taken_by_another_user(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/v1/users/me', ['email' => 'taken@example.com'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_error');
    }

    public function test_a_user_can_change_their_password_with_the_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => 'oldpassword']);
        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/users/me/password', [
            'current_password' => 'oldpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_password_change_rejects_a_wrong_current_password(): void
    {
        Sanctum::actingAs(User::factory()->create(['password' => 'oldpassword']));

        $this->patchJson('/api/v1/users/me/password', [
            'current_password' => 'wrong',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422);
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/v1/users/me')->assertStatus(401);
    }
}
