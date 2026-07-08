import type { ReactNode } from "react";

import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { Footer } from "@/components/nav/footer";
import { SkipLink } from "@/components/nav/skip-link";
import { TopNav } from "@/components/nav/top-nav";

/** Storefront chrome: top nav (all sizes) + footer + bottom tab bar (mobile only). */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <TopNav />
      {/* pb leaves room for the fixed mobile tab bar; cleared from md up.
          Skip-link target — pages render their own <main> inside. */}
      <div
        id="main-content"
        tabIndex={-1}
        className="flex-1 pb-20 focus-visible:outline-none md:pb-0"
      >
        {children}
      </div>
      <Footer />
      <BottomTabBar />
    </div>
  );
}
