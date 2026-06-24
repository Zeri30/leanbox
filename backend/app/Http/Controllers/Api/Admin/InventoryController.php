<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\StockChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateStockRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    /** Manually set a product's stock; re-checks low-stock via StockChanged. */
    public function updateStock(UpdateStockRequest $request, Product $product): JsonResponse
    {
        $product->update(['stock_quantity' => $request->validated()['stock_quantity']]);

        StockChanged::dispatch($product->id);

        return ApiResponse::success(new ProductResource($product->fresh()));
    }

    /** Active products at or below their low-stock threshold. */
    public function lowStock(): JsonResponse
    {
        $products = Product::query()
            ->active()
            ->lowStock()
            ->orderBy('stock_quantity')
            ->paginate(50);

        return ApiResponse::success(
            ProductResource::collection($products->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]],
        );
    }
}
