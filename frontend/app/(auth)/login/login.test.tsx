import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
}));

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

beforeEach(() => {
  replace.mockReset();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("shows a banner with the API message on invalid credentials", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(401, {
        data: null,
        meta: null,
        error: { code: "invalid_credentials", message: "Invalid credentials." },
      }),
    );

    renderWithClient(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders inline field errors from a 422 validation envelope", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(422, {
        data: null,
        meta: null,
        error: {
          code: "validation_error",
          message: "The given data was invalid.",
          details: { email: ["The email field is required."] },
        },
      }),
    );

    renderWithClient(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("The email field is required."),
    ).toBeInTheDocument();
  });

  it("redirects on successful login", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        data: {
          user: {
            id: 1,
            full_name: "Test User",
            email: "a@b.com",
            role: "customer",
            status: "active",
            phone: null,
            created_at: null,
          },
          token: "tok_123",
        },
        meta: null,
        error: null,
      }),
    );

    renderWithClient(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/account"));
  });

  const successBody = {
    data: {
      user: {
        id: 1,
        full_name: "Test User",
        email: "a@b.com",
        role: "customer",
        status: "active",
        phone: null,
        created_at: null,
      },
      token: "tok_123",
    },
    meta: null,
    error: null,
  };

  it("moves focus to the next field on Enter instead of submitting", async () => {
    vi.stubGlobal("fetch", mockFetch(200, successBody));
    renderWithClient(<LoginPage />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Email"));
    await user.keyboard("a@b.com{Enter}");

    expect(screen.getByLabelText("Password")).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();
  });

  it("submits when Enter is pressed on the last field", async () => {
    vi.stubGlobal("fetch", mockFetch(200, successBody));
    renderWithClient(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.click(screen.getByLabelText("Password"));
    await user.keyboard("secret123{Enter}");

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/account"));
  });
});
