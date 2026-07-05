<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthService
{
    /** How long a password-reset code stays valid, in minutes. */
    public const RESET_CODE_TTL_MINUTES = 15;

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

    /**
     * Email a 6-digit password-reset code to the user (stored hashed, with an
     * expiry). Silent when the email isn't registered so we never reveal which
     * addresses have accounts.
     */
    public function sendPasswordResetCode(string $email): void
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            return;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($code), 'created_at' => now()],
        );

        Mail::to($user->email)->send(
            new PasswordResetCodeMail($code, self::RESET_CODE_TTL_MINUTES),
        );
    }

    /**
     * Check a reset code without consuming it — used by the "enter code" step so
     * a bad code is caught before the user picks a new password.
     */
    public function verifyResetCode(string $email, string $code): bool
    {
        return $this->resetCodeIsValid($email, $code);
    }

    /**
     * Verify a reset code and set a new password. Returns false when the code is
     * missing, expired, or wrong. On success the code is consumed and every
     * existing access token is revoked (all sessions signed out).
     */
    public function resetPassword(string $email, string $code, string $password): bool
    {
        if (! $this->resetCodeIsValid($email, $code)) {
            return false;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return false;
        }

        $user->update(['password' => $password]); // 'hashed' cast hashes it
        $user->tokens()->delete(); // revoke every existing session

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return true;
    }

    /**
     * True when a stored code exists for the email, hasn't expired, and matches.
     * Expired rows are cleaned up. Does not consume a valid code.
     */
    private function resetCodeIsValid(string $email, string $code): bool
    {
        $row = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $row) {
            return false;
        }

        $expired = Carbon::parse($row->created_at)
            ->addMinutes(self::RESET_CODE_TTL_MINUTES)
            ->isPast();

        if ($expired) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            return false;
        }

        return Hash::check($code, $row->token);
    }
}
