"use client";

import {
  Bell,
  KeyRound,
  LogOut,
  Package,
  Repeat,
  Star,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ITEMS: Item[] = [
  { label: "Profile", href: "/account", icon: UserIcon },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Subscriptions", href: "/account/subscriptions", icon: Repeat },
  { label: "Notifications", href: "/account/notifications", icon: Bell },
  { label: "My reviews", href: "/account/reviews", icon: Star },
  { label: "Change password", href: "/account/password", icon: KeyRound },
];

/** Account section navigation + sign-out. Horizontal on mobile, sidebar on desktop. */
export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
      {ITEMS.map((item) => {
        // Exact match for the index (/account); prefix match for sub-sections
        // so detail routes (e.g. /account/orders/12) keep their tab active.
        const active =
          item.href === "/account"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-elevated hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="mt-0 justify-start sm:mt-2"
        onClick={() => setConfirmOpen(true)}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out?"
        description="You'll need to sign in again to access your account."
        confirmText="Sign out"
        variant="danger"
        loading={logout.isPending}
        onConfirm={onLogout}
      />
    </nav>
  );
}
