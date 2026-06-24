<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\SubscriptionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\ManageSubscriptionRequest;
use App\Http\Requests\Subscription\SubscribeRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function index(Request $request): JsonResponse
    {
        $subs = $request->user()->subscriptions()
            ->with(['plan', 'payments'])
            ->orderByDesc('id')
            ->paginate(15);

        return ApiResponse::success(
            SubscriptionResource::collection($subs->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $subs->currentPage(),
                'last_page' => $subs->lastPage(),
                'per_page' => $subs->perPage(),
                'total' => $subs->total(),
            ]],
        );
    }

    public function store(SubscribeRequest $request): JsonResponse
    {
        $subscription = $this->subscriptions->subscribe($request->user(), $request->validated());

        return ApiResponse::success(
            new SubscriptionResource($subscription->load(['plan', 'payments'])),
            null,
            201,
        );
    }

    public function show(Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);

        return ApiResponse::success(new SubscriptionResource($subscription->load(['plan', 'payments'])));
    }

    public function update(ManageSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);

        try {
            $subscription = match ($request->validated()['action']) {
                'pause' => $this->subscriptions->pause($subscription),
                'resume' => $this->subscriptions->resume($subscription),
                'cancel' => $this->subscriptions->cancel($subscription),
            };
        } catch (SubscriptionException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new SubscriptionResource($subscription->load(['plan', 'payments'])));
    }
}
