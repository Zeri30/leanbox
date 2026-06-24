<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CartItemController extends Controller
{
    public function store(AddCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $product = Product::find($data['product_id']);

        if (! $product || ! $product->is_active) {
            return ApiResponse::error('This product is unavailable.', 'product_unavailable', 422);
        }

        $cart = CartController::cartFor($request->user());
        $existing = $cart->items()->where('product_id', $product->id)->first();
        $newQuantity = ($existing->quantity ?? 0) + $data['quantity'];

        if ($newQuantity > $product->stock_quantity) {
            return ApiResponse::error('Not enough stock available.', 'insufficient_stock', 422);
        }

        if ($existing) {
            // Keep the original price snapshot; only adjust quantity.
            $existing->update(['quantity' => $newQuantity]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
                'unit_price' => $product->price, // snapshot at add time
            ]);
        }

        return ApiResponse::success(
            new CartResource($cart->fresh()->load('items.product.images')),
            null,
            201,
        );
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        $this->authorize('update', $cartItem->cart);

        $quantity = $request->validated()['quantity'];

        if ($quantity > $cartItem->product->stock_quantity) {
            return ApiResponse::error('Not enough stock available.', 'insufficient_stock', 422);
        }

        $cartItem->update(['quantity' => $quantity]);

        return ApiResponse::success(
            new CartResource($cartItem->cart->fresh()->load('items.product.images')),
        );
    }

    public function destroy(CartItem $cartItem): JsonResponse
    {
        $this->authorize('update', $cartItem->cart);

        $cart = $cartItem->cart;
        $cartItem->delete();

        return ApiResponse::success(
            new CartResource($cart->fresh()->load('items.product.images')),
        );
    }
}
