<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModerateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /** Hide/unhide a review (data is retained, just excluded from the storefront). */
    public function update(ModerateReviewRequest $request, Review $review): JsonResponse
    {
        $review->update(['is_hidden' => $request->validated()['is_hidden']]);

        return ApiResponse::success(new ReviewResource($review));
    }

    public function stats(): JsonResponse
    {
        $total = Review::count();
        $hidden = Review::where('is_hidden', true)->count();
        $average = Review::visible()->avg('rating');

        $counts = Review::visible()
            ->selectRaw('rating, count(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        $distribution = collect(range(1, 5))
            ->mapWithKeys(fn (int $r) => [$r => (int) ($counts[$r] ?? 0)]);

        return ApiResponse::success([
            'total' => $total,
            'visible' => $total - $hidden,
            'hidden' => $hidden,
            'average_rating' => $average !== null ? round((float) $average, 2) : null,
            'rating_distribution' => $distribution,
        ]);
    }
}
