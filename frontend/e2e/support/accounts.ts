/**
 * Known accounts + credential helpers.
 *
 * The demo seeder (`php artisan migrate:fresh --seed`) creates these fixed
 * accounts, all with the password "password". The E2E suite relies on them for
 * the admin/rider roles; customer journeys register fresh accounts instead so
 * reruns don't collide.
 */
export const SEED_PASSWORD = "password";

export const ADMIN = { email: "admin@leanbox.test", password: SEED_PASSWORD };
export const RIDER = { email: "rider@leanbox.test", password: SEED_PASSWORD };
export const CUSTOMER = { email: "customer@leanbox.test", password: SEED_PASSWORD };

/** A unique email per run so registering never clashes with prior test data. */
export function uniqueEmail(prefix = "e2e"): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}+${stamp}${rand}@leanbox.test`;
}

export interface NewCustomer {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export function makeCustomer(prefix = "e2e"): NewCustomer {
  return {
    fullName: "E2E Customer",
    email: uniqueEmail(prefix),
    phone: "+63 900 000 0000",
    password: "password123",
  };
}
