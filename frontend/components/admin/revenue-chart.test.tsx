import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevenueChart } from "@/components/admin/revenue-chart";
import type { RevenuePoint } from "@/lib/types/api";

describe("RevenueChart", () => {
  it("shows an empty state when there is no data", () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByText(/no revenue data yet/i)).toBeInTheDocument();
  });

  it("renders the axis dates and a peak label for a series", () => {
    const data: RevenuePoint[] = [
      { date: "2026-06-01", revenue: "0.00" },
      { date: "2026-06-02", revenue: "150.00" },
      { date: "2026-06-03", revenue: "300.00" },
    ];
    render(<RevenueChart data={data} />);

    // First and last dates anchor the x-axis.
    expect(screen.getByText("2026-06-01")).toBeInTheDocument();
    expect(screen.getByText("2026-06-03")).toBeInTheDocument();
    // Peak reflects the max value, formatted as PHP.
    expect(screen.getByText(/Peak.*₱300\.00/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /daily revenue/i }),
    ).toBeInTheDocument();
  });
});
