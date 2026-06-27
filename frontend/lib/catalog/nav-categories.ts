/**
 * The five storefront categories for static nav/footer links. Slugs must match
 * the backend seeder (DatabaseSeeder). The catalog filter still reads the live
 * category list from the API — this is just for fixed chrome links.
 */
export const NAV_CATEGORIES = [
  { label: "Vegetarian", slug: "vegetarian-meals" },
  { label: "High-Protein", slug: "high-protein-meals" },
  { label: "Supplements", slug: "supplements" },
  { label: "Snacks", slug: "healthy-snacks" },
  { label: "Wellness", slug: "wellness" },
] as const;
