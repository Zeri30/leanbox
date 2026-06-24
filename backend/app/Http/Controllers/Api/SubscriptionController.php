<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\SubscribeRequest;
use App\Http\Resources\SubscriptionResource;
use App\Services\SubscriptionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function store(SubscribeRequest $request): JsonResponse
    {
        $subscription = $this->subscriptions->subscribe($request->user(), $request->validated());

        return ApiResponse::success(
            new SubscriptionResource($subscription->load(['plan', 'payments'])),
            null,
            201,
        );
    }
}
