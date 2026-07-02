import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A single dashboard metric tile (label, value, icon). */
export function KpiCard({
  label,
  value,
  icon: Icon,
  loading = false,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex items-center gap-4", className)}>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-20" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
      </div>
    </Card>
  );
}
