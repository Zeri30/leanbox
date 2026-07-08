import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Accessibility guards for the design system ([S6] Accessibility & performance).
 * Parses the real token values out of globals.css and asserts WCAG AA contrast on
 * the text/surface pairs the UI actually renders, plus the reduced-motion backstop.
 * A future token edit that dips a pair below AA — or removes the reduced-motion
 * block — fails CI instead of shipping silently.
 */

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "globals.css"),
  "utf8",
);

/** Pull every `--color-*: #hex;` declaration out of the @theme block. */
function readTokens(source: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const re = /--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  for (let m = re.exec(source); m !== null; m = re.exec(source)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

const T = readTokens(css);

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.x contrast ratio for two hex colors (1–21). */
function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;

/** Text-on-surface pairs the UI actually renders as normal-size copy. */
const normalTextPairs: Array<[text: string, surface: string]> = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["foreground", "elevated"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "surface"],
  ["muted-foreground", "card"],
  ["muted-foreground", "elevated"],
  // Dimmest tier — the token most at risk of regressing below AA.
  ["subtle", "background"],
  ["subtle", "surface"],
  ["subtle", "card"],
  ["subtle", "elevated"],
  // Primary used as link / accent text.
  ["primary", "background"],
  ["primary", "surface"],
  ["primary", "card"],
  // Button + badge foregrounds sitting on their own fill.
  ["primary-foreground", "primary"],
  ["accent-foreground", "accent"],
  // Error copy (field errors, order failures) on the base and card surfaces.
  ["destructive", "background"],
  ["destructive", "card"],
];

describe("design token contrast (WCAG AA)", () => {
  it("defines the expected color tokens", () => {
    for (const name of [
      "background",
      "surface",
      "elevated",
      "card",
      "foreground",
      "muted-foreground",
      "subtle",
      "primary",
      "primary-foreground",
      "accent",
      "accent-foreground",
      "destructive",
    ]) {
      expect(T[name], `--color-${name} missing from globals.css`).toMatch(
        /^#[0-9a-fA-F]{6}$/,
      );
    }
  });

  it.each(normalTextPairs)(
    "%s on %s meets AA for normal text (>= 4.5:1)",
    (text, surface) => {
      const ratio = contrast(T[text], T[surface]);
      expect(
        ratio,
        `${text} (${T[text]}) on ${surface} (${T[surface]}) = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    },
  );
});

describe("reduced motion", () => {
  it("ships a global prefers-reduced-motion backstop", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it("neutralizes animation and transition duration under reduced motion", () => {
    const block = css
      .slice(css.indexOf("prefers-reduced-motion"))
      .replace(/\s+/g, " ");
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });
});
