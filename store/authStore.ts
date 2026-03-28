// // mobile/src/store/authStore.ts
// // Central auth state using Zustand + Immer.
// // Handles: login, logout, silent token refresh, persisting tokens in Keychain.

// import * as Keychain from "react-native-keychain";
// import { create } from "zustand";
// import { immer } from "zustand/middleware/immer";

// const KEYCHAIN_SERVICE = "gymstack_auth";

// // ── Types ────────────────────────────────────────────────────────────────────

// export interface AuthProfile {
//   id: string;
//   fullName: string;
//   email: string;
//   role: "owner" | "trainer" | "member" | null;
//   avatarUrl: string | null;
//   mobileNumber: string | null;
//   city: string | null;
//   gender: string | null;
//   wallet: { balance: number } | null;
//   referralCode: string | null;
// }

// interface StoredTokens {
//   accessToken: string;
//   refreshToken: string;
//   accessExpiresAt: number; // Unix timestamp ms
// }

// interface AuthState {
//   profile: AuthProfile | null;
//   tokens: StoredTokens | null;
//   isLoading: boolean;
//   isHydrated: boolean; // true once we've checked Keychain on app start

//   // Actions
//   login: (email: string, password: string) => Promise<{ error?: string }>;
//   logout: () => Promise<void>;
//   refresh: () => Promise<boolean>; // returns true if refresh succeeded
//   hydrate: () => Promise<void>; // call once on app start
//   updateProfile: (partial: Partial<AuthProfile>) => void;
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const API_BASE = process.env.API_BASE_URL ?? "http://192.168.1.10:3000";

// async function apiPost(path: string, body: object, token?: string) {
//   const headers: Record<string, string> = {
//     "Content-Type": "application/json",
//   };
//   if (token) headers["Authorization"] = `Bearer ${token}`;
//   const res = await fetch(`${API_BASE}${path}`, {
//     method: "POST",
//     headers,
//     body: JSON.stringify(body),
//   });
//   return res;
// }

// async function saveTokensToKeychain(tokens: StoredTokens) {
//   await Keychain.setGenericPassword("tokens", JSON.stringify(tokens), {
//     service: KEYCHAIN_SERVICE,
//     accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
//   });
// }

// async function loadTokensFromKeychain(): Promise<StoredTokens | null> {
//   try {
//     const creds = await Keychain.getGenericPassword({
//       service: KEYCHAIN_SERVICE,
//     });
//     if (!creds) return null;
//     return JSON.parse(creds.password) as StoredTokens;
//   } catch {
//     return null;
//   }
// }

// async function clearKeychain() {
//   await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
// }

// // ── Store ──────────────────────────────────────────────────────────────────────

// export const useAuthStore = create<AuthState>()(
//   immer((set, get) => ({
//     profile: null,
//     tokens: null,
//     isLoading: false,
//     isHydrated: false,

//     // ── Hydrate: called on app start to restore session ─────────────────────
//     hydrate: async () => {
//       const stored = await loadTokensFromKeychain();
//       if (!stored) {
//         set((s) => {
//           s.isHydrated = true;
//         });
//         return;
//       }

//       // If access token is still valid (with 30s buffer), restore session
//       const isValid = stored.accessExpiresAt - 30_000 > Date.now();
//       if (isValid) {
//         // Fetch fresh profile
//         try {
//           const res = await fetch(`${API_BASE}/api/profile/me`, {
//             headers: { Authorization: `Bearer ${stored.accessToken}` },
//           });
//           if (res.ok) {
//             const profile = await res.json();
//             set((s) => {
//               s.tokens = stored;
//               s.profile = profile;
//               s.isHydrated = true;
//             });
//             return;
//           }
//         } catch {}
//       }

//       // Try refresh
//       const refreshed = await get().refresh();
//       if (!refreshed) {
//         // Refresh failed — wipe tokens, user must log in again
//         await clearKeychain();
//         set((s) => {
//           s.tokens = null;
//           s.profile = null;
//           s.isHydrated = true;
//         });
//       } else {
//         set((s) => {
//           s.isHydrated = true;
//         });
//       }
//     },

//     // ── Login ────────────────────────────────────────────────────────────────
//     login: async (email, password) => {
//       set((s) => {
//         s.isLoading = true;
//       });
//       try {
//         const res = await apiPost("/api/auth/mobile-login", {
//           email,
//           password,
//         });
//         const data = await res.json();

//         if (!res.ok) {
//           set((s) => {
//             s.isLoading = false;
//           });
//           return { error: data.error ?? "Login failed" };
//         }

//         const tokens: StoredTokens = {
//           accessToken: data.accessToken,
//           refreshToken: data.refreshToken,
//           accessExpiresAt: Date.now() + data.expiresIn * 1000,
//         };

//         await saveTokensToKeychain(tokens);
//         set((s) => {
//           s.tokens = tokens;
//           s.profile = data.profile;
//           s.isLoading = false;
//         });
//         return {};
//       } catch (err) {
//         set((s) => {
//           s.isLoading = false;
//         });
//         return { error: "Network error. Please check your connection." };
//       }
//     },

