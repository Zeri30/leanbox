import type { ReactNode } from "react";

// Customer account area. Auth gating (require a logged-in customer) is added in Sprint 1+.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
