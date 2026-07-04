<?php

namespace Tests\Feature\Auth;

use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    /** Seed a reset token row for $email with a known code. */
    private function seedCode(string $email, string $code, ?\DateTimeInterface $createdAt = null): void
    {
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($code), 'created_at' => $createdAt ?? now()],
        );
    }

    public function test_forgot_password_stores_a_code_and_emails_it(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'maya@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'maya@example.com'])
            ->assertOk()
            ->assertJsonPath('error', null);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'maya@example.com']);
        Mail::assertSent(PasswordResetCodeMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_password_is_silent_for_an_unknown_email(): void
    {
        Mail::fake();

        // Same generic 200 as a known email — no account enumeration.
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk();

        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'nobody@example.com']);
        Mail::assertNothingSent();
    }

    public function test_reset_password_with_a_valid_code_changes_the_password(): void
    {
        $user = User::factory()->create([
            'email' => 'jo@example.com',
            'password' => 'oldpassword123',
        ]);
        $this->seedCode('jo@example.com', '123456');

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jo@example.com',
            'code' => '123456',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
        // Code is single-use.
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'jo@example.com']);
    }

    public function test_reset_password_revokes_existing_tokens(): void
    {
        $user = User::factory()->create(['email' => 'jo@example.com']);
        $user->createToken('api');
        $this->seedCode('jo@example.com', '123456');

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jo@example.com',
            'code' => '123456',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_reset_password_rejects_a_wrong_code(): void
    {
        $user = User::factory()->create(['email' => 'jo@example.com', 'password' => 'oldpassword123']);
        $this->seedCode('jo@example.com', '123456');

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jo@example.com',
            'code' => '000000',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422)->assertJsonPath('error.code', 'invalid_reset_code');

        $this->assertTrue(Hash::check('oldpassword123', $user->fresh()->password));
    }

    public function test_reset_password_rejects_an_expired_code(): void
    {
        $user = User::factory()->create(['email' => 'jo@example.com', 'password' => 'oldpassword123']);
        $this->seedCode('jo@example.com', '123456', now()->subMinutes(20));

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jo@example.com',
            'code' => '123456',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422)->assertJsonPath('error.code', 'invalid_reset_code');

        $this->assertTrue(Hash::check('oldpassword123', $user->fresh()->password));
        // An expired code is cleaned up.
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'jo@example.com']);
    }

    public function test_reset_password_rejects_an_email_with_no_pending_code(): void
    {
        User::factory()->create(['email' => 'jo@example.com', 'password' => 'oldpassword123']);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jo@example.com',
            'code' => '123456',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422)->assertJsonPath('error.code', 'invalid_reset_code');
    }

    public function test_reset_password_validates_its_input(): void
    {
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'not-an-email',
            'code' => '12',
            'password' => 'short',
        ])->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }
}
