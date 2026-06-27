import Link from "next/link";
import { Suspense } from "react";

import {
  CategoryLinks,
  CategoryLinksSkeleton,
} from "@/components/home/category-links";
import {
  BestSellers,
  FeaturedProducts,
  ProductRailSkeleton,
  SectionHeading,
} from "@/components/home/product-rail";
import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";

// Home renders live catalog data per request (SSR) — don't statically
// prerender at build time, when the API may be unavailable.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-12 sm:py-16">
      {/* Hero */}
      <FadeUp>
        <section className="overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary-soft via-card to-card p-8 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Leanbox
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold sm:text-5xl">
            Eat lean. Live strong.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Healthy meals, high-protein packages, supplements, snacks, and
            meal-prep subscriptions — delivered across the Philippines.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop now</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/products?sort=newest">What&apos;s new</Link>
            </Button>
          </div>
        </section>
      </FadeUp>

      {/* Category quick-links */}
      <section>
        <SectionHeading title="Shop by category" href="/products" />
        <Suspense fallback={<CategoryLinksSkeleton />}>
          <CategoryLinks />
        </Suspense>
      </section>

      {/* Featured */}
      <section>
        <SectionHeading title="Featured" href="/products" />
        <Suspense fallback={<ProductRailSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Best-sellers */}
      <section>
        <SectionHeading title="Best-sellers" href="/products?sort=newest" />
        <Suspense fallback={<ProductRailSkeleton />}>
          <BestSellers />
        </Suspense>
      </section>

      {/* Subscription promo band */}
      <FadeUp>
        <section className="flex flex-col items-start gap-4 rounded-3xl border border-primary/20 bg-primary-soft/50 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold">Never run out of healthy meals</h2>
            <p className="mt-2 text-muted-foreground">
              Subscribe to a weekly meal-prep plan and get fresh boxes delivered
              on repeat — pause or cancel anytime.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/products">Explore plans</Link>
          </Button>
        </section>
      </FadeUp>
    </main>
  );
}
