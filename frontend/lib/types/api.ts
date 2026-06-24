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
