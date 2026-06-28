import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  QuantityStepper,
  clampQuantity,
} from "@/components/pdp/quantity-stepper";

describe("clampQuantity", () => {
  it("clamps into [min, max] and rounds", () => {
    expect(clampQuantity(0, 1, 10)).toBe(1);
    expect(clampQuantity(15, 1, 10)).toBe(10);
    expect(clampQuantity(5, 1, 10)).toBe(5);
    expect(clampQuantity(2.6, 1, 10)).toBe(3);
  });

  it("falls back to min for NaN", () => {
    expect(clampQuantity(Number.NaN, 2, 10)).toBe(2);
  });
});

describe("QuantityStepper", () => {
  it("increments and decrements via onChange", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} max={5} />);

    await userEvent.click(screen.getByRole("button", { name: /increase/i }));
    expect(onChange).toHaveBeenLastCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: /decrease/i }));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("disables decrease at min and increase at max", () => {
    const { rerender } = render(
      <QuantityStepper value={1} onChange={() => {}} max={3} />,
    );
    expect(screen.getByRole("button", { name: /decrease/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /increase/i })).toBeEnabled();

    rerender(<QuantityStepper value={3} onChange={() => {}} max={3} />);
    expect(screen.getByRole("button", { name: /increase/i })).toBeDisabled();
  });
});
