import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { AdminShell } from "@/components/nav/admin-shell";

// Admin dashboard area — requires an authenticated admin.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
