<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpsertNutritionRequest;
use App\Http\Resources\NutritionFactResource;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class NutritionController extends Controller
{
    /** Create or update the product's 1:1 nutrition facts. */
    public function upsert(UpsertNutritionRequest $request, Product $product): JsonResponse
    {
        $nutrition = $product->nutritionFacts()->updateOrCreate([], $request->validated());

        return ApiResponse::success(new NutritionFactResource($nutrition));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->nutritionFacts()->delete();

        return ApiResponse::success(['message' => 'Nutrition facts removed.']);
    }
}
