import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanCard } from "@/components/plans/plan-card";
import type { SubscriptionPlan } from "@/lib/types/api";

const plan: SubscriptionPlan = {
  id: 7,
  name: "Veggie Starter",
  description: "Plant-based meals delivered weekly.",
  meal_type: "vegetarian",
  price: "1499.00",
  billing_interval: "weekly",
  meals_per_cycle: 5,
  is_active: true,
};

describe("PlanCard", () => {
  it("shows the plan name, price per interval, and meals per cycle", () => {
    render(<PlanCard plan={plan} />);
    expect(screen.getByText("Veggie Starter")).toBeInTheDocument();
    expect(screen.getByText(/₱1,499\.00/)).toBeInTheDocument();
    expect(screen.getByText(/5 meals per cycle/)).toBeInTheDocument();
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("links Subscribe to the plan's subscribe flow", () => {
    render(<PlanCard plan={plan} />);
    const link = screen.getByRole("link", { name: /subscribe/i });
    expect(link).toHaveAttribute("href", "/plans/7/subscribe");
  });
});
