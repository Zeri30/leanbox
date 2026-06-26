"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLogout } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Icon-only sign-out control. Confirms, revokes the token, then redirects. */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  async function onConfirm() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        aria-label="Sign out"
        onClick={() => setOpen(true)}
        className={cn(
          "grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground",
          className,
        )}
      >
        <LogOut className="size-5" />
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sign out?"
        description="You'll need to sign in again to access your account."
        confirmText="Sign out"
        variant="danger"
        loading={logout.isPending}
        onConfirm={onConfirm}
      />
    </>
  );
}
