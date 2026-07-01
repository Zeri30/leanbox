import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScheduleStep } from "@/components/plans/schedule-step";

describe("ScheduleStep", () => {
  it("renders all three delivery cadences with the current one selected", () => {
    render(<ScheduleStep value="weekly" onChange={() => {}} />);
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Every 2 weeks")).toBeInTheDocument();

    const weekly = screen.getByRole("radio", { name: /weekly/i });
    expect(weekly).toBeChecked();
  });

  it("calls onChange with the picked schedule", () => {
    const onChange = vi.fn();
    render(<ScheduleStep value="weekly" onChange={onChange} />);
    screen.getByRole("radio", { name: /every 2 weeks/i }).click();
    expect(onChange).toHaveBeenCalledWith("biweekly");
  });
});
