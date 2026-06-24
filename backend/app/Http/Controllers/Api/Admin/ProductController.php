<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);

        $products = Product::query()
            ->with('category')
            ->when($search !== '', fn ($q) => $q->whereLike('name', "%{$search}%"))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->orderByDesc('id')
            ->paginate($perPage);

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

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Slug::unique($data['name'], 'products');

        $product = Product::create($data);

        return ApiResponse::success(new ProductResource($product->refresh()->load('category')), null, 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load([
            'category',
            'images' => fn ($q) => $q->orderBy('sort_order'),
            'nutritionFacts',
        ]);

        return ApiResponse::success(new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return ApiResponse::success(new ProductResource($product->fresh()->load('category')));
    }

    /**
     * Soft-delete: deactivate (is_active = false) so order history stays intact.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->update(['is_active' => false]);

        return ApiResponse::success(['message' => 'Product deactivated.']);
    }
}
