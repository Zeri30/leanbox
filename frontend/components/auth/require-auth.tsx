"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { useMe } from "@/lib/auth";
import { useToken } from "@/lib/auth/token";
import type { UserRole } from "@/lib/types/api";

// Hydration detector: false on the server + first client render, true once
// hydrated. Same pattern (and timing) as the token store, so when this flips
// true the real token has already synced in.
const noopSubscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin motion-reduce:animate-none" />
    </div>
  );
}

/**
 * Client-side route guard. Redirects unauthenticated users to /login (preserving
 * the intended path) and, when `role` is set, redirects users without that role
 * to their own home. Tokens live in localStorage, so guarding is client-side.
 */
export function RequireAuth({
  role,
  children,
}: {
  role?: UserRole;
  children: ReactNode;
}) {
  const token = useToken();
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isError, isLoading } = useMe();

  // The token store reads from localStorage only on the client, so its first
  // (hydration) snapshot is always null. Wait until hydrated to act on it —
  // otherwise a hard load / refresh of a guarded route would redirect an
  // authenticated user to /login before the real token syncs in.
  const hydrated = useHydrated();

  const roleMismatch = !!user && !!role && user.role !== role;

  useEffect(() => {
    if (!hydrated) return;
    if (!token || isError) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }
    if (roleMismatch) {
      router.replace("/");
    }
  }, [hydrated, token, isError, roleMismatch, pathname, router]);

  if (!hydrated || !token || isLoading || !user || roleMismatch) {
    return <Loading />;
  }

  return <>{children}</>;
}
