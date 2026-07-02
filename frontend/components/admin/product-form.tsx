"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminCategories,
  useCreateProduct,
  useUpdateProduct,
  useUpsertNutrition,
  type NutritionPayload,
  type ProductPayload,
} from "@/lib/admin/catalog";
import type { Product } from "@/lib/types/api";
import { cn } from "@/lib/utils";

/** Small on/off pill toggle (no external switch dependency). */
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-elevated",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

const NUTRITION_FIELDS: { key: keyof NutritionPayload; label: string; text?: boolean }[] = [
  { key: "serving_size", label: "Serving size", text: true },
  { key: "calories", label: "Calories" },
  { key: "protein_g", label: "Protein (g)" },
  { key: "carbs_g", label: "Carbs (g)" },
  { key: "fat_g", label: "Fat (g)" },
  { key: "fiber_g", label: "Fiber (g)" },
  { key: "sugar_g", label: "Sugar (g)" },
  { key: "sodium_mg", label: "Sodium (mg)" },
];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!product;

  const categories = useAdminCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? 0);
  const nutrition = useUpsertNutrition(product?.id ?? 0);

  // Core product fields
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    product?.category_id ? String(product.category_id) : "",
  );
  const [price, setPrice] = useState(product?.price ?? "");
  const [stock, setStock] = useState(String(product?.stock_quantity ?? 0));
  const [threshold, setThreshold] = useState(
    String(product?.low_stock_threshold ?? 10),
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isBestSelling, setIsBestSelling] = useState(
    product?.is_best_selling ?? false,
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // Nutrition (edit only)
  const [nut, setNut] = useState<Record<string, string>>(() => {
    const n = product?.nutrition;
    return {
      serving_size: n?.serving_size ?? "",
      calories: n?.calories != null ? String(n.calories) : "",
      protein_g: n?.protein_g ?? "",
      carbs_g: n?.carbs_g ?? "",
      fat_g: n?.fat_g ?? "",
      fiber_g: n?.fiber_g ?? "",
      sugar_g: n?.sugar_g ?? "",
      sodium_mg: n?.sodium_mg ?? "",
      ingredients: n?.ingredients ?? "",
    };
  });

  const saving = create.isPending || update.isPending;

  async function submitCore(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId || price === "") {
      toast("Name, category and price are required.", "error");
      return;
    }
    const payload: ProductPayload = {
      category_id: Number(categoryId),
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      stock_quantity: Number(stock) || 0,
      low_stock_threshold: Number(threshold) || 0,
      is_featured: isFeatured,
      is_best_selling: isBestSelling,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        toast("Product saved.", "success");
      } else {
        const created = await create.mutateAsync(payload);
        toast("Product created. Add images and nutrition below.", "success");
        router.push(`/admin/products/${created.id}/edit`);
      }
    } catch {
      toast("Couldn't save the product. Check the fields and try again.", "error");
    }
  }

  async function submitNutrition(e: React.FormEvent) {
    e.preventDefault();
    const payload: NutritionPayload = {
      serving_size: nut.serving_size.trim() || null,
      calories: nut.calories === "" ? null : Number(nut.calories),
      protein_g: nut.protein_g === "" ? null : Number(nut.protein_g),
      carbs_g: nut.carbs_g === "" ? null : Number(nut.carbs_g),
      fat_g: nut.fat_g === "" ? null : Number(nut.fat_g),
      fiber_g: nut.fiber_g === "" ? null : Number(nut.fiber_g),
      sugar_g: nut.sugar_g === "" ? null : Number(nut.sugar_g),
      sodium_mg: nut.sodium_mg === "" ? null : Number(nut.sodium_mg),
      ingredients: nut.ingredients.trim() || null,
    };
    try {
      await nutrition.mutateAsync(payload);
      toast("Nutrition facts saved.", "success");
    } catch {
      toast("Couldn't save nutrition facts.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Core details */}
      <Card>
        <CardHeader className="mb-4">
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <form onSubmit={submitCore} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" className="sm:col-span-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="High-Protein Chicken Bowl"
                required
              />
            </Field>

            <Field label="Category" htmlFor="category">
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                required
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_active ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Price (₱)" htmlFor="price">
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299.00"
                required
              />
            </Field>

            <Field label="Stock quantity" htmlFor="stock">
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </Field>

            <Field label="Low-stock threshold" htmlFor="threshold">
              <Input
                id="threshold"
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </Field>

            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Short description shown on the product page…"
                className="w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle
              label="Featured"
              hint="Show on the home rail"
              checked={isFeatured}
              onChange={setIsFeatured}
            />
            <Toggle
              label="Best seller"
              hint="Flag as best-selling"
              checked={isBestSelling}
              onChange={setIsBestSelling}
            />
            <Toggle
              label="Active"
              hint="Visible in the store"
              checked={isActive}
              onChange={setIsActive}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Images + nutrition only make sense once the product exists */}
      {isEdit && product && (
        <>
          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <ImageUploader productId={product.id} images={product.images ?? []} />
          </Card>

          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Nutrition facts</CardTitle>
            </CardHeader>
            <form onSubmit={submitNutrition} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {NUTRITION_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label} htmlFor={`nut-${f.key}`}>
                    <Input
                      id={`nut-${f.key}`}
                      type={f.text ? "text" : "number"}
                      min={f.text ? undefined : "0"}
                      step={f.text ? undefined : "0.1"}
                      value={nut[f.key as string]}
                      onChange={(e) =>
                        setNut((s) => ({ ...s, [f.key]: e.target.value }))
                      }
                    />
                  </Field>
                ))}
              </div>
              <Field label="Ingredients" htmlFor="nut-ingredients">
                <textarea
                  id="nut-ingredients"
                  value={nut.ingredients}
                  onChange={(e) =>
                    setNut((s) => ({ ...s, ingredients: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </Field>
              <Button type="submit" variant="secondary" disabled={nutrition.isPending}>
                {nutrition.isPending ? "Saving…" : "Save nutrition"}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
