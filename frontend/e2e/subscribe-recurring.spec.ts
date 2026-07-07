import { expect, test } from "@playwright/test";

import { makeCustomer } from "./support/accounts";
import { runSubscriptionCycle } from "./support/backend";
import { fillNewAddress, register } from "./support/actions";

/**
 * Critical journey 2 — subscribe → recurring charge.
 * A customer subscribes to a meal plan (which records the first cycle), then the
 * billing scheduler runs a due cycle and a second charge appears in the history.
 */
test("subscribing then running a due cycle produces a recurring charge", async ({
  page,
}) => {
  const customer = makeCustomer("subscribe");

  await test.step("register", async () => {
    await register(page, customer);
  });

  let subscriptionId = 0;

  await test.step("subscribe to a plan", async () => {
    await page.goto("/plans");
    // First plan card → its subscribe page (client-side, keeps the session).
    await page.getByRole("link", { name: "Subscribe" }).first().click();
    await page.waitForURL(/\/plans\/\d+\/subscribe$/);

    // Fresh account → the new-address form is shown; weekly schedule is default.
    await fillNewAddress(page);
    await page
      .getByRole("button", { name: /Subscribe — pay on delivery/ })
      .click();

    await page.waitForURL(/\/account\/subscriptions\/\d+$/);
    subscriptionId = Number(page.url().split("/").pop());
    expect(subscriptionId).toBeGreaterThan(0);
  });

  const billingRows = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Billing history" }) })
    .locator("ul > li");

  await test.step("the first cycle is recorded on subscribe", async () => {
    await expect(billingRows).toHaveCount(1);
  });

  await test.step("run the due billing cycle", async () => {
    runSubscriptionCycle(subscriptionId);
  });

  await test.step("a second (recurring) charge appears after the cycle", async () => {
    // Reload to refetch past the 60s query cache and read the new charge.
    await page.reload();
    await page.waitForURL(new RegExp(`/account/subscriptions/${subscriptionId}$`));
    await expect(billingRows).toHaveCount(2);
  });

  await test.step("the customer is notified of the renewal", async () => {
    await page.getByRole("link", { name: /Notifications/ }).first().click();
    await page.waitForURL(/\/account\/notifications$/);
    await expect(page.getByText("Subscription renewed").first()).toBeVisible();
  });
});
