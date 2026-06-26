import Link from "next/link";

import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  { t: "Vegetarian Bowls", d: "Plant-based, chef-made." },
  { t: "High-Protein Boxes", d: "Hit your macros." },
  { t: "Subscriptions", d: "Auto-delivered weekly." },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 sm:py-16">
      <FadeUp>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Leanbox
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Eat lean. Live strong.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Healthy meals, high-protein packages, supplements, and meal-prep
          subscriptions — delivered across the Philippines.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/products">Shop now</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/products?category=subscriptions">View plans</Link>
          </Button>
        </div>
      </FadeUp>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <StaggerItem key={c.t}>
            <Card className="h-full">
              <CardContent>
                <CardTitle>{c.t}</CardTitle>
                <p className="text-sm text-muted-foreground">{c.d}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </main>
  );
}
