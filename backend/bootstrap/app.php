<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\EnsureUserIsActive;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);

        // Global API rate limit (the 'api' limiter is defined in AppServiceProvider).
        $middleware->prependToGroup('api', 'throttle:api');

        // Reject suspended accounts on every API request that carries a token.
        $middleware->appendToGroup('api', EnsureUserIsActive::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render API errors using the shared { data, meta, error } envelope.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null; // default (web) handling
            }

            return match (true) {
                $e instanceof ValidationException => ApiResponse::error(
                    'The given data was invalid.', 'validation_error', 422, $e->errors()
                ),
                $e instanceof AuthenticationException => ApiResponse::error(
                    'Unauthenticated.', 'unauthenticated', 401
                ),
                $e instanceof AuthorizationException => ApiResponse::error(
                    'This action is unauthorized.', 'forbidden', 403
                ),
                $e instanceof ModelNotFoundException,
                $e instanceof NotFoundHttpException => ApiResponse::error(
                    'Resource not found.', 'not_found', 404
                ),
                $e instanceof MethodNotAllowedHttpException => ApiResponse::error(
                    'Method not allowed.', 'method_not_allowed', 405
                ),
                $e instanceof TooManyRequestsHttpException => ApiResponse::error(
                    'Too many requests.', 'too_many_requests', 429
                ),
                $e instanceof HttpExceptionInterface => ApiResponse::error(
                    $e->getMessage() ?: 'HTTP error.', 'http_error', $e->getStatusCode()
                ),
                default => ApiResponse::error(
                    config('app.debug') ? $e->getMessage() : 'Server error.', 'server_error', 500
                ),
            };
        });
    })->create();
