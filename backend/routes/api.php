<?php

use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\DeliveryController as AdminDeliveryController;
use App\Http\Controllers\Api\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Api\Admin\NutritionController as AdminNutritionController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PlanController as AdminPlanController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductImageController as AdminProductImageController;
use App\Http\Controllers\Api\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CartItemController;
use App\Http\Controllers\Api\Catalog\CategoryController as CatalogCategoryController;
use App\Http\Controllers\Api\Catalog\ProductController as CatalogProductController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\Rider\DeliveryController as RiderDeliveryController;
use App\Http\Controllers\Api\SubscriptionController;
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
Route::get('plans', [PlanController::class, 'index'])->name('plans.index');
Route::get('products/{product}/reviews', [ReviewController::class, 'index'])->name('products.reviews.index');

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

    // Delivery addresses (checkout)
    Route::get('addresses', [AddressController::class, 'index'])->name('addresses.index');
    Route::post('addresses', [AddressController::class, 'store'])->name('addresses.store');

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

    // Reviews (verified purchase)
    Route::post('products/{product}/reviews', [ReviewController::class, 'store'])->name('products.reviews.store');
    Route::get('reviews/me', [ReviewController::class, 'mine'])->name('reviews.me');

    // Notifications (in-app feed)
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    // Subscriptions (subscribe + manage)
    Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::post('subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
    Route::get('subscriptions/{subscription}', [SubscriptionController::class, 'show'])->name('subscriptions.show');
    Route::patch('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
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

    // Subscription plans
    Route::apiResource('plans', AdminPlanController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('admin.plans');

    // Order management
    Route::get('orders', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('admin.orders.show');
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('admin.orders.status');
    Route::patch('orders/{order}/cancel', [AdminOrderController::class, 'cancel'])->name('admin.orders.cancel');

    // Review moderation
    Route::get('reviews/stats', [AdminReviewController::class, 'stats'])->name('admin.reviews.stats');
    Route::patch('reviews/{review}', [AdminReviewController::class, 'update'])->name('admin.reviews.update');

    // Inventory & analytics
    Route::patch('products/{product}/stock', [AdminInventoryController::class, 'updateStock'])->name('admin.products.stock');
    Route::get('inventory/low-stock', [AdminInventoryController::class, 'lowStock'])->name('admin.inventory.low-stock');
    Route::get('dashboard/summary', [AdminDashboardController::class, 'summary'])->name('admin.dashboard.summary');
    Route::get('analytics/best-sellers', [AdminDashboardController::class, 'bestSellers'])->name('admin.analytics.best-sellers');

    // Delivery management
    Route::get('deliveries', [AdminDeliveryController::class, 'index'])->name('admin.deliveries.index');
    Route::post('deliveries', [AdminDeliveryController::class, 'store'])->name('admin.deliveries.store');
    Route::post('deliveries/{delivery}/assign', [AdminDeliveryController::class, 'assign'])->name('admin.deliveries.assign');
    Route::patch('deliveries/{delivery}', [AdminDeliveryController::class, 'update'])->name('admin.deliveries.update');
});

// Rider-only routes (role-gated).
Route::middleware(['auth:sanctum', 'role:rider'])->prefix('rider')->group(function () {
    Route::get('ping', fn () => ApiResponse::success(['scope' => 'rider']))->name('rider.ping');

    Route::get('deliveries', [RiderDeliveryController::class, 'index'])->name('rider.deliveries.index');
    Route::patch('deliveries/{delivery}/status', [RiderDeliveryController::class, 'updateStatus'])->name('rider.deliveries.status');
    Route::post('deliveries/{delivery}/proof', [RiderDeliveryController::class, 'proof'])->name('rider.deliveries.proof');
});
