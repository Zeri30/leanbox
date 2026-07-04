"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminDeliveries,
  useAssignDelivery,
  useFailDelivery,
  useRiders,
  type AdminDeliveriesParams,
} from "@/lib/admin/deliveries";
import type { Delivery, DeliveryStatus } from "@/lib/types/api";
import { cn, formatDate } from "@/lib/utils";

const STATUSES: (DeliveryStatus | "")[] = [
  "",
  "pending",
  "assigned",
  "out_for_delivery",
  "delivered",
  "failed",
];

/** Delivered/failed deliveries are terminal — they can't be assigned or failed. */
function isTerminal(status: DeliveryStatus) {
  return status === "delivered" || status === "failed";
}

export default function AdminDeliveriesPage() {
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const params: AdminDeliveriesParams = { status: status || undefined, page };
  const { data, isLoading, isError } = useAdminDeliveries(params);

  const deliveries = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign riders and track deliveries — {pagination?.total ?? 0} total.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1 sm:flex">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "rounded-md px-2 py-1.5 text-center text-xs font-medium capitalize transition-colors sm:px-3 sm:text-sm",
              status === s
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load deliveries.
          </p>
        ) : deliveries.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No deliveries match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Deliver to</th>
                  <th className="px-4 py-3 font-medium">Rider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.map((d) => (
                  <Fragment key={d.id}>
                    <tr className="hover:bg-elevated/50">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {d.order?.order_number ??
                          (d.subscription_id
                            ? `Subscription #${d.subscription_id}`
                            : `Delivery #${d.id}`)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.address
                          ? `${d.address.recipient_name} · ${d.address.city}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.rider?.full_name ?? (
                          <span className="text-subtle">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                        >
                          Manage
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              expanded === d.id && "rotate-180",
                            )}
                          />
                        </Button>
                      </td>
                    </tr>
                    {expanded === d.id && (
                      <tr className="bg-elevated/30">
                        <td colSpan={5} className="p-0">
                          {/* The table scrolls horizontally on small screens; pin
                              the panel to the viewport's left edge and cap its width
                              so its controls can't overflow past the screen. */}
                          <div className="sticky left-0 w-[calc(100vw-2rem)] max-w-3xl px-4 py-4 sm:w-[calc(100vw-3rem)] lg:w-full lg:max-w-none">
                            <ManagePanel delivery={d} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
    </div>
  );
}

function ManagePanel({ delivery }: { delivery: Delivery }) {
  const { toast } = useToast();
  const { data: riders, isLoading: ridersLoading } = useRiders();
  const assign = useAssignDelivery();
  const fail = useFailDelivery();
  const [riderId, setRiderId] = useState<string>(
    delivery.rider_id ? String(delivery.rider_id) : "",
  );
  const [confirmFail, setConfirmFail] = useState(false);

  const terminal = isTerminal(delivery.status);
  const assigned = delivery.rider_id != null;

  async function doAssign() {
    if (!riderId) {
      toast("Pick a rider first.", "error");
      return;
    }
    try {
      await assign.mutateAsync({ deliveryId: delivery.id, riderId: Number(riderId) });
      toast(assigned ? "Rider reassigned." : "Rider assigned.", "success");
    } catch {
      toast("Couldn't assign the rider.", "error");
    }
  }

  async function doFail() {
    try {
      await fail.mutateAsync(delivery.id);
      toast("Delivery marked failed.", "success");
    } catch {
      toast("Couldn't mark this delivery failed.", "error");
    } finally {
      setConfirmFail(false);
    }
  }

  // Completed deliveries: show proof + outcome, no actions.
  if (terminal) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <Detail
            label={delivery.status === "delivered" ? "Delivered at" : "Failed"}
            value={
              delivery.status === "delivered"
                ? formatDate(delivery.delivered_at)
                : "This delivery was marked failed."
            }
          />
          {delivery.rider && (
            <Detail label="Rider" value={delivery.rider.full_name} />
          )}
          {delivery.delivery_notes && (
            <Detail label="Notes" value={delivery.delivery_notes} />
          )}
        </div>
        {delivery.proof_image_url && (
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Proof of delivery
            </p>
            {/* User-uploaded proof — load directly (no next/image optimizer). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={delivery.proof_image_url}
              alt="Proof of delivery"
              className="w-full max-w-xs rounded-lg border border-border object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-56">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">
          {assigned ? "Reassign rider" : "Assign rider"}
        </label>
        <Select
          value={riderId}
          onValueChange={setRiderId}
          disabled={ridersLoading}
          placeholder={ridersLoading ? "Loading riders…" : "Select a rider…"}
          options={(riders ?? []).map((r) => ({
            value: String(r.id),
            label: r.full_name,
          }))}
          aria-label={assigned ? "Reassign rider" : "Assign rider"}
          className="w-full"
        />
      </div>
      <Button onClick={doAssign} disabled={assign.isPending}>
        {assign.isPending ? "Saving…" : assigned ? "Reassign" : "Assign"}
      </Button>
      <Button variant="danger" onClick={() => setConfirmFail(true)} disabled={fail.isPending}>
        Mark failed
      </Button>

      {(riders ?? []).length === 0 && !ridersLoading && (
        <p className="w-full text-xs text-muted-foreground">
          No active riders available. Add a rider account first.
        </p>
      )}

      <ConfirmDialog
        open={confirmFail}
        onOpenChange={setConfirmFail}
        title="Mark this delivery failed?"
        description="Use this when a delivery can't be completed. It won't advance the order to delivered."
        confirmText="Mark failed"
        variant="danger"
        loading={fail.isPending}
        onConfirm={doFail}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
