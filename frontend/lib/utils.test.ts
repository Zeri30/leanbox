import { describe, expect, it } from "vitest";

import { cn, formatPHP } from "@/lib/utils";

describe("formatPHP", () => {
  it("formats numbers as Philippine Peso with two decimals", () => {
    expect(formatPHP(1250)).toBe("₱1,250.00");
    expect(formatPHP(0)).toBe("₱0.00");
  });

  it("accepts numeric strings from the API", () => {
    expect(formatPHP("329.5")).toBe("₱329.50");
  });

  it("falls back to zero for non-numeric input", () => {
    expect(formatPHP("abc")).toBe("₱0.00");
  });
});

describe("cn", () => {
  it("merges and de-duplicates conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});
