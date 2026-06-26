import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api";
import { errorMessage, fieldErrors, homeForRole } from "@/lib/auth";

describe("fieldErrors", () => {
  it("extracts the first message per field from a 422 envelope", () => {
    const err = new ApiRequestError(422, "validation_error", "Invalid.", {
      email: ["The email has already been taken.", "second"],
      password: ["The password must be at least 8 characters."],
    });
    expect(fieldErrors(err)).toEqual({
      email: "The email has already been taken.",
      password: "The password must be at least 8 characters.",
    });
  });

  it("returns {} for non-validation errors", () => {
    const err = new ApiRequestError(401, "invalid_credentials", "Nope");
    expect(fieldErrors(err)).toEqual({});
    expect(fieldErrors(new Error("x"))).toEqual({});
    expect(fieldErrors(null)).toEqual({});
  });
});

describe("errorMessage", () => {
  it("returns the message for a non-validation API error", () => {
    const err = new ApiRequestError(401, "invalid_credentials", "Invalid credentials.");
    expect(errorMessage(err)).toBe("Invalid credentials.");
  });

  it("suppresses the banner for validation errors (shown inline instead)", () => {
    const err = new ApiRequestError(422, "validation_error", "Invalid.", {});
    expect(errorMessage(err)).toBeNull();
  });

  it("returns null for no error", () => {
    expect(errorMessage(null)).toBeNull();
  });
});

describe("homeForRole", () => {
  it("maps each role to its landing route", () => {
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("rider")).toBe("/rider");
    expect(homeForRole("customer")).toBe("/account");
  });
});
