import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogView } from "@/components/catalog/catalog-view";
import {
  getCategories,
  getProducts,
  parseProductsParams,
  productsQueryString,
  type ProductsParams,
  type RawSearchParams,
} from "@/lib/catalog/queries";

// Catalog reads live data + searchParams — render per request (SSR), not at build.
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<RawSearchParams>;
};

/** "vegetarian-meals" → "Vegetarian meals" for titles/breadcrumbs. */
function prettifySlug(slug: string): string {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category, search } = parseProductsParams(await searchParams);
  const title = search
    ? `Search: ${search}`
    : category
      ? `${prettifySlug(category)} products`
      : "Shop all products";
  return {
    title,
    description:
      "Browse Leanbox meals, high-protein packages, supplements, snacks, and wellness products.",
  };
}

/**
 * Catalog / product listing. The page shell (breadcrumb + heading) renders
 * instantly; the data-backed grid streams in via <Suspense> so a slow DB shows
 * skeletons rather than a blank page. The grid itself is SSR'd for SEO.
 */
export default async function ProductsPage({ searchParams }: PageProps) {
  const params = parseProductsParams(await searchParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          ...(params.category
            ? [{ label: prettifySlug(params.category) }]
            : []),
        ]}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Shop</h1>
        <p className="mt-1 text-muted-foreground">
          Fuel your goals — meals, protein, supplements, and more.
        </p>
      </header>

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogData params={params} />
      </Suspense>
    </main>
  );
}

/** Async island: fetches the first page + categories, then mounts the client view. */
async function CatalogData({ params }: { params: ProductsParams }) {
  const [initialData, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  return (
    <CatalogView
      // Remount when a real navigation (nav link / direct URL) changes the
      // server params, so the view re-seeds from the live URL.
      key={productsQueryString(params)}
      categories={categories}
      initialParams={params}
      initialData={initialData}
    />
  );
}
