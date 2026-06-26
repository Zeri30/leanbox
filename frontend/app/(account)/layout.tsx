import type { ReactNode } from "react";

import { AccountNav } from "@/components/auth/account-nav";
import { RequireAuth } from "@/components/auth/require-auth";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { TopNav } from "@/components/nav/top-nav";

// Customer account area — requires an authenticated customer.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <RequireAuth role="customer">
        <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 pb-24 sm:grid-cols-[200px_1fr] md:pb-8">
          <aside className="sm:pt-1">
            <AccountNav />
          </aside>
          <div>{children}</div>
        </div>
      </RequireAuth>
      <BottomTabBar />
    </div>
  );
}

