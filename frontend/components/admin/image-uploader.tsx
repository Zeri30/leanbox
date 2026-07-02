"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  useDeleteProductImage,
  useUpdateProductImage,
  useUploadProductImage,
} from "@/lib/admin/catalog";
import type { ProductImage } from "@/lib/types/api";

const MAX_BYTES = 5 * 1024 * 1024; // matches StoreProductImageRequest (max:5120 KB)
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Upload, preview, set-primary and delete product images (edit mode only). */
export function ImageUploader({
  productId,
  images,
}: {
  productId: number;
  images: ProductImage[];
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductImage | null>(null);

  const upload = useUploadProductImage(productId);
  const updateImage = useUpdateProductImage(productId);
  const remove = useDeleteProductImage(productId);

  const hasPrimary = images.some((img) => img.is_primary);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > MAX_BYTES) {
      toast("Image must be 5 MB or smaller.", "error");
      return;
    }
    try {
      // First image becomes primary automatically.
      await upload.mutateAsync({ file, isPrimary: !hasPrimary });
      toast("Image uploaded.", "success");
    } catch {
      toast("Couldn't upload the image.", "error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function setPrimary(image: ProductImage) {
    if (image.is_primary) return;
    try {
      await updateImage.mutateAsync({ imageId: image.id, is_primary: true });
      toast("Primary image updated.", "success");
    } catch {
      toast("Couldn't update the primary image.", "error");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast("Image removed.", "success");
    } catch {
      toast("Couldn't remove the image.", "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Image
              src={img.url}
              alt={img.alt_text ?? "Product image"}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover"
            />
            {img.is_primary ? (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                <Star className="size-3" /> Primary
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPrimary(img)}
                disabled={updateImage.isPending}
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white opacity-0 transition-opacity hover:bg-primary group-hover:opacity-100"
              >
                <Star className="size-3" /> Set primary
              </button>
            )}
            <button
              type="button"
              aria-label="Delete image"
              onClick={() => setPendingDelete(img)}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className={cn(
            "grid aspect-square place-items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            upload.isPending && "opacity-60",
          )}
        >
          <ImagePlus className="size-6" />
          <span className="text-xs font-medium">
            {upload.isPending ? "Uploading…" : "Add image"}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this image?"
        description="This permanently removes the image from storage."
        confirmText="Delete"
        variant="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