//     // ── Logout ───────────────────────────────────────────────────────────────
//     logout: async () => {
//       const { tokens } = get();
//       if (tokens?.refreshToken) {
//         // Fire and forget — don't block UI
//         apiPost("/api/auth/mobile-logout", {
//           refreshToken: tokens.refreshToken,
//         }).catch(() => {});
//       }
//       // Unregister Expo push token so server stops sending to this device
//       try {
//         const Notifications = await import("expo-notifications");
//         const Constants = await import("expo-constants");
//         const projectId =
//           Constants.default.expoConfig?.extra?.eas?.projectId ??
//           Constants.default.easConfig?.projectId;
//         if (projectId) {
//           const { data: token } = await Notifications.getExpoPushTokenAsync({
//             projectId,
//           });
//           apiPost(
//             "/api/push/register-device",
//             { expoPushToken: token },
//             "DELETE",
//           ).catch(() => {});
//         }
//       } catch {
//         /* non-fatal */
//       }
//       await clearKeychain();
//       set((s) => {
//         s.tokens = null;
//         s.profile = null;
//       });
//     },

//     // ── Silent refresh ───────────────────────────────────────────────────────
//     refresh: async () => {
//       const { tokens } = get();
//       if (!tokens?.refreshToken) return false;

//       try {
//         const res = await apiPost("/api/auth/mobile-refresh", {
//           refreshToken: tokens.refreshToken,
//         });
//         if (!res.ok) return false;

//         const data = await res.json();
//         const newTokens: StoredTokens = {
//           accessToken: data.accessToken,
//           refreshToken: data.refreshToken,
//           accessExpiresAt: Date.now() + data.expiresIn * 1000,
//         };

//         await saveTokensToKeychain(newTokens);

//         // Also refresh profile
//         const profileRes = await fetch(`${API_BASE}/api/profile/me`, {
//           headers: { Authorization: `Bearer ${data.accessToken}` },
//         });
//         if (profileRes.ok) {
//           const profile = await profileRes.json();
//           set((s) => {
//             s.tokens = newTokens;
//             s.profile = profile;
//           });
//         } else {
//           set((s) => {
//             s.tokens = newTokens;
//           });
//         }

//         return true;
//       } catch {
//         return false;
//       }
//     },

//     // ── Update profile locally (after edit) ──────────────────────────────────
//     updateProfile: (partial) => {
//       set((s) => {
//         if (s.profile) Object.assign(s.profile, partial);
//       });
//     },
//   })),
// );
// mobile/src/store/authStore.ts
// Central auth state using Zustand + Immer.
// Handles: login, logout, silent token refresh, persisting tokens in Keychain.
//
// KEY BEHAVIOUR ON APP START (hydrate):
//   - Load tokens from Keychain synchronously-ish
//   - If token is still valid → restore profile from keychain cache immediately
//     → isHydrated = true → app opens without any network call blocking it
//   - Profile is then refreshed from the server silently in the background
//   - If token is expired → try refresh token
//   - If refresh fails → clear tokens → show login
//
// This means: app NEVER sends you to login due to a slow/failed network on startup.

import Constants from "expo-constants";
import * as Keychain from "react-native-keychain";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const KEYCHAIN_SERVICE = "gymstack_auth";
const KEYCHAIN_PROFILE_KEY = "gymstack_profile"; // separate entry for cached profile

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthProfile {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "trainer" | "member" | null;
  avatarUrl: string | null;
  mobileNumber: string | null;
  city: string | null;
  gender: string | null;
  wallet: { balance: number } | null;
  referralCode: string | null;
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number; // Unix ms
}

interface AuthState {
  profile: AuthProfile | null;
  tokens: StoredTokens | null;
  isLoading: boolean;
  isHydrated: boolean; // true once Keychain read is done — drives nav

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  updateProfile: (partial: Partial<AuthProfile>) => void;
}

// ── Config ────────────────────────────────────────────────────────────────────

// API base URL — read from app.json extra.apiUrl (set before building APK)
// In development: set EXPO_PUBLIC_API_URL in .env or update app.json
const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as any)?.apiUrl ??
  "https://yourapp.com";

// ── Keychain helpers ──────────────────────────────────────────────────────────

async function saveTokens(tokens: StoredTokens) {
  await Keychain.setGenericPassword("tokens", JSON.stringify(tokens), {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    if (!creds || !creds.password) return null;
    return JSON.parse(creds.password) as StoredTokens;
  } catch {
    return null;
  }
}

async function clearTokens() {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}

// Cache the profile in Keychain too so we can restore without a network call
async function saveProfile(profile: AuthProfile) {
  try {
    await Keychain.setGenericPassword("profile", JSON.stringify(profile), {
      service: KEYCHAIN_PROFILE_KEY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
  } catch {}
}

async function loadProfile(): Promise<AuthProfile | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_PROFILE_KEY,
    });
    if (!creds || !creds.password) return null;
    return JSON.parse(creds.password) as AuthProfile;
  } catch {
    return null;
  }
}

