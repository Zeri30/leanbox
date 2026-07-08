<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Caching for public storefront catalog reads (categories + product listings).
 *
 * Runs on the app's default cache store (Laravel `database` driver in prod — no
 * Redis, so no cache tags). Invalidation therefore uses a monotonically increasing
 * *version* baked into every key: bumping the version orphans all previously cached
 * catalog entries at once, and they lapse on their own TTL. A CatalogCacheObserver
 * bumps the version whenever a Product / Category / ProductImage / NutritionFact is
 * written, so admin edits and stock changes are reflected immediately.
 */
class CatalogCache
{
    private const VERSION_KEY = 'catalog:version';

    /** Storefront product listings can lag at most this long even if a bump is missed. */
    public const INDEX_TTL_SECONDS = 300;

    /** Current cache-namespace version (defaults to 1 before the first bump). */
    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    /** Invalidate every cached catalog read by moving to a fresh namespace version. */
    public static function bump(): void
    {
        Cache::forever(self::VERSION_KEY, self::version() + 1);
    }

    /**
     * Remember a catalog value under the current version namespace.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @param  int|null  $ttlSeconds  Null caches until the next version bump.
     * @return T
     */
    public static function remember(string $suffix, Closure $callback, ?int $ttlSeconds = null): mixed
    {
        $key = 'catalog:v'.self::version().':'.$suffix;

        return $ttlSeconds === null
            ? Cache::rememberForever($key, $callback)
            : Cache::remember($key, $ttlSeconds, $callback);
    }
}
