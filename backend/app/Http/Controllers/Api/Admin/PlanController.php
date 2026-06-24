<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePlanRequest;
use App\Http\Requests\Admin\UpdatePlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            SubscriptionPlanResource::collection(SubscriptionPlan::orderBy('price')->get())->resolve(),
        );
    }

    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = SubscriptionPlan::create($request->validated());

        return ApiResponse::success(new SubscriptionPlanResource($plan->refresh()), null, 201);
    }

    public function update(UpdatePlanRequest $request, SubscriptionPlan $plan): JsonResponse
    {
        $plan->update($request->validated());

        return ApiResponse::success(new SubscriptionPlanResource($plan->fresh()));
    }

    /** Soft-delete: deactivate so active subscriptions aren't broken. */
    public function destroy(SubscriptionPlan $plan): JsonResponse
    {
        $plan->update(['is_active' => false]);

        return ApiResponse::success(['message' => 'Plan deactivated.']);
    }
}
