/** Shapes mirroring the backend's { data, meta, error } envelope (see backend App\Support\ApiResponse). */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  error: ApiError | null;
}

export type UserRole = "admin" | "customer" | "rider";
export type UserStatus = "active" | "suspended";

/** Mirrors backend App\Http\Resources\UserResource. */
export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  created_at: string | null;
}

/** Response body for POST /auth/login and /auth/register. */
export interface AuthResult {
  user: User;
  token: string;
}
