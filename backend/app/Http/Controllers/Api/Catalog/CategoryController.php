<?php

namespace App\Http\Controllers\Api\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /** Active categories for storefront nav and filters. */
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            CategoryResource::collection(
                Category::query()->where('is_active', true)->orderBy('name')->get()
            )->resolve(),
        );
    }
}
