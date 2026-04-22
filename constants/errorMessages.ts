// constants/errorMessages.ts
// Maps every API error code (from API_CHANGES.md) to a user-friendly string.
// Use this instead of showing raw error.code or error.message to the user.

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to perform this action.",

  // Plan gating
  PLAN_LIMIT_REACHED:
    "You've reached the limit on your current plan. Upgrade to continue.",
  PLAN_FEATURE_BLOCKED:
    "This feature is not available on your current plan. Please upgrade.",
  SUBSCRIPTION_EXPIRED:
    "Your subscription has expired. Please renew to continue.",

  // Validation & request
  VALIDATION_ERROR: "Please check your input and try again.",
  BAD_REQUEST: "The request was invalid. Please try again.",
  NOT_FOUND: "The requested item could not be found.",
  CONFLICT: "This item already exists.",
  RATE_LIMITED: "Too many requests. Please slow down and try again.",

  // Server
  INTERNAL_ERROR: "Something went wrong on our end. Please try again.",
};

export function getErrorMessage(
  code: string | undefined,
  fallback?: string,
): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return fallback ?? "An unexpected error occurred. Please try again.";
}
