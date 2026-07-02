<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /** Read-only admin listing of all subscriptions (filterable by status, searchable by customer). */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $subscriptions = Subscription::query()
            ->with(['user', 'plan'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($search !== '', fn ($q) => $q->whereHas('user', fn ($u) => $u
                ->whereLike('full_name', "%{$search}%")
                ->orWhereLike('email', "%{$search}%")))
            ->orderByDesc('id')
            ->paginate(15);

        return ApiResponse::success(
            SubscriptionResource::collection($subscriptions->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ]],
        );
    }

    public function show(Subscription $subscription): JsonResponse
    {
        return ApiResponse::success(
            new SubscriptionResource($subscription->load(['user', 'plan', 'payments'])),
        );
    }
}
