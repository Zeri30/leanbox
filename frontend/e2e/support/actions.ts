import { expect, type Page } from "@playwright/test";

import type { NewCustomer } from "./accounts";

/**
 * Reusable UI actions shared across journeys. These drive the real app the way
 * a user would (labels, roles, button names) rather than test-only hooks, so
 * they double as coverage of the shared flows.
 */

/** Register a fresh account and wait for the post-signup redirect. */
export async function register(page: Page, c: NewCustomer): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(c.fullName);
  await page.getByLabel("Email").fill(c.email);
  await page.getByLabel("Phone", { exact: false }).fill(c.phone);
  await page.getByLabel("Password", { exact: true }).fill(c.password);
  await page.getByLabel("Confirm password").fill(c.password);
  await page.getByRole("button", { name: "Create account" }).click();
  // Customers land on "/"; failure would keep us on /register with a banner.
  await page.waitForURL((url) => !url.pathname.startsWith("/register"), {
    timeout: 20_000,
  });
}

/** Sign in with the given credentials and wait to leave the login page. */
export async function login(
  page: Page,
  creds: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20_000,
  });
}

/**
 * Add the first available product to the cart from the catalog grid, waiting
 * for the server to actually persist it (the button is optimistic).
 */
export async function addFirstProductToCart(page: Page): Promise<void> {
  await page.goto("/products");
  // Quick-add bounces guests to /login, and auth resolves via an async
  // /users/me fetch — wait for the authenticated nav before clicking.
  await expect(page.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  const addButton = page
    .getByRole("button", { name: "Add to cart" })
    .first();
  await expect(addButton).toBeEnabled();
  await Promise.all([
    page.waitForResponse(
      (r) =>
        /\/cart\/items|\/cart$/.test(new URL(r.url()).pathname) &&
        r.request().method() === "POST" &&
        r.ok(),
    ),
    addButton.click(),
  ]);
}

/**
 * Fill and submit the checkout address form (shown automatically when the
 * account has no saved address). Picks the first province/city option so the
 * flow doesn't depend on specific PSGC names.
 */
export async function fillNewAddress(page: Page): Promise<void> {
  await page.getByLabel("Recipient name").fill("E2E Recipient");
  await page.getByLabel("Phone").fill("+63 917 123 4567");
  await page.getByLabel("Address line 1").fill("123 Test Street, Barangay Uno");

  await page.getByRole("combobox", { name: "Province" }).click();
  await page.getByRole("option").first().click();

  const cityTrigger = page.getByRole("combobox", {
    name: "City or municipality",
  });
  await expect(cityTrigger).toBeEnabled();
  await cityTrigger.click();
  await page.getByRole("option").first().click();

  await page.getByRole("button", { name: "Save address" }).click();
  // Once saved, the form collapses and the address becomes selectable.
  await expect(page.getByRole("button", { name: "Save address" })).toHaveCount(
    0,
  );
}

/**
 * Full COD checkout for a freshly registered customer: add a product, go
 * cart → checkout, add an address, place the order. Returns the new order's id
 * and number (read off the confirmation page). Assumes the caller has already
 * registered and is authenticated.
 */
export async function placeCodOrder(
  page: Page,
): Promise<{ id: string; number: string }> {
  await addFirstProductToCart(page);
  await page.getByRole("link", { name: /^Cart/ }).click();
  await page.waitForURL(/\/cart$/);
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page.waitForURL(/\/checkout$/);
  await fillNewAddress(page);
  await Promise.all([
    page.waitForURL(/\/checkout\/success\/\d+/),
    page.getByRole("button", { name: "Place order" }).click(),
  ]);
  const id = page.url().split("/").pop() ?? "";
  const number = (
    await page.locator("p", { hasText: "Order number" }).locator("span").innerText()
  ).trim();
  return { id, number };
}
