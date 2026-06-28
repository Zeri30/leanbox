import type { ReactNode } from "react";

import { Brand } from "@/components/nav/brand";

/** Minimal centered shell for auth screens (UI/UX §6) — no storefront chrome. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Brand size="lg" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
