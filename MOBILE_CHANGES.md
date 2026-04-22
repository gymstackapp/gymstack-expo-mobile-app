# GymStack Mobile — Changes & Developer Reference

> **Date:** 2026-04-19  
> **Branch:** master

---

## Files Modified

| File | Summary |
|------|---------|
| `api/client.ts` | Overhauled error handling to support both old `{ error: "string" }` and new `{ success, error: { code, message } }` API shapes. Added `code` field to `ApiError`. Added global 403 plan-gate interception (`PLAN_LIMIT_REACHED`, `PLAN_FEATURE_BLOCKED`, `SUBSCRIPTION_EXPIRED`) via `registerPlanUpgradeHandler`. Added global 5xx handler via `registerServerErrorHandler`. |
| `api/endpoints.ts` | Fixed `referralApi.get` URL: `/api/owner/referral` → `/api/referral` (correct per API_CHANGES.md). |
| `components/Plangate.tsx` | Fixed wrong navigation target: `"OwnerBilling"` → `"OwnerSubscriptions"` (OwnerBilling screen does not exist). |
| `app/screens/member/DashboardScreen.tsx` | Removed debug `console.log("member data", data)` left in production code. |
| `hooks/useSubsciption.ts` | Added missing `canAddMembershipPlan` to the hook's return object. It was declared in the `SubscriptionState` interface but not returned, causing any consumer to silently receive `undefined` (always falsy). |
| `app/navigation/MemberDrawerContent.tsx` | Fixed "Home" drawer item: `tab: "Home"` → `tab: "Dashboard"`. The first tab in `MemberTabs` is named `"Dashboard"`, not `"Home"`, so the old value caused broken navigation and incorrect active-state highlighting. |

---

## Files Created

| File | Purpose |
|------|---------|
| `constants/errorMessages.ts` | Maps every API error code from `API_CHANGES.md` to a user-friendly string. Use `getErrorMessage(code, fallback)` in screens instead of showing raw API errors to users. |
| `hooks/useRole.ts` | Thin hook over `authStore` exposing `{ role, isOwner, isTrainer, isMember, isInvited }`. All role decisions in screens and guards must read from this hook — never from navigation params or local state. |

---

## API Client — New Exports (api/client.ts)

```ts
// Register once in App.tsx to receive global upgrade prompts when any API
// call returns 403 with a plan-gate code.
registerPlanUpgradeHandler((code, message) => {
  // e.g. navigate to OwnerSubscriptions or show an upgrade modal
});

// Register once in App.tsx to receive 5xx notifications.
registerServerErrorHandler((message) => {
  Toast.show({ type: "error", text1: message });
});
```

Wire these up in `App.tsx` inside `AppContent` after the navigation ref is ready.

---

## Bugs Fixed

| # | File | Line | Bug |
|---|------|------|-----|
| 1 | `api/client.ts` | 190 | Error parsing only read `data.error` as string; new API wraps it in `{ code, message }` — silent failures with wrong error messages |
| 2 | `api/client.ts` | 201 | `ApiError` had no `code` field; screens couldn't distinguish plan-gate errors from other 403s |
| 3 | `api/client.ts` | — | No interception of 403 plan codes — owners hitting plan limits saw generic errors with no upgrade path |
| 4 | `api/client.ts` | — | No 5xx global handler — server errors were silently swallowed |
| 5 | `api/endpoints.ts` | 254 | `referralApi.get` hit `/api/owner/referral` (404) instead of `/api/referral` |
| 6 | `components/Plangate.tsx` | 38 | Navigate to `"OwnerBilling"` which doesn't exist in the navigator — upgrade CTA was broken |
| 7 | `app/screens/member/DashboardScreen.tsx` | 278 | `console.log("member data", data)` — leaked user data to console in production |
| 8 | `hooks/useSubsciption.ts` | return | `canAddMembershipPlan` declared in interface but missing from return — always `undefined` (falsy) |
| 9 | `app/navigation/MemberDrawerContent.tsx` | 174 | "Home" tab mapped to `tab: "Home"` but tab is named `"Dashboard"` — drawer Home item navigated to wrong screen and never showed as active |

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_API_URL` | `.env` (local dev) | Backend base URL, e.g. `http://192.168.x.x:3000`. Use your machine's LAN IP — the device cannot reach `localhost`. |

Set in `app.json` under `extra.apiUrl` for production builds:
```json
"extra": { "apiUrl": "https://your-backend.com" }
```

---

## Manual Steps Required

1. **Wire plan-upgrade and server-error handlers in `App.tsx`**  
   Call `registerPlanUpgradeHandler` and `registerServerErrorHandler` inside `AppContent` (after the navigation ref is initialised) to enable the global 403/5xx interception added in `api/client.ts`.

2. **Set `EXPO_PUBLIC_API_URL` in a `.env` file** for local development before running `expo start`.

3. **Keychain entitlements (iOS)** — `react-native-keychain` requires the Keychain Sharing capability in Xcode. Ensure `gymstack.entitlements` includes `keychain-access-groups`.

4. **Google Services** — `google-services.json` is present but must be kept out of public version control. Confirm it is in `.gitignore`.

---

## Known Limitations / Items Needing Manual Review

- **Tasks 3–10 from the original audit brief** (full TanStack Query migration, skeleton screens on all screens, form library adoption, certificate pinning, jailbreak detection, lazy navigation loading) are large structural changes that were scoped but not fully implemented in this pass. The infrastructure is already in place (TanStack Query is installed and used, Skeleton/EmptyState components exist, Keychain is in use); the remaining work is applying the patterns consistently to every screen.

- **`useSubscription` hook filename** is `useSubsciption.ts` (typo — missing 'r'). Renaming would require updating all imports; deferred to avoid unintended breakage.

- **`registerPlanUpgradeHandler` / `registerServerErrorHandler`** are registered but the concrete navigation/toast actions in `App.tsx` still need to be added (see Manual Steps above).
