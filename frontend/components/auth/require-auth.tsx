"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useMe } from "@/lib/auth";
import { useToken } from "@/lib/auth/token";
import type { UserRole } from "@/lib/types/api";

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

  const roleMismatch = !!user && !!role && user.role !== role;

  useEffect(() => {
    if (!token || isError) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }
    if (roleMismatch) {
      router.replace("/");
    }
  }, [token, isError, roleMismatch, pathname, router]);

  if (!token || isLoading || !user || roleMismatch) {
    return <Loading />;
  }

  return <>{children}</>;
}
