<?php

namespace App\Http\Resources;

use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CartItem
 */
class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'line_total' => sprintf('%.2f', (float) $this->unit_price * $this->quantity),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'price' => $this->product->price,
                'stock_status' => $this->product->stockStatus(),
                'primary_image' => optional(
                    $this->product->relationLoaded('images')
                        ? ($this->product->images->firstWhere('is_primary', true) ?? $this->product->images->first())
                        : null
                )->url,
            ]),
        ];
    }
}
