<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

/**
 * Builds the standard Leanbox API envelope: { data, meta, error }.
 *
 * - Success: data is set, error is null, meta carries pagination/extra info.
 * - Error:   data and meta are null, error carries { code, message, details }.
 */
class ApiResponse
{
    /**
     * @param  array<string, mixed>|null  $meta
     */
    public static function success(mixed $data = null, ?array $meta = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'meta' => $meta,
            'error' => null,
        ], $status);
    }

    /**
     * @param  array<string, mixed>|null  $details
     */
    public static function error(string $message, string $code = 'error', int $status = 400, ?array $details = null): JsonResponse
    {
        return response()->json([
            'data' => null,
            'meta' => null,
            'error' => array_filter([
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ], static fn ($value) => $value !== null),
        ], $status);
    }
}
