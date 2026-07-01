<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ReviewException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Services\ReviewService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviews) {}

    /** Public: visible reviews for a product. */
    public function index(Product $product): JsonResponse
    {
        $reviews = $product->reviews()
            ->visible()
            ->with('user')
            ->latest()
            ->paginate(15);

        return ApiResponse::success(
            ReviewResource::collection($reviews->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]],
        );
    }

    public function store(StoreReviewRequest $request, Product $product): JsonResponse
    {
        try {
            $review = $this->reviews->create($request->user(), $product, $request->validated());
        } catch (ReviewException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new ReviewResource($review), null, 201);
    }

    /** The authenticated user's own reviews. */
    public function mine(Request $request): JsonResponse
    {
        $reviews = $request->user()->reviews()->with('product')->latest()->paginate(15);

        return ApiResponse::success(
            ReviewResource::collection($reviews->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]],
        );
    }
}
