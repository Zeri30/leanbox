import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Brand } from "@/components/nav/brand";

/** Rider shell (UI/UX §6) — minimal top bar, mobile-first, generous tap targets. */
export function RiderShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Brand href="/rider" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
    </div>
  );
}
