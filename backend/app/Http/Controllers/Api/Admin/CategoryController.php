<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            CategoryResource::collection(Category::orderBy('name')->get())->resolve(),
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Slug::unique($data['name'], 'categories');

        $category = Category::create($data);

        return ApiResponse::success(new CategoryResource($category->refresh()), null, 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return ApiResponse::success(new CategoryResource($category->fresh()));
    }

    /**
     * Soft-delete: deactivate (is_active = false) rather than hard delete.
     */
    public function destroy(Category $category): JsonResponse
    {
        $category->update(['is_active' => false]);

        return ApiResponse::success(['message' => 'Category deactivated.']);
    }
}
