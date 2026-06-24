<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    /** Public: active subscription plans for customers to choose from. */
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            SubscriptionPlanResource::collection(
                SubscriptionPlan::query()->where('is_active', true)->orderBy('price')->get()
            )->resolve(),
        );
    }
}
