import { ApiHealthBadge } from "@/components/api-health-badge";
import { MotionHero } from "@/components/motion-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16">
      <MotionHero>
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
          <Button>Shop now</Button>
          <Button variant="secondary">View plans</Button>
          <ApiHealthBadge />
        </div>
      </MotionHero>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Vegetarian Bowls", d: "Plant-based, chef-made." },
          { t: "High-Protein Boxes", d: "Hit your macros." },
          { t: "Subscriptions", d: "Auto-delivered weekly." },
        ].map((c) => (
          <Card key={c.t}>
            <CardContent>
              <CardTitle>{c.t}</CardTitle>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
