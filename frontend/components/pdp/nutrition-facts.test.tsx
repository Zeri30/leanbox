import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NutritionFacts } from "@/components/pdp/nutrition-facts";
import type { NutritionFact } from "@/lib/types/api";

function makeNutrition(overrides: Partial<NutritionFact> = {}): NutritionFact {
  return {
    serving_size: "1 bowl (300g)",
    calories: 420,
    protein_g: "32.00",
    carbs_g: "40.00",
    fat_g: "12.00",
    fiber_g: null,
    sugar_g: null,
    sodium_mg: "480.00",
    ingredients: "Tofu, brown rice, vegetables.",
    ...overrides,
  };
}

describe("NutritionFacts", () => {
  it("renders serving size and present rows with units", () => {
    render(<NutritionFacts nutrition={makeNutrition()} />);
    expect(screen.getByText("1 bowl (300g)")).toBeInTheDocument();
    expect(screen.getByText("420 kcal")).toBeInTheDocument();
    expect(screen.getByText("32.00 g")).toBeInTheDocument();
    expect(screen.getByText("480.00 mg")).toBeInTheDocument();
  });

  it("omits rows whose value is null", () => {
    render(<NutritionFacts nutrition={makeNutrition()} />);
    expect(screen.queryByText("Fiber")).not.toBeInTheDocument();
    expect(screen.queryByText("Sugar")).not.toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });

  it("renders nothing when there are no facts", () => {
    const empty: NutritionFact = {
      serving_size: null,
      calories: null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      fiber_g: null,
      sugar_g: null,
      sodium_mg: null,
      ingredients: null,
    };
    const { container } = render(<NutritionFacts nutrition={empty} />);
    expect(container).toBeEmptyDOMElement();
  });
});
