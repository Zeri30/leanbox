<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
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

    public function update(UpdateAddressRequest $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        $user = $request->user();
        $data = $request->validated();

        // Keep the address's current default status unless the request changes it.
        $makeDefault = $data['is_default'] ?? $address->is_default;

        $updated = DB::transaction(function () use ($user, $address, $data, $makeDefault) {
            if ($makeDefault) {
                $user->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            $address->update([
                ...$data,
                'country' => $data['country'] ?? $address->country,
                'is_default' => $makeDefault,
            ]);

            return $address->fresh();
        });

        return ApiResponse::success(new AddressResource($updated));
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorize('delete', $address);

        // Addresses are restrict-on-delete from orders/subscriptions/deliveries so
        // history never breaks — block the delete with a clear message instead of
        // letting the DB throw a foreign-key error.
        $inUse = $address->orders()->exists()
            || $address->subscriptions()->exists()
            || $address->deliveries()->exists();

        if ($inUse) {
            return ApiResponse::error(
                "This address is used by existing orders and can't be deleted.",
                'address_in_use',
                422,
            );
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // If the default was removed, promote the newest remaining address.
        if ($wasDefault) {
            $request->user()->addresses()->orderByDesc('id')->first()
                ?->update(['is_default' => true]);
        }

        return ApiResponse::success(['message' => 'Address deleted.']);
    }
}
