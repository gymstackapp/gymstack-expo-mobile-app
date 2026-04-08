// mobile/src/api/config.ts
// Single source of truth for the backend API base URL.
// Imported by both client.ts and authStore.ts to avoid circular deps.
//
// Priority order:
//   1. EXPO_PUBLIC_API_URL  — set in .env for local dev
//   2. app.json extra.apiUrl — baked in at build time for APK
//   3. Fallback placeholder  — replace before building
//
// To set in development:
//   Create mobile/.env:  EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
//   (Use your local machine IP, not localhost — the device can't reach localhost)
//
// To set for production APK:
//   In mobile/app.json, set:  "extra": { "apiUrl": "https://your-backend.com" }
//   Then rebuild with: eas build --platform android --profile development

import Constants from "expo-constants";

export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as any)?.apiUrl ??
  "https://localhost:3000";
