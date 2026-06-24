<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);

        $users = User::query()
            ->where('role', UserRole::Customer)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereLike('full_name', "%{$search}%")
                        ->orWhereLike('email', "%{$search}%");
                });
            })
            ->orderBy('id')
            ->paginate($perPage);

        return ApiResponse::success(
            UserResource::collection($users->getCollection())->resolve(),
            ['pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]],
        );
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        // Admin accounts can't be suspended/reactivated through this endpoint.
        if ($user->isAdmin()) {
            return ApiResponse::error('Admin accounts cannot be modified here.', 'forbidden', 403);
        }

        $user->update(['status' => $request->validated()['status']]);

        return ApiResponse::success(new UserResource($user));
    }
}
