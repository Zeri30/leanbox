<?php

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * API v1 — all routes are prefixed with /api/v1 (see bootstrap/app.php).
 * Responses use the shared envelope { data, meta, error } via App\Support\ApiResponse.
 */

Route::get('/health', fn () => ApiResponse::success([
    'status' => 'ok',
    'service' => 'leanbox-api',
    'version' => 'v1',
]))->name('health');

Route::get('/user', fn (Request $request) => ApiResponse::success($request->user()))
    ->middleware('auth:sanctum')
    ->name('users.me');
