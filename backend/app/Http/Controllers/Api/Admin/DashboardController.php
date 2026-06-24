<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function summary(): JsonResponse
    {
        return ApiResponse::success($this->analytics->summary());
    }

    public function bestSellers(): JsonResponse
    {
        return ApiResponse::success($this->analytics->bestSellers());
    }
}
