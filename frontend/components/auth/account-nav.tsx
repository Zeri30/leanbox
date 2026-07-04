"use client";

import {
  Bell,
  KeyRound,
  LogOut,
  Menu,
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

function isActive(href: string, pathname: string) {
  // Exact match for the index (/account); prefix match for sub-sections so
  // detail routes (e.g. /account/orders/12) keep their tab active.
  return href === "/account"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Account section navigation + sign-out. Collapses into a hamburger dropdown on
 * small / medium screens; becomes a vertical sidebar at lg and up.
 */
export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  const current = ITEMS.find((item) => isActive(item.href, pathname));

  const links = ITEMS.map((item) => {
    const active = isActive(item.href, pathname);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMenuOpen(false)}
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
  });

  const signOut = (
    <Button
      variant="ghost"
      className="justify-start"
      onClick={() => setConfirmOpen(true)}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );

  const CurrentIcon = current?.icon ?? Menu;

  return (
    <>
      {/* Mobile / tablet: hamburger disclosure */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="account-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className="flex items-center gap-2">
            <CurrentIcon className="size-4 text-primary" />
            {current?.label ?? "Menu"}
          </span>
          <Menu className="size-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <nav
            id="account-menu"
            className="mt-1 flex flex-col gap-1 rounded-lg border border-border bg-surface p-1"
          >
            {links}
            <div className="my-1 border-t border-border" />
            {signOut}
          </nav>
        )}
      </div>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:flex lg:flex-col lg:gap-1">
        {links}
        <div className="mt-2">{signOut}</div>
      </nav>

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
    </>
  );
}
