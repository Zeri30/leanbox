import type { ReactNode } from "react";

import { AdminShell } from "@/components/nav/admin-shell";

// Admin dashboard area. Role gating (admin only) is added with the auth task.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
