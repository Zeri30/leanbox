import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { RiderShell } from "@/components/nav/rider-shell";

// Rider area (mobile-first) — requires an authenticated rider.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="rider">
      <RiderShell>{children}</RiderShell>
    </RequireAuth>
  );
}
