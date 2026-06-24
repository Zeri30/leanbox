import type { ReactNode } from "react";

// Rider area (mobile-first). Role gating (rider only) is added in Sprint 1+.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
