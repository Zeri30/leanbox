"use client";

import { Bell, ClipboardList, History, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Brand } from "@/components/nav/brand";
import { SkipLink } from "@/components/nav/skip-link";
import { useMe } from "@/lib/auth";
import { useUnreadNotificationCount } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface RiderTab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const RIDER_TABS: RiderTab[] = [
  { label: "Deliveries", href: "/rider", icon: ClipboardList },
  { label: "History", href: "/rider/history", icon: History },
  { label: "Alerts", href: "/rider/notifications", icon: Bell },
  { label: "Profile", href: "/rider/profile", icon: User },
];

/** Rider shell (UI/UX §6) — mobile-first: minimal top bar + a bottom tab bar. */
export function RiderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useMe();
  const unread = useUnreadNotificationCount();

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Brand href="/rider" />
          <div className="flex items-center gap-3">
            {firstName && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Hi, <span className="font-medium text-foreground">{firstName}</span>
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* pb leaves room for the fixed bottom bar */}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-5 pb-28 focus-visible:outline-none">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {RIDER_TABS.map((tab) => {
            const active =
              tab.href === "/rider"
                ? pathname === "/rider"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            const showBadge = tab.href === "/rider/notifications" && unread > 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
