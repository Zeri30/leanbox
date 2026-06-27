import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCategories } from "@/lib/catalog/queries";

/** Category quick-links (5 categories) — links into the filtered catalog. */
export async function CategoryLinks() {
  const categories = await getCategories();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.slug}`}
          className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-elevated"
        >
          <span className="line-clamp-2">{c.name}</span>
          <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      ))}
    </div>
  );
}

/** Skeleton placeholder for the category quick-links row. */
export function CategoryLinksSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[58px] rounded-2xl border border-border bg-elevated"
          aria-hidden
        />
      ))}
    </div>
  );
}
