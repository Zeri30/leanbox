<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Events\StockChanged;
use App\Exceptions\OrderException;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    /** Flat shipping fee (PHP). Delivery-fee model TBD — see PRD open questions. */
    private const SHIPPING_FEE = 49.0;

    /**
     * Convert the user's cart into a pending order: snapshot line items, decrement
     * stock under a lock, clear the cart — all in one transaction. Throws OrderException
     * (rolling back) if the cart is empty or any line is short/unavailable.
     */
    public function placeFromCart(User $user, int $deliveryAddressId): Order
    {
        $order = DB::transaction(function () use ($user, $deliveryAddressId) {
            $cart = $user->cart()->first();
            $items = $cart ? $cart->items()->get() : collect();

            if ($items->isEmpty()) {
                throw new OrderException('cart_empty', 'Your cart is empty.', 422);
            }

            // Lock the product rows to prevent overselling under concurrency.
            $products = Product::whereIn('id', $items->pluck('product_id'))
                ->lockForUpdate()->get()->keyBy('id');

            foreach ($items as $item) {
                $product = $products->get($item->product_id);
                if (! $product || ! $product->is_active) {
                    throw new OrderException('product_unavailable', 'A product in your cart is no longer available.', 422);
                }
                if ($product->stock_quantity < $item->quantity) {
                    throw new OrderException('insufficient_stock', "Not enough stock for {$product->name}.", 422);
                }
            }

            $subtotal = $items->sum(fn ($i) => (float) $i->unit_price * $i->quantity);

            $order = Order::create([
                'user_id' => $user->id,
                'delivery_address_id' => $deliveryAddressId,
                'order_number' => $this->generateOrderNumber(),
                'status' => OrderStatus::Pending,
                'subtotal' => $subtotal,
                'shipping_fee' => self::SHIPPING_FEE,
                'tax' => 0,
                'total' => $subtotal + self::SHIPPING_FEE,
                'placed_at' => now(),
            ]);

            foreach ($items as $item) {
                $product = $products->get($item->product_id);
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name, // snapshot
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price, // cart snapshot (price the customer saw)
                    'line_total' => round((float) $item->unit_price * $item->quantity, 2),
                ]);
                $product->decrement('stock_quantity', $item->quantity);
            }

            $cart->items()->delete();

            return $order;
        });

        $order->loadMissing('items');
        $this->announceStockChange($order);
        OrderStatusChanged::dispatch($order, null, OrderStatus::Pending);

        return $order;
    }

    /** Cancel an order and restock its items (caller validates it's cancellable). */
    public function cancel(Order $order): Order
    {
        $previous = $order->status;
        $order->loadMissing('items');

        DB::transaction(function () use ($order) {
            $products = Product::whereIn('id', $order->items->pluck('product_id'))
                ->lockForUpdate()->get()->keyBy('id');

            foreach ($order->items as $item) {
                $products->get($item->product_id)?->increment('stock_quantity', $item->quantity);
            }

            $order->update(['status' => OrderStatus::Cancelled]);
        });

        $this->announceStockChange($order);
        OrderStatusChanged::dispatch($order, $previous, OrderStatus::Cancelled);

        return $order;
    }

    /** Apply an admin/lifecycle status change, enforcing allowed transitions. */
    public function transition(Order $order, OrderStatus $to): Order
    {
        if (! $order->status->canTransitionTo($to)) {
            throw new OrderException(
                'invalid_transition',
                "Cannot change order from {$order->status->value} to {$to->value}.",
                422,
            );
        }

        if ($to === OrderStatus::Cancelled) {
            return $this->cancel($order);
        }

        $previous = $order->status;
        $order->update(['status' => $to]);
        OrderStatusChanged::dispatch($order, $previous, $to);

        return $order;
    }

    private function announceStockChange(Order $order): void
    {
        foreach ($order->items->pluck('product_id')->unique() as $productId) {
            StockChanged::dispatch((int) $productId);
        }
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'ORD-'.now()->format('ymd').'-'.strtoupper(Str::random(6));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
