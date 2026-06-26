import type { Metadata } from "next";

import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "@/components/product-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Component preview",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SWATCHES = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["elevated", "bg-elevated"],
  ["primary", "bg-primary"],
  ["primary-soft", "bg-primary-soft"],
  ["accent-lime", "bg-accent-lime"],
  ["destructive", "bg-destructive"],
  ["warning", "bg-warning"],
  ["info", "bg-info"],
] as const;

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default function PreviewPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
      <FadeUp>
        <h1 className="text-3xl font-bold">Leanbox component library</h1>
        <p className="mt-2 text-muted-foreground">
          Shared UI primitives in the dark theme + green accent. Resize the
          window to check responsive behavior.
        </p>
      </FadeUp>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className={`h-16 rounded-xl border border-border ${cls}`} />
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Heading 1 — Sora</h1>
          <h2 className="text-2xl font-bold">Heading 2 — Sora</h2>
          <h3 className="text-lg font-semibold">Heading 3 — Sora</h3>
          <p className="text-base">Body text — Inter regular.</p>
          <p className="text-sm text-muted-foreground">
            Small / muted — Inter.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="err">Password (error state)</Label>
            <Input id="err" type="password" aria-invalid defaultValue="bad" />
            <p className="text-xs text-destructive">Password is too short.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dis">Disabled</Label>
            <Input id="dis" disabled placeholder="Disabled" />
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <CardTitle>Simple card</CardTitle>
              <p className="text-sm text-muted-foreground">
                Surface + 1px border, rounded-2xl.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card with header & footer</CardTitle>
              <CardDescription>Composed from subcomponents.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm">Action</Button>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="category">Category</Badge>
          <Badge variant="featured">Featured</Badge>
          <Badge variant="success">In stock</Badge>
          <Badge variant="warning">Low stock</Badge>
          <Badge variant="destructive">Out of stock</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ORDER_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Product card">
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StaggerItem>
            <ProductCard
              name="Grilled Chicken Power Bowl"
              price={329}
              href="/products"
              image="https://placehold.co/400x300/161c1a/22c55e?text=Bowl"
              category="High-Protein"
              rating={4.8}
              reviewCount={124}
              stock={12}
              featured
            />
          </StaggerItem>
          <StaggerItem>
            <ProductCard
              name="Vegetarian Buddha Bowl"
              price={279}
              href="/products"
              image="https://placehold.co/400x300/161c1a/a3e635?text=Veg"
              category="Vegetarian"
              rating={4.6}
              reviewCount={88}
              stock={5}
            />
          </StaggerItem>
          <StaggerItem>
            <ProductCard
              name="Whey Protein Isolate 1kg"
              price={1899}
              href="/products"
              category="Supplements"
              rating={4.9}
              reviewCount={210}
              stock={0}
            />
          </StaggerItem>
          <StaggerItem>
            <ProductCard
              name="Protein Energy Bites"
              price={149}
              href="/products"
              image="https://placehold.co/400x300/161c1a/22c55e?text=Snack"
              category="Snacks"
            />
          </StaggerItem>
        </Stagger>
      </Section>

      <Section title="Skeletons">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
