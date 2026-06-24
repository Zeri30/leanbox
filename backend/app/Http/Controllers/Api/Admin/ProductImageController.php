<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderProductImagesRequest;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Http\Requests\Admin\UpdateProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    private const DISK = 'supabase';

    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $path = $request->file('image')->store("products/{$product->id}", self::DISK);
        $isPrimary = (bool) ($data['is_primary'] ?? false);

        if ($isPrimary) {
            $product->images()->update(['is_primary' => false]);
        }

        $image = $product->images()->create([
            'url' => Storage::disk(self::DISK)->url($path),
            'path' => $path,
            'alt_text' => $data['alt_text'] ?? null,
            'is_primary' => $isPrimary,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return ApiResponse::success(new ProductImageResource($image), null, 201);
    }

    public function update(UpdateProductImageRequest $request, Product $product, ProductImage $image): JsonResponse
    {
        $this->ensureOwned($product, $image);
        $data = $request->validated();

        if (($data['is_primary'] ?? false) === true) {
            $product->images()->whereKeyNot($image->id)->update(['is_primary' => false]);
        }

        $image->update($data);

        return ApiResponse::success(new ProductImageResource($image->fresh()));
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        $this->ensureOwned($product, $image);

        if ($image->path) {
            Storage::disk(self::DISK)->delete($image->path);
        }
        $image->delete();

        return ApiResponse::success(['message' => 'Image deleted.']);
    }

    public function reorder(ReorderProductImagesRequest $request, Product $product): JsonResponse
    {
        $ids = $request->validated()['order'];
        $ownedCount = $product->images()->whereIn('id', $ids)->count();

        if ($ownedCount !== count($ids)) {
            return ApiResponse::error('All image ids must belong to this product.', 'invalid_order', 422);
        }

        foreach (array_values($ids) as $index => $id) {
            $product->images()->whereKey($id)->update(['sort_order' => $index]);
        }

        return ApiResponse::success(
            ProductImageResource::collection($product->images()->orderBy('sort_order')->get())->resolve(),
        );
    }

    private function ensureOwned(Product $product, ProductImage $image): void
    {
        abort_unless($image->product_id === $product->id, 404);
    }
}
