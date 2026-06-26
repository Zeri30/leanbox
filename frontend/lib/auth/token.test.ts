import { beforeEach, describe, expect, it } from "vitest";

import { getToken, setToken } from "@/lib/auth/token";

describe("token store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setToken(null);
  });

  it("persists the token to localStorage and reads it back", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(window.localStorage.getItem("leanbox_token")).toBe("abc123");
  });

  it("clears the token from localStorage on logout", () => {
    setToken("abc123");
    setToken(null);
    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem("leanbox_token")).toBeNull();
  });
});
