<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'stock_quantity' => $this->stock_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'is_featured' => $this->is_featured,
            'is_best_selling' => $this->is_best_selling,
            'is_active' => $this->is_active,
            'stock_status' => $this->stockStatus(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'nutrition' => NutritionFactResource::make($this->whenLoaded('nutritionFacts')),
            'reviews_summary' => $this->when(isset($this->reviews_count), fn () => [
                'count' => (int) $this->reviews_count,
                'average' => isset($this->reviews_avg) && $this->reviews_avg !== null
                    ? round((float) $this->reviews_avg, 1)
                    : null,
            ]),
        ];
    }
}
