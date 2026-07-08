<?php

namespace App\Observers;

use App\Support\CatalogCache;
use Illuminate\Database\Eloquent\Model;

/**
 * Invalidates cached storefront catalog reads whenever the underlying data changes.
 * Attached (in AppServiceProvider) to every model whose edits can alter a catalog
 * response: Product, Category, ProductImage, NutritionFact. Any create/update/delete
 * bumps the catalog cache version, so the next read rebuilds from the database.
 */
class CatalogCacheObserver
{
    public function saved(Model $model): void
    {
        CatalogCache::bump();
    }

    public function deleted(Model $model): void
    {
        CatalogCache::bump();
    }
}
