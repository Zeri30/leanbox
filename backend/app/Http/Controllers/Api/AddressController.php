<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Resources\AddressResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    /** The authenticated user's saved addresses (default first). */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get();

        return ApiResponse::success(AddressResource::collection($addresses)->resolve());
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // First address is the default; an explicit is_default replaces the current one.
        $makeDefault = ($data['is_default'] ?? false) || $user->addresses()->count() === 0;

        $address = DB::transaction(function () use ($user, $data, $makeDefault) {
            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                ...$data,
                'country' => $data['country'] ?? 'Philippines',
                'is_default' => $makeDefault,
            ]);
        });

        return ApiResponse::success(new AddressResource($address), null, 201);
    }
}
