"use client";

import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/nav/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "Vegetarian", href: "/products?category=vegetarian" },
  { label: "High-Protein", href: "/products?category=high-protein" },
  { label: "Supplements", href: "/products?category=supplements" },
  { label: "Snacks", href: "/products?category=snacks" },
  { label: "Wellness", href: "/products?category=wellness" },
];

/** Storefront top nav (UI/UX §5): logo left, categories center (desktop), actions right. */
export function TopNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-elevated md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Brand />

        {/* Desktop category links */}
        <nav className="mx-auto hidden items-center gap-1 md:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/products"
            aria-label="Search"
            className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <ShoppingCart className="size-5" />
          </Link>
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Link href="/account" aria-label="Account">
                <User className="size-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <nav className="border-t border-border bg-surface px-4 py-2 md:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-elevated hover:text-foreground",
                pathname === c.href && "bg-elevated text-foreground",
              )}
            >
              {c.label}
            </Link>
          ))}
          <Link
            href={isAuthenticated ? "/account" : "/login"}
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-elevated"
          >
            {isAuthenticated ? "My account" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
