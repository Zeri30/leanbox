<?php

namespace App\Http\Resources;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Cart
 */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->items;

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($items),
            'item_count' => (int) $items->sum('quantity'),
            'subtotal' => sprintf('%.2f', $items->sum(fn ($i) => (float) $i->unit_price * $i->quantity)),
        ];
    }
}
