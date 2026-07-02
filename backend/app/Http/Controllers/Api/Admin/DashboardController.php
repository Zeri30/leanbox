<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function summary(): JsonResponse
    {
        return ApiResponse::success($this->analytics->summary());
    }

    /** Daily revenue series for the dashboard chart (?days=7..90, default 30). */
    public function revenue(Request $request): JsonResponse
    {
        return ApiResponse::success($this->analytics->revenueSeries($request->integer('days', 30)));
    }

    public function bestSellers(): JsonResponse
    {
        return ApiResponse::success($this->analytics->bestSellers());
    }
}
