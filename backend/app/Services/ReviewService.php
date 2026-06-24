<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Exceptions\ReviewException;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;

class ReviewService
{
    /**
     * Create a verified-purchase review: the user must have a delivered order
     * containing the product, and may review each product only once.
     *
     * @param  array{rating:int, comment?:string|null}  $data
     */
    public function create(User $user, Product $product, array $data): Review
    {
        $deliveredOrder = Order::query()
            ->where('user_id', $user->id)
            ->where('status', OrderStatus::Delivered)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->first();

        if ($deliveredOrder === null) {
            throw new ReviewException('not_eligible', 'You can only review products from your delivered orders.');
        }

        $alreadyReviewed = Review::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($alreadyReviewed) {
            throw new ReviewException('already_reviewed', 'You have already reviewed this product.');
        }

        return Review::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'order_id' => $deliveredOrder->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'is_hidden' => false,
        ]);
    }
}
