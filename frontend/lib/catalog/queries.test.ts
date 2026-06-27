import { describe, expect, it } from "vitest";

import {
  parseProductsParams,
  primaryImage,
  productsQueryString,
  productToCardProps,
} from "@/lib/catalog/queries";
import type { Product } from "@/lib/types/api";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    category_id: 2,
    name: "Tofu Power Bowl",
    slug: "tofu-power-bowl",
    description: "Plant-based protein bowl.",
    price: "249.00",
    stock_quantity: 10,
    low_stock_threshold: 5,
    is_featured: true,
    is_best_selling: false,
    is_active: true,
    stock_status: "in_stock",
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("productsQueryString", () => {
  it("returns an empty string for default/empty params", () => {
    expect(productsQueryString({})).toBe("");
    expect(productsQueryString({ sort: "featured", page: 1 })).toBe("");
  });

  it("omits blank/whitespace search and trims it", () => {
    expect(productsQueryString({ search: "   " })).toBe("");
    expect(productsQueryString({ search: "  kale " })).toBe("?search=kale");
  });

  it("serializes category, sort, page, and flags", () => {
    expect(
      productsQueryString({
        category: "supplements",
        sort: "price_low",
        page: 3,
      }),
    ).toBe("?category=supplements&sort=price_low&page=3");
    expect(productsQueryString({ featured: true })).toBe("?featured=1");
    expect(productsQueryString({ bestSelling: true })).toBe("?best_selling=1");
  });
});

describe("parseProductsParams", () => {
  it("parses valid params from the URL", () => {
    expect(
      parseProductsParams({
        search: " kale ",
        category: "snacks",
        sort: "newest",
        page: "2",
      }),
    ).toEqual({
      search: "kale",
      category: "snacks",
      sort: "newest",
      page: 2,
    });
  });

  it("drops invalid sort and non-positive/first pages", () => {
    expect(parseProductsParams({ sort: "bogus", page: "1" })).toEqual({
      search: undefined,
      category: undefined,
      sort: undefined,
      page: undefined,
    });
    expect(parseProductsParams({ page: "0" }).page).toBeUndefined();
    expect(parseProductsParams({ page: "-5" }).page).toBeUndefined();
  });

  it("takes the first value when a param repeats", () => {
    expect(parseProductsParams({ category: ["a", "b"] }).category).toBe("a");
  });

  it("round-trips through productsQueryString", () => {
    const params = { search: "bar", category: "wellness", sort: "name" as const, page: 4 };
    expect(parseProductsParams({ search: "bar", category: "wellness", sort: "name", page: "4" })).toEqual(params);
  });
});

describe("primaryImage", () => {
  it("prefers the image flagged primary", () => {
    const product = makeProduct({
      images: [
        { id: 1, product_id: 1, url: "a.jpg", alt_text: null, is_primary: false, sort_order: 1 },
        { id: 2, product_id: 1, url: "b.jpg", alt_text: null, is_primary: true, sort_order: 0 },
      ],
    });
    expect(primaryImage(product)).toBe("b.jpg");
  });

  it("falls back to the first image, then null", () => {
    const withImages = makeProduct({
      images: [
        { id: 1, product_id: 1, url: "a.jpg", alt_text: null, is_primary: false, sort_order: 0 },
      ],
    });
    expect(primaryImage(withImages)).toBe("a.jpg");
    expect(primaryImage(makeProduct({ images: [] }))).toBeNull();
    expect(primaryImage(makeProduct())).toBeNull();
  });
});

describe("productToCardProps", () => {
  it("maps a product onto card props", () => {
    const product = makeProduct({
      category: {
        id: 2,
        name: "Vegetarian Meals",
        slug: "vegetarian-meals",
        description: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
      reviews_summary: { count: 12, average: 4.5 },
    });
    expect(productToCardProps(product)).toMatchObject({
      name: "Tofu Power Bowl",
      price: "249.00",
      href: "/products/tofu-power-bowl",
      category: "Vegetarian Meals",
      rating: 4.5,
      reviewCount: 12,
      stock: 10,
      featured: true,
    });
  });

  it("handles a product with no category or reviews", () => {
    expect(productToCardProps(makeProduct())).toMatchObject({
      category: undefined,
      rating: null,
      reviewCount: undefined,
    });
  });
});
