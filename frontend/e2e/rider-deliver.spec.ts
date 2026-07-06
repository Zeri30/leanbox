import { expect, test } from "@playwright/test";

import { ADMIN, RIDER, makeCustomer } from "./support/accounts";
import { login, placeCodOrder, register } from "./support/actions";

/**
 * Critical journey 3 — rider assign → deliver.
 * A customer places an order; an admin confirms it (which creates a delivery)
 * and assigns the seeded rider; the rider starts and completes the delivery,
 * which advances the customer's order to "delivered".
 *
 * Three roles → three isolated browser contexts (auth lives in localStorage).
 */
test("an admin assigns a rider who then completes the delivery", async ({
  browser,
}) => {
  const customer = makeCustomer("deliver");

  // --- Customer: place a COD order -----------------------------------------
  const customerCtx = await browser.newContext();
  const customerPage = await customerCtx.newPage();
  await register(customerPage, customer);
  const order = await placeCodOrder(customerPage);
  expect(order.number).not.toEqual("");

  // --- Admin: confirm the order, then assign the rider ---------------------
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, ADMIN);

  await test.step("admin confirms the order (creates its delivery)", async () => {
    await adminPage.getByRole("link", { name: "Orders", exact: true }).first().click();
    await adminPage.waitForURL(/\/admin\/orders$/);
    await adminPage.locator(`a[href="/admin/orders/${order.id}"]`).click();
    await adminPage.waitForURL(new RegExp(`/admin/orders/${order.id}$`));
    await adminPage.getByRole("button", { name: "Confirm order" }).click();
    // Confirmed → the next action becomes "Mark as preparing".
    await expect(
      adminPage.getByRole("button", { name: "Mark as preparing" }),
    ).toBeVisible();
  });

  await test.step("admin assigns the rider to the delivery", async () => {
    await adminPage.getByRole("link", { name: "Deliveries", exact: true }).first().click();
    await adminPage.waitForURL(/\/admin\/deliveries$/);

    const row = adminPage
      .getByRole("row")
      .filter({ has: adminPage.getByText(order.number) });
    await row.getByRole("button", { name: "Manage" }).click();

    await adminPage.getByRole("combobox", { name: "Assign rider" }).click();
    await adminPage.getByRole("option", { name: "Ramon Rider" }).click();
    await adminPage.getByRole("button", { name: "Assign", exact: true }).click();

    // The row now shows the assigned rider.
    await expect(row).toContainText("Ramon Rider");
  });

  // --- Rider: start and complete the delivery ------------------------------
  const riderCtx = await browser.newContext();
  const riderPage = await riderCtx.newPage();
  await login(riderPage, RIDER);

  await test.step("rider starts and completes the delivery", async () => {
    // Open the assigned delivery from the rider's active list.
    await riderPage
      .getByRole("link")
      .filter({ hasText: order.number })
      .first()
      .click();
    await riderPage.waitForURL(/\/rider\/deliveries\/\d+$/);

    await riderPage.getByRole("button", { name: "Start delivery" }).click();
    const markDelivered = riderPage.getByRole("button", {
      name: "Mark delivered",
    });
    await expect(markDelivered).toBeVisible();
    await markDelivered.click();

    // Terminal state: the delivered card + badge replace the action buttons.
    await expect(
      riderPage.getByText("Mark delivered"),
    ).toHaveCount(0);
    await expect(riderPage.getByText("Delivered").first()).toBeVisible();
  });

  // --- Customer: the order now reads "delivered" ---------------------------
  await test.step("the customer's order is now delivered", async () => {
    await customerPage.getByRole("link", { name: "Account", exact: true }).click();
    await customerPage.waitForURL(/\/account$/);
    await customerPage.getByRole("link", { name: "Orders", exact: true }).first().click();
    await customerPage.waitForURL(/\/account\/orders$/);
    await customerPage
      .locator(`a[href="/account/orders/${order.id}"]`)
      .click();
    await customerPage.waitForURL(new RegExp(`/account/orders/${order.id}$`));
    await expect(customerPage.getByText(/delivered/i).first()).toBeVisible();
  });

  await customerCtx.close();
  await adminCtx.close();
  await riderCtx.close();
});
