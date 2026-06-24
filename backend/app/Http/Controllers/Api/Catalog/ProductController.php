<?php

namespace App\Http\Controllers\Api\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 12), 1), 48);
        $search = trim((string) $request->query('search', ''));

        $query = Product::query()
            ->active()
            ->with(['category', 'images' => fn ($q) => $q->orderBy('sort_order')])
            ->when($search !== '', fn ($q) => $q->whereLike('name', "%{$search}%"))
            ->when($request->filled('category'), function ($q) use ($request) {
                $slug = (string) $request->query('category');
                $q->whereHas('category', fn ($c) => $c->where('slug', $slug)->where('is_active', true));
            })
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->boolean('best_selling'), fn ($q) => $q->where('is_best_selling', true));

        $this->applySort($query, (string) $request->query('sort', ''));

        $products = $query->paginate($perPage)->withQueryString();

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

    public function show(Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        $product->load([
            'category',
            'images' => fn ($q) => $q->orderBy('sort_order'),
            'nutritionFacts',
        ])
            ->loadCount(['reviews as reviews_count' => fn ($q) => $q->visible()])
            ->loadAvg(['reviews as reviews_avg' => fn ($q) => $q->visible()], 'rating');

        return ApiResponse::success(new ProductResource($product));
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('is_featured')->orderByDesc('id'),
        };
    }
}
