import type { ReactNode } from "react";

import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { TopNav } from "@/components/nav/top-nav";

// Customer account area. Auth gating (require a logged-in customer) is added with the auth task.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 md:pb-8">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}

