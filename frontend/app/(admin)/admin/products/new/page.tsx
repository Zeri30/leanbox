"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create the product first, then add images and nutrition facts.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
