import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PaymentStep } from "@/components/checkout/payment-step";

describe("PaymentStep", () => {
  it("offers COD as the only enabled method", () => {
    render(<PaymentStep value="cod" onChange={() => {}} />);

    const cod = screen.getByRole("radio", { name: /cash on delivery/i });
    expect(cod).toBeEnabled();
    expect(cod).toBeChecked();

    expect(screen.getByRole("radio", { name: /gcash/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /card/i })).toBeDisabled();
  });

  it("does not change to a disabled method when clicked", async () => {
    const onChange = vi.fn();
    render(<PaymentStep value="cod" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /gcash/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
