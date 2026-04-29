// mobile/src/api/client.ts
// Typed API client. Automatically:
//   - Attaches Bearer token to every request
//   - Silently refreshes expired access tokens (15 min)
//   - Logs out on unrecoverable auth failures
//   - Handles both old { error: "string" } and new { success, error: { code, message } } shapes
//   - Intercepts 403 plan-gate codes and fires a global upgrade handler
//   - Intercepts 5xx and fires a global error notification

import { API_BASE } from "@/api/config";
import { useAuthStore } from "@/store/authStore";

export { API_BASE } from "@/api/config";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: object;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

// ── Plan-gate upgrade handler ─────────────────────────────────────────────────
// Registered once by App.tsx (or a provider) so the API layer can trigger UI
// without importing React navigation directly.

type PlanUpgradeHandler = (code: string, message: string) => void;
let _planUpgradeHandler: PlanUpgradeHandler | null = null;

export function registerPlanUpgradeHandler(handler: PlanUpgradeHandler) {
  _planUpgradeHandler = handler;
}

// ── Server-error handler ──────────────────────────────────────────────────────
type ServerErrorHandler = (message: string) => void;
let _serverErrorHandler: ServerErrorHandler | null = null;

export function registerServerErrorHandler(handler: ServerErrorHandler) {
  _serverErrorHandler = handler;
}

// Plan-gate error codes from API_CHANGES.md
const PLAN_GATE_CODES = new Set([
  "PLAN_LIMIT_REACHED",
  "PLAN_FEATURE_BLOCKED",
  "SUBSCRIPTION_EXPIRED",
]);

// ── Token management ──────────────────────────────────────────────────────────

async function getValidToken(): Promise<string | null> {
  const store = useAuthStore.getState();

  if (!store.tokens) return null;

  // If token expires within 30 seconds, refresh proactively
  if (store.tokens.accessExpiresAt - 30_000 < Date.now()) {
    const ok = await store.refresh();
    if (!ok) {
      await store.logout();
      return null;
    }
  }

  return useAuthStore.getState().tokens?.accessToken ?? null;
}

// ── Error extraction ──────────────────────────────────────────────────────────
// Handles both API shapes:
//   Legacy:  { error: "string message" }
//   New:     { success: false, error: { code: "CODE", message: "..." } }

interface ParsedApiError {
  message: string;
  code: string | undefined;
}

function parseErrorBody(data: any, httpStatus: number): ParsedApiError {
  // New shape: { success: false, error: { code, message } }
  if (data?.error && typeof data.error === "object" && data.error.message) {
    return {
      message: data.error.message,
      code: data.error.code,
    };
  }

  // Legacy shape: { error: "string" }
  if (data?.error && typeof data.error === "string") {
    return { message: data.error, code: undefined };
  }

  // Other legacy fallbacks
  if (data?.message && typeof data.message === "string") {
    return { message: data.message, code: undefined };
  }

  return { message: `Request failed (${httpStatus})`, code: undefined };
}

// ── Main request function ─────────────────────────────────────────────────────

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

  // 401 — token is invalid or expired
  // Only force logout if this is NOT an auth endpoint (set-role, register etc.)
  if (response.status === 401) {
    const isAuthRoute = path.includes("/api/auth/");
    if (!isAuthRoute) {
      await useAuthStore.getState().logout();
    }
    throw new ApiError(
      "Unauthorized. Please sign in again.",
      401,
      "UNAUTHORIZED",
    );
  }

  const data = await response.json().catch(() => ({}));

  // 403 — check for plan-gate codes and fire global handler
  if (response.status === 403) {
    const { message, code } = parseErrorBody(data, 403);
    if (code && PLAN_GATE_CODES.has(code)) {
      _planUpgradeHandler?.(code, message);
    }
    throw new ApiError(message, 403, code);
  }

  // 5xx — server error, fire global notification
  if (response.status >= 500) {
    const { code } = parseErrorBody(data, response.status);
    const userMessage = "Something went wrong on our end. Please try again.";
    _serverErrorHandler?.(userMessage);
    throw new ApiError(userMessage, response.status, code ?? "INTERNAL_ERROR");
  }

  if (!response.ok) {
    const { message, code } = parseErrorBody(data, response.status);
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

// ── ApiError ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code: string | undefined;
  upgradeRequired: boolean;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.upgradeRequired = code !== undefined && PLAN_GATE_CODES.has(code);
  }
}

// ── FormData upload (multipart/form-data) ─────────────────────────────────────
// Separate from apiRequest so we never force-set Content-Type — fetch must set
// it automatically with the correct multipart boundary for file uploads.

export async function apiRequestFormData<T = any>(
  path: string,
  formData: FormData,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  const token = await getValidToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    const isAuthRoute = path.includes("/api/auth/");
    if (!isAuthRoute) await useAuthStore.getState().logout();
    throw new ApiError(
      "Unauthorized. Please sign in again.",
      401,
      "UNAUTHORIZED",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 403) {
    const { message, code } = parseErrorBody(data, 403);
    if (code && PLAN_GATE_CODES.has(code)) _planUpgradeHandler?.(code, message);
    throw new ApiError(message, 403, code);
  }

  if (response.status >= 500) {
    const { code } = parseErrorBody(data, response.status);
    const userMessage = "Something went wrong on our end. Please try again.";
    _serverErrorHandler?.(userMessage);
    throw new ApiError(userMessage, response.status, code ?? "INTERNAL_ERROR");
  }

  if (!response.ok) {
    const { message, code } = parseErrorBody(data, response.status);
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

// ── Typed shorthand helpers ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) =>
    apiRequest<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: object) =>
    apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: object) =>
    apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: object) =>
    apiRequest<T>(path, { method: "DELETE", body }),
  postFormData: <T>(path: string, formData: FormData) =>
    apiRequestFormData<T>(path, formData),
};
