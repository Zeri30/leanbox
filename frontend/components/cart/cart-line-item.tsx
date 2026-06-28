"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { QuantityStepper } from "@/components/pdp/quantity-stepper";
import { useRemoveCartItem, useUpdateCartItem } from "@/lib/cart";
import type { CartItem } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

const MAX_QTY = 99;

/** A single cart line: image, name, unit price, quantity stepper, line total, remove. */
export function CartLineItem({ item }: { item: CartItem }) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const product = item.product;
  const busy = updateItem.isPending || removeItem.isPending;

  return (
    <div className="flex gap-4 py-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-elevated">
        {product?.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-subtle">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link
                href={`/products/${product.slug}`}
                className="line-clamp-2 font-medium text-foreground hover:text-primary"
              >
                {product.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">Item</span>
            )}
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPHP(item.unit_price)} each
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove item"
            disabled={busy}
            onClick={() => removeItem.mutate({ itemId: item.id })}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
            max={MAX_QTY}
            disabled={busy}
          />
          <span className="font-semibold text-foreground tabular-nums">
            {formatPHP(item.line_total)}
          </span>
        </div>
      </div>
    </div>
  );
}
