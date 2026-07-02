"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminProduct } from "@/lib/admin/catalog";

export default function EditProductPage() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: product, isLoading, isError } = useAdminProduct(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          {product ? product.name : "Edit product"}
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError || !product ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load this product. It may have been removed.
        </p>
      ) : (
        <ProductForm product={product} />
      )}
    </div>
  );
}
