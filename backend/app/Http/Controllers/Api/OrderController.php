<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Exceptions\OrderException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
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
        $orders = Order::forUser($request->user()->id)
            ->with('items')
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

    public function store(CheckoutRequest $request): JsonResponse
    {
        $data = $request->validated();
        $method = PaymentMethod::from($data['payment_method'] ?? config('payments.default_method'));

        try {
            $order = $this->orders->placeFromCart(
                $request->user(),
                (int) $data['delivery_address_id'],
                $method,
            );
        } catch (OrderException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new OrderResource($order->load(['items', 'payment'])), null, 201);
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return ApiResponse::success(new OrderResource($order->load('items')));
    }

    public function cancel(Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        if ($order->status !== OrderStatus::Pending) {
            return ApiResponse::error('Only pending orders can be cancelled.', 'invalid_transition', 422);
        }

        $order = $this->orders->cancel($order);

        return ApiResponse::success(new OrderResource($order->load('items')));
    }
}
