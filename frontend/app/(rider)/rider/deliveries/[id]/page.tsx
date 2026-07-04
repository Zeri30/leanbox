"use client";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  MapPin,
  Navigation,
  Package,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRiderDelivery,
  useUpdateRiderDeliveryStatus,
  useUploadRiderProof,
} from "@/lib/rider/deliveries";
import { deliveryItemSummary, deliveryReference } from "@/lib/rider/format";
import type { Address, Delivery } from "@/lib/types/api";
import { formatDate } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

function fullAddress(a: Address): string {
  return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
    .filter(Boolean)
    .join(", ");
}

function mapsUrl(a: Address): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(a))}`;
}

export default function RiderDeliveryDetailPage() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: delivery, isLoading, isError } = useRiderDelivery(id);

  return (
    <div className="space-y-5">
      <Link
        href="/rider"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My deliveries
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError || !delivery ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load this delivery.</p>
      ) : (
        <DeliveryDetail delivery={delivery} />
      )}
    </div>
  );
}

function DeliveryDetail({ delivery }: { delivery: Delivery }) {
  const { toast } = useToast();
  const updateStatus = useUpdateRiderDeliveryStatus(delivery.id);
  const [confirmFail, setConfirmFail] = useState(false);

  const isTerminal = delivery.status === "delivered" || delivery.status === "failed";

  async function setStatus(status: "out_for_delivery" | "delivered" | "failed") {
    try {
      await updateStatus.mutateAsync(status);
      toast(
        status === "delivered"
          ? "Delivery completed!"
          : status === "failed"
            ? "Marked as failed."
            : "You're out for delivery.",
        "success",
      );
    } catch {
      toast("Couldn't update status. Please try again.", "error");
    } finally {
      setConfirmFail(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">
          {deliveryReference(delivery)}
        </h1>
        <StatusBadge status={delivery.status} />
      </div>

      {/* Address + map */}
      {delivery.address && (
        <Card className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {delivery.address.recipient_name}
              </p>
              <p className="text-sm text-muted-foreground">{fullAddress(delivery.address)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary" size="lg">
              <a href={mapsUrl(delivery.address)} target="_blank" rel="noopener noreferrer">
                <Navigation className="size-4" /> Directions
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href={`tel:${delivery.address.phone}`}>
                <Phone className="size-4" /> Call
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="mb-3 flex-row items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <CardTitle>{deliveryItemSummary(delivery)}</CardTitle>
        </CardHeader>
        {delivery.items && delivery.items.length > 0 ? (
          <ul className="divide-y divide-border">
            {delivery.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{it.product_name}</span>
                <span className="text-muted-foreground">× {it.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {delivery.plan ? "Subscription meal delivery." : "No item details."}
          </p>
        )}
      </Card>

      {/* Proof (once completed) */}
      {isTerminal ? (
        <Card className="space-y-3">
          <CardTitle>
            {delivery.status === "delivered" ? "Delivered" : "Failed"}
          </CardTitle>
          {delivery.delivered_at && (
            <p className="text-sm text-muted-foreground">
              Completed {formatDate(delivery.delivered_at)}
            </p>
          )}
          {delivery.delivery_notes && (
            <p className="text-sm text-foreground">“{delivery.delivery_notes}”</p>
          )}
          {delivery.proof_image_url && (
            // User-uploaded proof — load directly (no next/image optimizer/remotePatterns).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={delivery.proof_image_url}
              alt="Proof of delivery"
              className="w-full rounded-xl border border-border object-cover"
            />
          )}
        </Card>
      ) : (
        <>
          {/* Proof upload (while in progress) */}
          <ProofUpload delivery={delivery} />

          {/* Status actions */}
          <div className="space-y-2">
            {delivery.status === "assigned" && (
              <Button
                size="lg"
                className="h-14 w-full text-base"
                onClick={() => setStatus("out_for_delivery")}
                disabled={updateStatus.isPending}
              >
                <Navigation className="size-5" /> Start delivery
              </Button>
            )}
            {delivery.status === "out_for_delivery" && (
              <Button
                size="lg"
                className="h-14 w-full text-base"
                onClick={() => setStatus("delivered")}
                disabled={updateStatus.isPending}
              >
                <CheckCircle2 className="size-5" /> Mark delivered
              </Button>
            )}
            <Button
              variant="danger"
              size="lg"
              className="h-12 w-full"
              onClick={() => setConfirmFail(true)}
              disabled={updateStatus.isPending}
            >
              Can&apos;t deliver — mark failed
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmFail}
        onOpenChange={setConfirmFail}
        title="Mark this delivery failed?"
        description="Use this only if the delivery can't be completed."
        confirmText="Mark failed"
        variant="danger"
        loading={updateStatus.isPending}
        onConfirm={() => setStatus("failed")}
      />
    </>
  );
}

function ProofUpload({ delivery }: { delivery: Delivery }) {
  const { toast } = useToast();
  const upload = useUploadRiderProof(delivery.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");

  // Upload as soon as a photo is captured — a single tap, no separate "Upload"
  // button. This avoids the mobile pitfall where the first tap on a later button
  // only dismisses the notes keyboard, so proof appeared to need a second click.
  async function pickAndUpload(files: FileList | null) {
    const f = files?.[0];
    // Reset the input so picking the same photo again still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast("Photo must be 5 MB or smaller.", "error");
      return;
    }
    try {
      await upload.mutateAsync({ file: f, notes: notes.trim() || undefined });
      toast("Proof uploaded.", "success");
      setNotes("");
    } catch {
      toast("Couldn't upload the photo.", "error");
    }
  }

  return (
    <Card className="space-y-3">
      <CardHeader className="mb-0">
        <CardTitle>Proof of delivery</CardTitle>
      </CardHeader>

      {delivery.proof_image_url ? (
        <p className="text-sm text-success">
          A photo is attached. Take another to replace it.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add a note if needed, then take a photo — it uploads right away.
        </p>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Note (optional, e.g. left with the guard)…"
        className="w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(e) => pickAndUpload(e.target.files)}
      />

      <Button
        size="lg"
        className="h-14 w-full text-base"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        <Camera className="size-5" />
        {upload.isPending
          ? "Uploading…"
          : delivery.proof_image_url
            ? "Replace photo"
            : "Take / choose photo"}
      </Button>
    </Card>
  );
}
