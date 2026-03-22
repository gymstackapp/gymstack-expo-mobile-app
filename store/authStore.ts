// mobile/src/store/authStore.ts
// Central auth state using Zustand + Immer.
// Handles: login, logout, silent token refresh, persisting tokens in Keychain.

import * as SecureStore from "expo-secure-store";
// import * as Keychain from 'react-native-keychain'
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const KEYCHAIN_SERVICE = "gymstack_auth";

// ── Types ────────────────────────────────────────────────────────────────────

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
  accessExpiresAt: number; // Unix timestamp ms
}

interface AuthState {
  profile: AuthProfile | null;
  tokens: StoredTokens | null;
  isLoading: boolean;
  isHydrated: boolean; // true once we've checked Keychain on app start

  // Actions
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>; // returns true if refresh succeeded
  hydrate: () => Promise<void>; // call once on app start
  updateProfile: (partial: Partial<AuthProfile>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE_URL ?? "http://192.168.1.10:3000";

async function apiPost(path: string, body: object, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

async function saveTokensToKeychain(tokens: StoredTokens) {
  await SecureStore.setItemAsync(KEYCHAIN_SERVICE, JSON.stringify(tokens));
}
// async function saveTokensToKeychain(tokens: StoredTokens) {
//     await Keychain.setGenericPassword(
//         "tokens",
//         JSON.stringify(tokens),
//         { service: KEYCHAIN_SERVICE, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
//     )
// }

async function loadTokensFromKeychain(): Promise<StoredTokens | null> {
  try {
    const value = await SecureStore.getItemAsync(KEYCHAIN_SERVICE);
    if (!value) return null;
    return JSON.parse(value) as StoredTokens;
  } catch {
    return null;
  }
}

async function clearKeychain() {
  await SecureStore.deleteItemAsync(KEYCHAIN_SERVICE);
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    profile: null,
    tokens: null,
    isLoading: false,
    isHydrated: false,

    // ── Hydrate: called on app start to restore session ─────────────────────
    hydrate: async () => {
      const stored = await loadTokensFromKeychain();
      if (!stored) {
        set((s) => {
          s.isHydrated = true;
        });
        return;
      }

      // If access token is still valid (with 30s buffer), restore session
      const isValid = stored.accessExpiresAt - 30_000 > Date.now();
      if (isValid) {
        // Fetch fresh profile
        try {
          const res = await fetch(`${API_BASE}/api/profile/me`, {
            headers: { Authorization: `Bearer ${stored.accessToken}` },
          });
          if (res.ok) {
            const profile = await res.json();
            set((s) => {
              s.tokens = stored;
              s.profile = profile;
              s.isHydrated = true;
            });
            return;
          }
        } catch {}
      }

      // Put stored tokens into the store BEFORE calling refresh(),
      // otherwise refresh() reads get().tokens === null and immediately returns false.
      set((s) => {
        s.tokens = stored;
      });

      // Try refresh
      const refreshed = await get().refresh();
      if (!refreshed) {
        // Refresh failed — wipe tokens, user must log in again
        await clearKeychain();
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

        await saveTokensToKeychain(tokens);
        set((s) => {
          s.tokens = tokens;
          s.profile = data.profile;
          s.isLoading = false;
        });
        return {};
      } catch (err) {
        console.log("e", err);
        set((s) => {
          s.isLoading = false;
        });
        return { error: "Network error. Please check your connection." };
      }
    },

    // ── Logout ───────────────────────────────────────────────────────────────
    logout: async () => {
      const { tokens } = get();
      if (tokens?.refreshToken) {
        // Fire and forget — don't block UI
        apiPost("/api/auth/mobile-logout", {
          refreshToken: tokens.refreshToken,
        }).catch(() => {});
      }
      await clearKeychain();
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

        await saveTokensToKeychain(newTokens);

        // Also refresh profile
        const profileRes = await fetch(`${API_BASE}/api/profile/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          set((s) => {
            s.tokens = newTokens;
            s.profile = profile;
          });
        } else {
          set((s) => {
            s.tokens = newTokens;
          });
        }

        return true;
      } catch {
        return false;
      }
    },

    // ── Update profile locally (after edit) ──────────────────────────────────
    updateProfile: (partial) => {
      set((s) => {
        if (s.profile) Object.assign(s.profile, partial);
      });
    },
  })),
);
