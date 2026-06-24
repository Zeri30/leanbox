import type { ApiEnvelope } from "@/lib/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Thrown when the API returns a non-2xx status or an error envelope. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// Sanctum bearer token resolver. Override via setAuthToken (e.g. from a store);
// falls back to localStorage on the client.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function resolveToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("leanbox_token");
  }
  return null;
}

export interface ApiResult<T> {
  data: T;
  meta: Record<string, unknown> | null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = resolveToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // empty or non-JSON response
  }

  if (!res.ok || body?.error) {
    const err = body?.error;
    throw new ApiRequestError(
      res.status,
      err?.code ?? "http_error",
      err?.message ?? res.statusText,
      err?.details ?? null,
    );
  }

  return { data: (body as ApiEnvelope<T>).data, meta: body?.meta ?? null };
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, payload?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: payload != null ? JSON.stringify(payload) : undefined,
    }),
  patch: <T>(path: string, payload?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: payload != null ? JSON.stringify(payload) : undefined,
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};
