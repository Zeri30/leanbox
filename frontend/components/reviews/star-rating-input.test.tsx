import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StarRatingInput } from "@/components/reviews/star-rating-input";

describe("StarRatingInput", () => {
  it("renders five star options", () => {
    render(<StarRatingInput value={0} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("marks the current value as checked", () => {
    render(<StarRatingInput value={3} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
  });

  it("calls onChange with the clicked star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);
    screen.getByRole("radio", { name: "4 stars" }).click();
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