async function clearProfile() {
  try {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_PROFILE_KEY });
  } catch {}
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(
  path: string,
  body: object,
  method: "POST" | "DELETE" = "POST",
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

async function fetchProfile(accessToken: string): Promise<AuthProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/profile/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    profile: null,
    tokens: null,
    isLoading: false,
    isHydrated: false,

    // ── Hydrate ─────────────────────────────────────────────────────────────
    // Called once in RootNavigator on app mount.
    // Must complete FAST — never block on network here.
    hydrate: async () => {
      // 1. Load tokens from Keychain
      const stored = await loadTokens();

      if (!stored) {
        // No tokens ever saved → fresh install → show login
        set((s) => {
          s.isHydrated = true;
        });
        return;
      }

      const tokenStillValid = stored.accessExpiresAt - 60_000 > Date.now();

      if (tokenStillValid) {
        // 2a. Token is valid → restore from keychain cache immediately
        //     This makes app open instantly without waiting for network
        const cachedProfile = await loadProfile();
        set((s) => {
          s.tokens = stored;
          s.profile = cachedProfile; // may be null if first install with this version
          s.isHydrated = true;
        });

        // 3. Silently refresh profile from server in background
        //    If it fails (offline), the cached profile keeps the user logged in
        fetchProfile(stored.accessToken)
          .then((freshProfile) => {
            if (freshProfile) {
              set((s) => {
                s.profile = freshProfile;
              });
              saveProfile(freshProfile).catch(() => {});
            }
          })
          .catch(() => {});

        return;
      }

      // 2b. Token expired → try refresh before showing login
      const refreshed = await get().refresh();

      if (!refreshed) {
        // Refresh token also expired/invalid → must log in again
        await clearTokens();
        await clearProfile();
        set((s) => {
          s.tokens = null;
          s.profile = null;
          s.isHydrated = true;
        });
      } else {
        set((s) => {
          s.isHydrated = true;
        });
      }
    },

    // ── Login ────────────────────────────────────────────────────────────────
    login: async (email, password) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const res = await apiPost("/api/auth/mobile-login", {
          email,
          password,
        });
        const data = await res.json();

        if (!res.ok) {
          set((s) => {
            s.isLoading = false;
          });
          return { error: data.error ?? "Login failed" };
        }

        const tokens: StoredTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessExpiresAt: Date.now() + data.expiresIn * 1000,
        };

        await saveTokens(tokens);
        await saveProfile(data.profile); // cache profile so next startup is instant
        set((s) => {
          s.tokens = tokens;
          s.profile = data.profile;
          s.isLoading = false;
        });
        return {};
      } catch {
        set((s) => {
          s.isLoading = false;
        });
        return { error: "Network error. Please check your connection." };
      }
    },

    // ── Logout ───────────────────────────────────────────────────────────────
    logout: async () => {
      const { tokens } = get();

      // Revoke refresh token on server (fire-and-forget)
      if (tokens?.refreshToken) {
        apiPost("/api/auth/mobile-logout", {
          refreshToken: tokens.refreshToken,
        }).catch(() => {});
      }

      // Unregister Expo push token so server stops delivering to this device
      try {
        const Notifications = await import("expo-notifications");
        const Constants = await import("expo-constants");
        const projectId =
          Constants.default.expoConfig?.extra?.eas?.projectId ??
          Constants.default.easConfig?.projectId;
        if (projectId && tokens?.accessToken) {
          const { data: expoToken } = await Notifications.getExpoPushTokenAsync(
            { projectId },
          );
          apiPost(
            "/api/push/register-device",
            { expoPushToken: expoToken },
            "DELETE",
            tokens.accessToken,
          ).catch(() => {});
        }
      } catch {
        /* non-fatal */
      }

      await clearTokens();
      await clearProfile();
      set((s) => {
        s.tokens = null;
        s.profile = null;
      });
    },

    // ── Silent refresh ───────────────────────────────────────────────────────
    refresh: async () => {
      const { tokens } = get();
      if (!tokens?.refreshToken) return false;

      try {
        const res = await apiPost("/api/auth/mobile-refresh", {
          refreshToken: tokens.refreshToken,
        });
        if (!res.ok) return false;

        const data = await res.json();
        const newTokens: StoredTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessExpiresAt: Date.now() + data.expiresIn * 1000,
        };

        await saveTokens(newTokens);

        // Fetch fresh profile after refresh
        const profile = await fetchProfile(data.accessToken);
        if (profile) {
          await saveProfile(profile);
          set((s) => {
            s.tokens = newTokens;
            s.profile = profile;
          });
        } else {
          // Profile fetch failed but refresh worked — keep old profile
          set((s) => {
            s.tokens = newTokens;
          });
        }

        return true;
      } catch {
        return false;
      }
    },

    // ── Update profile locally ───────────────────────────────────────────────
    updateProfile: (partial) => {
      set((s) => {
        if (s.profile) {
          Object.assign(s.profile, partial);
          // Update keychain cache too
          saveProfile({ ...s.profile, ...partial }).catch(() => {});
        }
      });
    },
  })),
);
