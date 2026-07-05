<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyResetCodeRequest;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PasswordResetController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $this->auth->sendPasswordResetCode($request->validated()['email']);

        // Always generic — never reveal whether the email has an account.
        return ApiResponse::success([
            'message' => 'If that email is registered, a reset code is on its way.',
        ]);
    }

    public function verify(VerifyResetCodeRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! $this->auth->verifyResetCode($data['email'], $data['code'])) {
            return ApiResponse::error(
                'That code is invalid or has expired. Request a new one and try again.',
                'invalid_reset_code',
                422,
            );
        }

        return ApiResponse::success([
            'message' => 'Code verified. Choose your new password.',
        ]);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();

        $ok = $this->auth->resetPassword($data['email'], $data['code'], $data['password']);

        if (! $ok) {
            return ApiResponse::error(
                'That code is invalid or has expired. Request a new one and try again.',
                'invalid_reset_code',
                422,
            );
        }

        return ApiResponse::success([
            'message' => 'Your password has been reset. You can now sign in.',
        ]);
    }
}
