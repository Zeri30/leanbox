"use client";

import { ChevronDown, Search } from "lucide-react";
import { Fragment, useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCustomers,
  useUpdateCustomerStatus,
  type AdminCustomersParams,
} from "@/lib/admin/customers";
import type { User } from "@/lib/types/api";
import { cn, formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, setPending] = useState<User | null>(null);

  const params: AdminCustomersParams = { search: search.trim() || undefined, page };
  const { data, isLoading, isError } = useAdminCustomers(params);
  const updateStatus = useUpdateCustomerStatus();

  const customers = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  async function confirmToggle() {
    if (!pending) return;
    const next = pending.status === "active" ? "suspended" : "active";
    try {
      await updateStatus.mutateAsync({ id: pending.id, status: next });
      toast(
        next === "suspended" ? "Customer suspended." : "Customer reactivated.",
        "success",
      );
    } catch {
      toast("Couldn't update the customer.", "error");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage customer accounts — {pagination?.total ?? 0} total.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
          className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load customers.
          </p>
        ) : customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No customers match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  const isOpen = expanded === c.id;
                  return (
                    <Fragment key={c.id}>
                      <tr className="hover:bg-elevated/50">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {c.full_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                        <td className="px-4 py-3">
                          {c.status === "active" ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpanded(isOpen ? null : c.id)}
                            >
                              View
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform",
                                  isOpen && "rotate-180",
                                )}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={
                                c.status === "active"
                                  ? "text-destructive hover:text-destructive"
                                  : "text-primary hover:text-primary"
                              }
                              onClick={() => setPending(c)}
                            >
                              {c.status === "active" ? "Suspend" : "Reactivate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-elevated/30">
                          <td colSpan={4} className="px-4 py-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <Detail label="Phone" value={c.phone || "—"} />
                              <Detail label="Joined" value={formatDate(c.created_at)} />
                              <Detail
                                label="Account status"
                                value={c.status === "active" ? "Active" : "Suspended"}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title={
          pending?.status === "active"
            ? `Suspend ${pending?.full_name}?`
            : `Reactivate ${pending?.full_name}?`
        }
        description={
          pending?.status === "active"
            ? "A suspended customer is blocked at login until reactivated."
            : "The customer will be able to sign in and order again."
        }
        confirmText={pending?.status === "active" ? "Suspend" : "Reactivate"}
        variant={pending?.status === "active" ? "danger" : "primary"}
        loading={updateStatus.isPending}
        onConfirm={confirmToggle}
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
