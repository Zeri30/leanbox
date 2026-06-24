<?php

namespace App\Http\Controllers\Api\Rider;

use App\Enums\DeliveryStatus;
use App\Exceptions\DeliveryException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rider\UpdateDeliveryStatusRequest;
use App\Http\Requests\Rider\UploadProofRequest;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
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
            ->forRider($request->user()->id)
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

    public function updateStatus(UpdateDeliveryStatusRequest $request, Delivery $delivery): JsonResponse
    {
        $this->authorize('update', $delivery); // rider may only touch their own

        try {
            $delivery = $this->deliveries->riderUpdateStatus(
                $delivery,
                DeliveryStatus::from($request->validated()['status']),
            );
        } catch (DeliveryException $e) {
            return ApiResponse::error($e->getMessage(), $e->errorCode, $e->status);
        }

        return ApiResponse::success(new DeliveryResource($delivery));
    }

    public function proof(UploadProofRequest $request, Delivery $delivery): JsonResponse
    {
        $this->authorize('update', $delivery);

        $delivery = $this->deliveries->attachProof(
            $delivery,
            $request->file('image'),
            $request->validated()['notes'] ?? null,
        );

        return ApiResponse::success(new DeliveryResource($delivery));
    }
}
