<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\NutritionFact;
use App\Models\Product;
use App\Models\ProductImage;
use App\Observers\CatalogCacheObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Global API rate limit: 60 requests/min per authenticated user, else per IP.
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));

        // Event→notification listeners are auto-discovered from app/Listeners
        // (they type-hint their event in handle()), so no manual registration here.

        // Bust cached storefront catalog reads whenever their source data changes.
        foreach ([Product::class, Category::class, ProductImage::class, NutritionFact::class] as $model) {
            $model::observe(CatalogCacheObserver::class);
        }
    }
}
