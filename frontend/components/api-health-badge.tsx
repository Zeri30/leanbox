"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Health {
  status: string;
  service: string;
  version: string;
}

/** Live check of the backend /health endpoint — exercises the API client + envelope + TanStack Query. */
export function ApiHealthBadge() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<Health>("/health"),
    retry: false,
  });

  const ok = !isLoading && !isError && data?.data.status === "ok";
  const label = isLoading
    ? "checking API…"
    : ok
      ? `API ${data?.data.version} online`
      : "API offline";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        ok
          ? "bg-success/10 text-success"
          : isLoading
            ? "bg-elevated text-muted-foreground"
            : "bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          ok ? "bg-success" : isLoading ? "bg-muted-foreground" : "bg-destructive",
        )}
      />
      {label}
    </span>
  );
}
