import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/product-grid";
import {
  getBestSellers,
  getFeaturedProducts,
  productToCardProps,
} from "@/lib/catalog/queries";

/** Featured products — a responsive grid (up to 4 cols). */
export async function FeaturedProducts() {
  const { items } = await getFeaturedProducts(4);
  if (items.length === 0) return null;
  return <ProductGrid products={items} />;
}

/**
 * Best-sellers — a horizontally scrolling, snapping row (UI/UX §6: mobile uses
 * horizontal scroll). Cards keep a fixed width so the rail scrolls on every size.
 */
export async function BestSellers() {
  const { items } = await getBestSellers(8);
  if (items.length === 0) return null;
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
      {items.map((product) => (
        <div
          key={product.id}
          className="w-44 shrink-0 snap-start sm:w-52"
        >
          <ProductCard {...productToCardProps(product)} />
        </div>
      ))}
    </div>
  );
}

export function ProductRailSkeleton() {
  return <ProductGridSkeleton count={4} />;
}

/** Section heading with an optional "View all" link. */
export function SectionHeading({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      )}
    </div>
  );
}
