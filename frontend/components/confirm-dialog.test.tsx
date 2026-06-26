import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Sign out?"
        description="You'll need to sign in again."
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Sign out?")).toBeInTheDocument();
    expect(screen.getByText("You'll need to sign in again.")).toBeInTheDocument();
  });

  it("calls onConfirm when the action is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Update password?"
        confirmText="Update password"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("does not render content when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Hidden"
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
