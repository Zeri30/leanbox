"use client";

import { KeyRound, LogOut, User as UserIcon, type LucideIcon } from "lucide-react";
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
        const active = pathname === item.href;
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
