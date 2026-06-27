import Link from "next/link";

import { Brand } from "@/components/nav/brand";
import { NAV_CATEGORIES } from "@/lib/catalog/nav-categories";

/** Storefront footer (UI/UX §6 Home) — brand, category links, account links. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Brand />
          <p className="max-w-xs text-sm text-muted-foreground">
            Eat lean. Live strong. Healthy meals and meal-prep subscriptions
            delivered across the Philippines.
          </p>
        </div>

        <FooterColumn title="Shop">
          <FooterLink href="/products">All products</FooterLink>
          {NAV_CATEGORIES.map((c) => (
            <FooterLink key={c.slug} href={`/products?category=${c.slug}`}>
              {c.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Account">
          <FooterLink href="/account">My account</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
          <FooterLink href="/register">Create account</FooterLink>
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink href="/products">Subscriptions</FooterLink>
          <FooterLink href="/products?sort=newest">New arrivals</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-subtle">
          © {new Date().getFullYear()} Leanbox. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
