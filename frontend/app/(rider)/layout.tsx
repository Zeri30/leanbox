import type { ReactNode } from "react";

import { RiderShell } from "@/components/nav/rider-shell";

// Rider area (mobile-first). Role gating (rider only) is added with the auth task.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <RiderShell>{children}</RiderShell>;
}
