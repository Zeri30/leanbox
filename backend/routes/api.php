<?php

use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\NutritionController as AdminNutritionController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductImageController as AdminProductImageController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CartItemController;
use App\Http\Controllers\Api\Catalog\CategoryController as CatalogCategoryController;
use App\Http\Controllers\Api\Catalog\ProductController as CatalogProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * API v1 — all routes are prefixed with /api/v1 (see bootstrap/app.php).
 * Responses use the shared envelope { data, meta, error } via App\Support\ApiResponse.
 */

Route::get('/health', fn () => ApiResponse::success([
    'status' => 'ok',
    'service' => 'leanbox-api',
    'version' => 'v1',
]))->name('health');

// Public storefront catalog (browse)
Route::get('products', [CatalogProductController::class, 'index'])->name('products.index');
Route::get('products/{product:slug}', [CatalogProductController::class, 'show'])->name('products.show');
Route::get('categories', [CatalogCategoryController::class, 'index'])->name('categories.index');

// Auth (Sanctum)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// Authenticated profile & password
Route::middleware('auth:sanctum')->group(function () {
    Route::get('users/me', [ProfileController::class, 'show'])->name('users.me.show');
    Route::patch('users/me', [ProfileController::class, 'update'])->name('users.me.update');
    Route::patch('users/me/password', [ProfileController::class, 'updatePassword'])->name('users.me.password');

    // Cart (one per authenticated user)
    Route::get('cart', [CartController::class, 'show'])->name('cart.show');
    Route::post('cart/items', [CartItemController::class, 'store'])->name('cart.items.store');
    Route::patch('cart/items/{cartItem}', [CartItemController::class, 'update'])->name('cart.items.update');
    Route::delete('cart/items/{cartItem}', [CartItemController::class, 'destroy'])->name('cart.items.destroy');

    // Orders (checkout + lifecycle)
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
});

Route::get('/user', fn (Request $request) => ApiResponse::success(new UserResource($request->user())))
    ->middleware('auth:sanctum')
    ->name('users.me');

// Admin-only routes (role-gated).
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('ping', fn () => ApiResponse::success(['scope' => 'admin']))->name('admin.ping');
    Route::get('users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::patch('users/{user}/status', [AdminUserController::class, 'updateStatus'])->name('admin.users.status');

    // Catalog management
    Route::apiResource('products', AdminProductController::class)->names('admin.products');
    Route::apiResource('categories', AdminCategoryController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('admin.categories');

    // Product images (reorder must precede the {image} param route)
    Route::post('products/{product}/images', [AdminProductImageController::class, 'store'])->name('admin.products.images.store');
    Route::patch('products/{product}/images/reorder', [AdminProductImageController::class, 'reorder'])->name('admin.products.images.reorder');
    Route::patch('products/{product}/images/{image}', [AdminProductImageController::class, 'update'])->name('admin.products.images.update');
    Route::delete('products/{product}/images/{image}', [AdminProductImageController::class, 'destroy'])->name('admin.products.images.destroy');

    // Product nutrition (1:1)
    Route::put('products/{product}/nutrition', [AdminNutritionController::class, 'upsert'])->name('admin.products.nutrition.upsert');
    Route::delete('products/{product}/nutrition', [AdminNutritionController::class, 'destroy'])->name('admin.products.nutrition.destroy');
});

// Rider-only routes (role-gated). Filled in by later sprints.
Route::middleware(['auth:sanctum', 'role:rider'])->prefix('rider')->group(function () {
    Route::get('ping', fn () => ApiResponse::success(['scope' => 'rider']))->name('rider.ping');
});
