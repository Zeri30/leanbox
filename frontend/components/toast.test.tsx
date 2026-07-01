import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "@/components/toast";

function Trigger({ message }: { message: string }) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast(message)}>
      fire
    </button>
  );
}

describe("toast", () => {
  it("shows a toast message when triggered", () => {
    render(
      <ToastProvider>
        <Trigger message="Review submitted. Thanks!" />
      </ToastProvider>,
    );

    expect(screen.queryByText("Review submitted. Thanks!")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "fire" }));
    expect(screen.getByText("Review submitted. Thanks!")).toBeInTheDocument();
  });

  it("throws if useToast is used outside the provider", () => {
    function Orphan() {
      useToast();
      return null;
    }
    // Suppress React's error boundary console noise for this expected throw.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
