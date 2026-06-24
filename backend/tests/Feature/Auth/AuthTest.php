<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_and_receives_a_token(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'full_name' => 'Maya Tan',
            'email' => 'maya@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['data' => ['user' => ['id', 'full_name', 'email', 'role'], 'token'], 'meta', 'error'])
            ->assertJsonPath('data.user.email', 'maya@example.com')
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonPath('error', null);

        $this->assertDatabaseHas('users', ['email' => 'maya@example.com', 'role' => 'customer']);
        $this->assertArrayNotHasKey('password', $res->json('data.user'));
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dupe@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'full_name' => 'Dupe',
            'email' => 'dupe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_a_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'jo@example.com', 'password' => 'password123']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'jo@example.com',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['user', 'token']])
            ->assertJsonPath('data.user.email', 'jo@example.com');
    }

    public function test_login_returns_a_generic_error_for_wrong_password_or_unknown_email(): void
    {
        User::factory()->create(['email' => 'jo@example.com', 'password' => 'password123']);

        $this->postJson('/api/v1/auth/login', ['email' => 'jo@example.com', 'password' => 'wrong'])
            ->assertStatus(401)->assertJsonPath('error.code', 'invalid_credentials');

        $this->postJson('/api/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'whatever'])
            ->assertStatus(401)->assertJsonPath('error.code', 'invalid_credentials');
    }

    public function test_suspended_users_cannot_login(): void
    {
        User::factory()->suspended()->create(['email' => 'sus@example.com', 'password' => 'password123']);

        $this->postJson('/api/v1/auth/login', ['email' => 'sus@example.com', 'password' => 'password123'])
            ->assertStatus(403)->assertJsonPath('error.code', 'account_suspended');
    }

    public function test_a_user_can_logout_and_the_token_is_revoked(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertCount(0, $user->fresh()->tokens);
    }
}
