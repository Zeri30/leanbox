import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  ProductGrid,
  ProductGridEmpty,
} from "@/components/catalog/product-grid";
import type { Product } from "@/lib/types/api";

// ProductCard uses router + TanStack hooks for built-in quick-add.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/products",
}));

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    category_id: 2,
    name: "Tofu Power Bowl",
    slug: "tofu-power-bowl",
    description: null,
    price: "249.00",
    stock_quantity: 10,
    low_stock_threshold: 5,
    is_featured: false,
    is_best_selling: false,
    is_active: true,
    stock_status: "in_stock",
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("ProductGrid", () => {
  it("renders a card with name, price, and PDP link for each product", () => {
    renderWithClient(
      <ProductGrid
        products={[
          makeProduct({ id: 1, name: "Tofu Power Bowl", slug: "tofu-power-bowl" }),
          makeProduct({ id: 2, name: "Whey Protein", slug: "whey-protein" }),
        ]}
      />,
    );

    expect(screen.getByText("Tofu Power Bowl")).toBeInTheDocument();
    expect(screen.getByText("Whey Protein")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link").some(
        (a) => a.getAttribute("href") === "/products/tofu-power-bowl",
      ),
    ).toBe(true);
  });

  it("marks out-of-stock products and disables their add-to-cart", () => {
    renderWithClient(
      <ProductGrid products={[makeProduct({ stock_quantity: 0 })]} />,
    );
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeDisabled();
  });
});

describe("ProductGridEmpty", () => {
  it("shows an empty message and triggers reset", async () => {
    const onReset = vi.fn();
    render(<ProductGridEmpty onReset={onReset} />);

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
