"use client";

import { Check, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/lib/admin/catalog";
import type { Category } from "@/lib/types/api";

function CategoryRow({ category }: { category: Category }) {
  const { toast } = useToast();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    try {
      await update.mutateAsync({
        id: category.id,
        name: name.trim(),
        description: description.trim() || null,
      });
      toast("Category updated.", "success");
      setEditing(false);
    } catch {
      toast("Couldn't update the category.", "error");
    }
  }

  async function toggleActive() {
    try {
      await update.mutateAsync({
        id: category.id,
        name: category.name,
        is_active: !category.is_active,
      });
      toast(category.is_active ? "Category deactivated." : "Category activated.", "success");
    } catch {
      toast("Couldn't update the category.", "error");
    }
  }

  async function confirmDelete() {
    try {
      await remove.mutateAsync(category.id);
      toast(`"${category.name}" deactivated.`, "success");
    } catch {
      toast("Couldn't deactivate the category.", "error");
    } finally {
      setConfirmOpen(false);
    }
  }

  if (editing) {
    return (
      <tr className="border-b border-border">
        <td className="px-4 py-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        </td>
        <td className="px-4 py-3">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="h-9"
          />
        </td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" onClick={save} disabled={update.isPending}>
              <Check className="size-4" /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(category.name);
                setDescription(category.description ?? "");
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border hover:bg-elevated/50">
      <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{category.description || "—"}</td>
      <td className="px-4 py-3">
        {category.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleActive} disabled={update.isPending}>
            {category.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`Deactivate "${category.name}"?`}
          description="The category is soft-deleted (kept for existing products)."
          confirmText="Deactivate"
          variant="danger"
          loading={remove.isPending}
          onConfirm={confirmDelete}
        />
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const { data: categories, isLoading, isError } = useAdminCategories();
  const create = useCreateCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast("Category created.", "success");
      setName("");
      setDescription("");
    } catch {
      toast("Couldn't create the category. The name may already exist.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your catalog. Categories are soft-deleted, never removed.
        </p>
      </div>

      <Card>
        <CardHeader className="mb-4">
          <CardTitle>Add a category</CardTitle>
        </CardHeader>
        <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Supplements"
            />
          </div>
          <div className="flex min-w-48 flex-2 flex-col gap-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            <Plus className="size-4" /> {create.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load categories.
          </p>
        ) : (categories ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No categories yet. Add your first above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(categories ?? []).map((c) => (
                  <CategoryRow key={c.id} category={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
