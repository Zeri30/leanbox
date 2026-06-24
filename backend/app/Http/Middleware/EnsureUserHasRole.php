<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Gate a route to one or more roles, e.g. ->middleware('role:admin').
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 'unauthenticated', 401);
        }

        if (! in_array($user->role->value, $roles, true)) {
            return ApiResponse::error('This action is unauthorized.', 'forbidden', 403);
        }

        return $next($request);
    }
}
