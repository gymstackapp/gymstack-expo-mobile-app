// mobile/src/api/client.ts
// Typed API client. Automatically:
//   - Attaches Bearer token to every request
//   - Silently refreshes expired access tokens (15 min)
//   - Logs out on unrecoverable auth failures

import { useAuthStore } from "@/store/authStore";

export const API_BASE = process.env.API_BASE_URL ?? "http://192.168.1.10:3000";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: object;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

async function getValidToken(): Promise<string | null> {
  const store = useAuthStore.getState();

  if (!store.tokens) return null;

  // If token expires within 30 seconds, refresh proactively
  if (store.tokens.accessExpiresAt - 30_000 < Date.now()) {
    const ok = await store.refresh();
    if (!ok) {
      // Refresh token is dead — session is unrecoverable, force logout now.
      await useAuthStore.getState().logout();
      return null;
    }
  }

  return useAuthStore.getState().tokens?.accessToken ?? null;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, params, headers: extraHeaders = {} } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  // Get valid token
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  // 401 — the server uses this for both auth failures AND permission/subscription
  // gates. We no longer logout here; session expiry is handled in getValidToken()
  // where a failed refresh triggers logout before any request is made.
  if (response.status === 401) {
    throw new ApiError(
      data.error ?? data.message ?? "Session expired. Please log in again.",
      401,
      data.upgradeRequired,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data.error ?? data.message ?? `Request failed (${response.status})`,
      response.status,
      data.upgradeRequired,
    );
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  upgradeRequired: boolean;

  constructor(message: string, status: number, upgradeRequired?: boolean) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.upgradeRequired = upgradeRequired ?? false;
  }
}

// ── Typed shorthand helpers ───────────────────────────────────────────────────

export const api = {
  get: <T = any>(path: string, params?: RequestOptions["params"]) =>
    apiRequest<T>(path, { method: "GET", params }),
  post: <T = any>(path: string, body?: object) =>
    apiRequest<T>(path, { method: "POST", body }),
  patch: <T = any>(path: string, body?: object) =>
    apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T = any>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
