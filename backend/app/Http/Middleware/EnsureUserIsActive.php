<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject suspended accounts on any request that carries a valid token.
     * Resolves via the sanctum guard so it works regardless of middleware order.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?: Auth::guard('sanctum')->user();

        if ($user instanceof User && $user->status === UserStatus::Suspended) {
            return ApiResponse::error('Your account has been suspended.', 'account_suspended', 403);
        }

        return $next($request);
    }
}
