"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverLift } from "@/components/motion";
import { cn, formatPHP } from "@/lib/utils";

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
  onAddToCart,
  className,
}: ProductCardProps) {
  const outOfStock = typeof stock === "number" && stock <= 0;

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
          disabled={outOfStock}
          onClick={onAddToCart}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </HoverLift>
  );
}
