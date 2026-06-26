"use client";

import { useEffect } from "react";

/**
 * Warn before the tab is closed/reloaded while `enabled` is true (e.g. a form
 * has unsaved changes). Browser-level guard; in-app navigation is handled with
 * an explicit Cancel/discard confirmation.
 */
export function useBeforeUnload(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}
