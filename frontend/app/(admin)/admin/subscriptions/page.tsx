"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { PlanForm } from "@/components/admin/plan-form";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminPlans,
  useAdminSubscriptions,
  useDeletePlan,
  type AdminSubscriptionsParams,
} from "@/lib/admin/subscriptions";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/types/api";
import { formatDate, formatPHP } from "@/lib/utils";

const MEAL_LABEL: Record<string, string> = {
  vegetarian: "Vegetarian",
  high_protein: "High protein",
  mixed: "Mixed",
};

const SUB_STATUSES: (SubscriptionStatus | "")[] = ["", "active", "paused", "cancelled"];

export default function AdminSubscriptionsPage() {
  // Plan editor state: null = closed, undefined = new, plan = edit.
  const [editing, setEditing] = useState<SubscriptionPlan | null | undefined>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage subscription plans and monitor customer subscriptions.
        </p>
      </div>

      {editing !== null ? (
        <PlanForm plan={editing ?? undefined} onDone={() => setEditing(null)} />
      ) : (
        <PlansSection onNew={() => setEditing(undefined)} onEdit={setEditing} />
      )}

      <SubscriptionsSection />
    </div>
  );
}

function PlansSection({
  onNew,
  onEdit,
}: {
  onNew: () => void;
  onEdit: (plan: SubscriptionPlan) => void;
}) {
  const { toast } = useToast();
  const { data: plans, isLoading } = useAdminPlans();
  const remove = useDeletePlan();
  const [pendingDelete, setPendingDelete] = useState<SubscriptionPlan | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast(`"${pendingDelete.name}" deactivated.`, "success");
    } catch {
      toast("Couldn't deactivate the plan.", "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Plans</h2>
        <Button size="sm" onClick={onNew}>
          <Plus className="size-4" /> New plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (plans ?? []).length === 0 ? (
        <Card>
          <p className="py-4 text-center text-sm text-muted-foreground">
            No plans yet. Create your first plan.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(plans ?? []).map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {MEAL_LABEL[plan.meal_type] ?? plan.meal_type} ·{" "}
                    {plan.meals_per_cycle} meals / {plan.billing_interval}
                  </p>
                </div>
                {plan.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Inactive</Badge>
                )}
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatPHP(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {plan.billing_interval}
                </span>
              </p>
              {plan.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              )}
              <div className="mt-auto flex items-center gap-1 pt-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                {plan.is_active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDelete(plan)}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Deactivate "${pendingDelete?.name ?? ""}"?`}
        description="The plan is soft-deleted so existing subscriptions keep working, but no one new can subscribe."
        confirmText="Deactivate"
        variant="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

function SubscriptionsSection() {
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [page, setPage] = useState(1);

  const params: AdminSubscriptionsParams = { status: status || undefined, page };
  const { data, isLoading, isError } = useAdminSubscriptions(params);
  const subs = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Customer subscriptions {pagination ? `(${pagination.total})` : ""}
        </h2>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {SUB_STATUSES.map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                status === s
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>
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
            Couldn&apos;t load subscriptions.
          </p>
        ) : subs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No subscriptions match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Next delivery</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-foreground">
                        {sub.user?.full_name ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sub.user?.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.plan?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(sub.next_delivery_date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
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
    </section>
  );
}
