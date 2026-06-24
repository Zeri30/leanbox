<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $cart = self::cartFor($request->user());

        return ApiResponse::success(new CartResource($cart->load('items.product.images')));
    }

    /** One active cart per user. */
    public static function cartFor(User $user): Cart
    {
        return $user->cart()->firstOrCreate([]);
    }
}
