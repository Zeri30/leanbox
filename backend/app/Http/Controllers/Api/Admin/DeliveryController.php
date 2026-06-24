<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exceptions\DeliveryException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignDeliveryRequest;
use App\Http\Requests\Admin\CreateDeliveryRequest;
use App\Http\Requests\Admin\UpdateDeliveryRequest;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use App\Services\DeliveryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(private readonly DeliveryService $deliveries) {}

    public function index(Request $request): JsonResponse
    {
        $deliveries = Delivery::query()
            ->with('rider')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('rider_id'), fn ($q) => $q->where('rider_id', $request->integer('rider_id')))
            ->orderByDesc('id')
            ->paginate(15);

        return ApiResponse::success(
            DeliveryResource::collection($deliveries->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'per_page' => $deliveries->perPage(),
                'total' => $deliveries->total(),
            ]],
        );
    }

    public function store(CreateDeliveryRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $delivery = filled($data['order_id'] ?? null)
                ? $this->deliveries->createFromOrder(Order::findOrFail($data['order_id']))
                : $this->deliveries->createFromSubscription(Subscription::findOrFail($data['subscription_id']));
        } catch (DeliveryException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new DeliveryResource($delivery), null, 201);
    }

    public function assign(AssignDeliveryRequest $request, Delivery $delivery): JsonResponse
    {
        try {
            $rider = User::findOrFail($request->validated()['rider_id']);
            $delivery = $this->deliveries->assign($delivery, $rider);
        } catch (DeliveryException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new DeliveryResource($delivery->load('rider')));
    }

    public function update(UpdateDeliveryRequest $request, Delivery $delivery): JsonResponse
    {
        try {
            $delivery = $this->deliveries->markFailed($delivery);
        } catch (DeliveryException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new DeliveryResource($delivery->load('rider')));
    }
}
