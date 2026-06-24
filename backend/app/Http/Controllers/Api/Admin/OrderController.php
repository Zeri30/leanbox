<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Exceptions\OrderException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $orders = Order::query()
            ->with(['user', 'items'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->whereLike('order_number', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u
                            ->whereLike('full_name', "%{$search}%")
                            ->orWhereLike('email', "%{$search}%"));
                });
            })
            ->orderByDesc('id')
            ->paginate(15);

        return ApiResponse::success(
            OrderResource::collection($orders->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ]],
        );
    }

    public function show(Order $order): JsonResponse
    {
        return ApiResponse::success(new OrderResource($order->load(['user', 'items', 'payment'])));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        try {
            $order = $this->orders->transition($order, OrderStatus::from($request->validated()['status']));
        } catch (OrderException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new OrderResource($order->load(['user', 'items'])));
    }

    public function cancel(Order $order): JsonResponse
    {
        try {
            $order = $this->orders->transition($order, OrderStatus::Cancelled);
        } catch (OrderException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new OrderResource($order->load(['user', 'items'])));
    }
}
