"use client";

import { Pencil, Plus, PowerOff, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminProducts,
  useDeleteProduct,
  type AdminProductsParams,
} from "@/lib/admin/catalog";
import type { Product } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const params: AdminProductsParams = {
    search: search.trim() || undefined,
    isActive: filter === "all" ? undefined : filter === "active",
    page,
  };
  const { data, isLoading, isError } = useAdminProducts(params);
  const remove = useDeleteProduct();

  const products = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast(`"${pendingDelete.name}" deactivated.`, "success");
    } catch {
      toast("Couldn't deactivate the product.", "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your catalog — {pagination?.total ?? 0} total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" /> New product
          </Link>
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
            className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load products. Please refresh and try again.
          </p>
        ) : products.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No products match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatPHP(p.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.stock_status === "out_of_stock"
                            ? "text-destructive"
                            : p.stock_status === "low_stock"
                              ? "text-warning"
                              : "text-foreground"
                        }
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.is_featured && <Badge variant="featured">Featured</Badge>}
                        {p.is_best_selling && <Badge variant="info">Best seller</Badge>}
                        {p.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Pencil className="size-4" /> Edit
                          </Link>
                        </Button>
                        {p.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setPendingDelete(p)}
                          >
                            <PowerOff className="size-4" /> Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Deactivate "${pendingDelete?.name ?? ""}"?`}
        description="The product is soft-deleted (hidden from the store) but kept for order history. You can re-activate it later by editing it."
        confirmText="Deactivate"
        variant="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
