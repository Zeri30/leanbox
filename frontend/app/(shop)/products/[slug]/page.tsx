import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { AddToCart } from "@/components/pdp/add-to-cart";
import { NutritionFacts } from "@/components/pdp/nutrition-facts";
import { ProductGallery } from "@/components/pdp/product-gallery";
import { ProductReviews } from "@/components/pdp/product-reviews";
import { Stars } from "@/components/pdp/stars";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getProduct, primaryImage } from "@/lib/catalog/queries";
import type { StockStatus } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Shared by generateMetadata + the page so the product is fetched only once per request.
const loadProduct = cache((slug: string) => getProduct(slug));

type PageProps = { params: Promise<{ slug: string }> };

const STOCK_BADGE: Record<StockStatus, { variant: BadgeProps["variant"]; label: string }> = {
  in_stock: { variant: "success", label: "In stock" },
  low_stock: { variant: "warning", label: "Low stock" },
  out_of_stock: { variant: "destructive", label: "Out of stock" },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product not found" };

  const image = primaryImage(product);
  return {
    title: product.name,
    description:
      product.description ??
      `Buy ${product.name} from Leanbox — healthy food and wellness, delivered.`,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const images = product.images ?? [];
  const stock = STOCK_BADGE[product.stock_status];
  const summary = product.reviews_summary;
  const price = formatPHP(product.price);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:pb-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          ...(product.category
            ? [
                {
                  label: product.category.name,
                  href: `/products?category=${product.category.slug}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      {/* Gallery + buy panel */}
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div className="flex flex-col gap-4">
          {product.category && (
            <Badge variant="category" className="self-start">
              {product.category.name}
            </Badge>
          )}

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {summary && summary.count > 0 && summary.average !== null ? (
            <a
              href="#reviews-heading"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Stars rating={summary.average} />
              <span className="font-medium text-foreground">
                {summary.average.toFixed(1)}
              </span>
              <span>
                ({summary.count} {summary.count === 1 ? "review" : "reviews"})
              </span>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          )}

          <p className="text-3xl font-bold text-primary">{price}</p>

          <Badge variant={stock.variant} className="self-start">
            {stock.label}
          </Badge>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {/* Desktop buy controls; mobile uses the sticky bar below. */}
          <AddToCart
            productId={product.id}
            stock={product.stock_quantity}
            className="mt-2 hidden md:flex"
          />
        </div>
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Nutrition facts</h2>
          {product.nutrition ? (
            <NutritionFacts nutrition={product.nutrition} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nutrition information isn&apos;t available for this product.
            </p>
          )}
        </div>

        {product.nutrition?.ingredients && (
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">Ingredients</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.nutrition.ingredients}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12">
        <ProductReviews productId={product.id} summary={summary} />
      </div>

      {/* Sticky mobile buy bar — sits above the bottom tab bar. */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="shrink-0 text-lg font-bold text-primary">{price}</span>
          <AddToCart
            productId={product.id}
            stock={product.stock_quantity}
            showFeedback={false}
            className="flex-1"
          />
        </div>
      </div>
    </main>
  );
}
