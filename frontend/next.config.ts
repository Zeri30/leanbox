import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile above this dir otherwise misleads Turbopack).
  turbopack: { root },
  images: {
    remotePatterns: [
      // Supabase Storage (bucket: leanbox-images) — public object URLs.
      // Uploaded assets are served from `<ref>.storage.supabase.co`, so we need
      // `**` (matches any leading subdomains); a single `*` only matches one.
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Curated product photos used by the demo seeder.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Placeholder images (legacy seed data).
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
