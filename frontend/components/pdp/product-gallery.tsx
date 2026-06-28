"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductImage } from "@/lib/types/api";
import { cn } from "@/lib/utils";

/** Product image gallery: large active image + selectable thumbnails (UI/UX §6). */
export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-elevated">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt_text ?? name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-subtle">
            No image
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-elevated transition-colors sm:size-20",
                  i === active
                    ? "border-primary"
                    : "border-border hover:border-border-strong",
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? `${name} thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
