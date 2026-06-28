"use client";

import { Check, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverLift } from "@/components/motion";
import { useAuth } from "@/lib/auth";
import { useAddToCart } from "@/lib/cart";
import { cn, formatPHP } from "@/lib/utils";

const FEEDBACK_MS = 2000;

export interface ProductCardProps {
  name: string;
  price: number | string;
  href: string;
  image?: string | null;
  category?: string;
  rating?: number | null;
  reviewCount?: number;
  /** stock <= 0 disables the add-to-cart action and shows an out-of-stock badge. */
  stock?: number;
  featured?: boolean;
  /** Enables built-in quick-add (qty 1) from the card. */
  productId?: number;
  /** Override the add action entirely (e.g. the component preview page). */
  onAddToCart?: () => void;
  className?: string;
}

export function ProductCard({
  name,
  price,
  href,
  image,
  category,
  rating,
  reviewCount,
  stock,
  featured,
  productId,
  onAddToCart,
  className,
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const outOfStock = typeof stock === "number" && stock <= 0;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }
    if (productId == null) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Optimistic feedback; the nav badge bumps via the hook, revert on failure.
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addToCart.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          addedTimer.current = setTimeout(() => setAdded(false), FEEDBACK_MS);
        },
        onError: () => setAdded(false),
      },
    );
  };

  return (
    <HoverLift
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-colors hover:border-border-strong",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-elevated">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-subtle">
              No image
            </div>
          )}
          {featured && (
            <Badge variant="featured" className="absolute left-2 top-2">
              Featured
            </Badge>
          )}
          {outOfStock && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Out of stock
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <Badge variant="category" className="self-start">
            {category}
          </Badge>
        )}

        <Link href={href}>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {name}
          </h3>
        </Link>

        {typeof rating === "number" && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground">
              {rating.toFixed(1)}
            </span>
            {typeof reviewCount === "number" && <span>({reviewCount})</span>}
          </div>
        )}

        <p className="mt-auto text-lg font-bold text-primary">
          {formatPHP(price)}
        </p>

        <Button
          className="mt-1 w-full"
          disabled={outOfStock || addToCart.isPending}
          onClick={handleAdd}
        >
          {outOfStock ? (
            "Out of stock"
          ) : added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : addToCart.isPending ? (
            "Adding…"
          ) : (
            <>
              <ShoppingCart className="size-4" /> Add to cart
            </>
          )}
        </Button>
      </div>
    </HoverLift>
  );
}
