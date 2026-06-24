import type { ReactNode } from "react";

// Admin dashboard area. Role gating (admin only) is added in Sprint 1+.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
