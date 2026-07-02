<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModerateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /** All reviews (incl. hidden) for moderation, newest first. Filter by ?hidden=0|1 and ?rating. */
    public function index(Request $request): JsonResponse
    {
        $reviews = Review::query()
            ->with(['product:id,name', 'user:id,full_name'])
            ->when($request->has('hidden'), fn ($q) => $q->where('is_hidden', $request->boolean('hidden')))
            ->when($request->filled('rating'), fn ($q) => $q->where('rating', $request->integer('rating')))
            ->orderByDesc('id')
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
