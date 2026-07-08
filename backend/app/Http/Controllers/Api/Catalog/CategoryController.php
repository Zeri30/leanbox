<?php

namespace App\Http\Controllers\Api\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /** Active categories for storefront nav and filters. */
    public function index(): JsonResponse
    {
        // Cached until a category (or its parent product data) changes — this list is
        // hit on nearly every storefront page but rarely mutates.
        $categories = CatalogCache::remember('categories:active', fn () => CategoryResource::collection(
            Category::query()->where('is_active', true)->orderBy('name')->get()
        )->resolve());

        return ApiResponse::success($categories);
    }
}
