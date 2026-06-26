"use client";

import { useSyncExternalStore } from "react";

import { setAuthToken } from "@/lib/api";

/**
 * Sanctum token store. Single source of truth for the bearer token, persisted to
 * localStorage and kept in sync with the API client (lib/api.ts). Reactive via
 * useSyncExternalStore so components re-render on login/logout — no extra deps.
 */

const STORAGE_KEY = "leanbox_token";
const listeners = new Set<() => void>();

let token: string | null = null;
let initialized = false;

function init(): void {
  if (initialized || typeof window === "undefined") return;
  token = window.localStorage.getItem(STORAGE_KEY);
  setAuthToken(token);
  initialized = true;
}

export function getToken(): string | null {
  init();
  return token;
}

export function setToken(next: string | null): void {
  token = next;
  setAuthToken(next);
  if (typeof window !== "undefined") {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Reactive token hook. Returns null on the server and before hydration. */
export function useToken(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      init();
      return token;
    },
    () => null,
  );
}
