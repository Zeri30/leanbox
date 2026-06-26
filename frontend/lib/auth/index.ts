"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiRequestError } from "@/lib/api";
import { setToken, useToken } from "@/lib/auth/token";
import type { AuthResult, User, UserRole } from "@/lib/types/api";

export const ME_QUERY_KEY = ["auth", "me"] as const;

/** The current user, fetched from /users/me when a token is present. */
export function useMe() {
  const token = useToken();
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => (await api.get<User>("/users/me")).data,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/** Convenience view of auth state for guards and conditional UI. */
export function useAuth() {
  const token = useToken();
  const { data, isLoading, isError } = useMe();
  return {
    user: data ?? null,
    isAuthenticated: !!token && !!data,
    // Only "loading" while we actually have a token to resolve.
    isLoading: !!token && isLoading,
    isError,
  };
}

export interface LoginVars {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: LoginVars) =>
      (await api.post<AuthResult>("/auth/login", vars)).data,
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
    },
  });
}

export interface RegisterVars {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: RegisterVars) =>
      (await api.post<AuthResult>("/auth/register", vars)).data,
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Best-effort token revocation; clear locally regardless of the result.
      try {
        await api.post("/auth/logout");
      } catch {
        // ignore — the local token is cleared below
      }
    },
    onSettled: () => {
      setToken(null);
      queryClient.clear();
    },
  });
}

export interface UpdateProfileVars {
  full_name?: string;
  email?: string;
  phone?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: UpdateProfileVars) =>
      (await api.patch<User>("/users/me", vars)).data,
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });
}

export interface UpdatePasswordVars {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (vars: UpdatePasswordVars) =>
      (await api.patch<{ message: string }>("/users/me/password", vars)).data,
  });
}

/** Default landing route after auth, by role. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "rider":
      return "/rider";
    default:
      return "/account";
  }
}

/** Extract per-field validation messages from a 422 envelope. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (
    error instanceof ApiRequestError &&
    error.code === "validation_error" &&
    error.details
  ) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(error.details)) {
      out[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    return out;
  }
  return {};
}

/** A human-readable top-level message for an error (non-validation). */
export function errorMessage(error: unknown): string | null {
  if (error == null) return null;
  if (error instanceof ApiRequestError) {
    // Field-level validation is surfaced inline; suppress the generic banner.
    if (error.code === "validation_error") return null;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
