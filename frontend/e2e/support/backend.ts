import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Thin bridge to the Laravel backend for the few things a journey can't drive
 * through the browser — namely running the recurring-billing scheduler.
 *
 * Runs `php artisan` in the backend directory (same `.env`, so the same
 * database the web app reads). Assumes `php` is on PATH, which holds both
 * locally and in CI (shivammathur/setup-php).
 */
const BACKEND_DIR =
  process.env.E2E_BACKEND_DIR ?? path.resolve(process.cwd(), "..", "backend");

function artisan(args: string[], extraEnv: Record<string, string> = {}): string {
  return execFileSync("php", ["artisan", ...args], {
    cwd: BACKEND_DIR,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

/**
 * Force one recurring cycle for a subscription: mark it due today, then run the
 * scheduler command that queues (and, on the sync connection, immediately runs)
 * the billing/delivery cycle. Mirrors what the daily scheduler does in prod.
 */
export function runSubscriptionCycle(subscriptionId: number): void {
  // Backdate the due date to yesterday so the cycle's billing_date doesn't
  // collide with the first (subscribe-time) payment dated today — the service
  // skips a cycle already billed for that date.
  artisan([
    "tinker",
    "--execute",
    `App\\Models\\Subscription::whereKey(${subscriptionId})->update(['next_delivery_date' => now()->subDay()->toDateString()]);`,
  ]);
  // sync queue → the dispatched ProcessSubscriptionCycle job runs inline now.
  artisan(["subscriptions:process-due"], { QUEUE_CONNECTION: "sync" });
}
