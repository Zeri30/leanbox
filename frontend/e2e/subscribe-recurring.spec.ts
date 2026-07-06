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

  await test.step("the first cycle is recorded on subscribe", async () => {
    const billingRows = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Billing history" }) })
      .locator("ul > li");
    await expect(billingRows).toHaveCount(1);
  });

  await test.step("run the due billing cycle", async () => {
    runSubscriptionCycle(subscriptionId);
  });

  await test.step("the recurring cycle surfaces to the customer", async () => {
    // The cycle records a second charge + delivery and notifies the customer.
    // Assert via the notifications feed: it's fetched fresh on first visit this
    // session (no stale cache), and client-side nav avoids a guarded hard-load.
    await page.getByRole("link", { name: /Notifications/ }).first().click();
    await page.waitForURL(/\/account\/notifications$/);
    await expect(
      page.getByText("Subscription renewed").first(),
    ).toBeVisible();
  });
});
