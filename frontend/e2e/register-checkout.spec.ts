import { expect, test } from "@playwright/test";

import { makeCustomer } from "./support/accounts";
import {
  addFirstProductToCart,
  fillNewAddress,
  register,
} from "./support/actions";

/**
 * Critical journey 1 — register → browse → cart → COD checkout → confirmation.
 * A brand-new customer with no saved address goes end to end.
 */
test("a new customer can register and place a COD order", async ({ page }) => {
  const customer = makeCustomer("checkout");

  await test.step("register", async () => {
    await register(page, customer);
  });

  await test.step("add a product to the cart", async () => {
    await addFirstProductToCart(page);
  });

  await test.step("checkout with a new address, Cash on Delivery", async () => {
    // Navigate the way a shopper does: cart → checkout.
    await page.getByRole("link", { name: /^Cart/ }).click();
    await page.waitForURL(/\/cart$/);
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
    await page.waitForURL(/\/checkout$/);

    // Fresh account → the new-address form is shown automatically.
    await fillNewAddress(page);

    // COD is the default (and only enabled) method.
    await expect(page.getByRole("radio", { name: /cash on delivery/i })).toBeChecked();

    await Promise.all([
      page.waitForURL(/\/checkout\/success\/\d+/, { timeout: 30_000 }),
      page.getByRole("button", { name: "Place order" }).click(),
    ]);
  });

  await test.step("see the order confirmation", async () => {
    await expect(
      page.getByRole("heading", { name: "Order placed!" }),
    ).toBeVisible();
    // Order number is rendered in the confirmation summary.
    await expect(page.getByText(/Order number/i)).toBeVisible();
  });
});
