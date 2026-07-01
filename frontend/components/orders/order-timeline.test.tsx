import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderTimeline } from "@/components/orders/order-timeline";

describe("OrderTimeline", () => {
  it("renders every lifecycle step", () => {
    render(<OrderTimeline status="preparing" />);
    for (const label of [
      "Pending",
      "Confirmed",
      "Preparing",
      "Shipped",
      "Delivered",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the current status", () => {
    render(<OrderTimeline status="shipped" />);
    expect(screen.getByText("Current status")).toBeInTheDocument();
  });

  it("notes that Delivered is rider-driven when not the current step", () => {
    render(<OrderTimeline status="pending" />);
    expect(screen.getByText("Set by your rider")).toBeInTheDocument();
  });

  it("renders a terminal cancelled state instead of the step list", () => {
    render(<OrderTimeline status="cancelled" />);
    expect(screen.getByText("Order cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Current status")).not.toBeInTheDocument();
    expect(screen.queryByText("Preparing")).not.toBeInTheDocument();
  });
});
