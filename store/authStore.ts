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

import { API_BASE } from "@/api/config";
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
  status: "ACTIVE" | "INVITED";
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
  isHydrated: boolean;        // true once Keychain read is done — drives nav
  isAuthenticating: boolean;  // true while login() is in progress — prevents nav flash
  invitedProfile: boolean;    // true when logged-in profile has status=INVITED
  hasActivePlan: boolean;     // for owners: whether they have an active SaaS subscription
  hasFetchedPlan: boolean;    // true once subscription check has completed for owner

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  updateProfile: (partial: Partial<AuthProfile>) => void;
  setHasActivePlan: (val: boolean) => void;
  // Atomic login + role-set in one operation.
  loginAndSetRole: (
    email: string,
    password: string,
    role: "owner" | "trainer" | "member",
  ) => Promise<{ error?: string }>;
}

// ── Keychain helpers ──────────────────────────────────────────────────────────

async function saveTokens(tokens: StoredTokens) {
  await Keychain.setGenericPassword("tokens", JSON.stringify(tokens), {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (!creds || !creds.password) return null;
    return JSON.parse(creds.password) as StoredTokens;
  } catch {
    return null;
  }
}

async function clearTokens() {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}

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
    const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_PROFILE_KEY });
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
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

// Fetch whether the owner has an active SaaS subscription.
// Returns true by default on error so we never block an owner incorrectly.
async function fetchOwnerHasActivePlan(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/owner/subscription`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return true; // treat network error as "active" to avoid blocking
    const data = await res.json();
    return data?.isActive === true;
  } catch {
    return true;
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    profile: null,
    tokens: null,
    isLoading: false,
    isHydrated: false,
    isAuthenticating: false,
    invitedProfile: false,
    hasActivePlan: true,     // default true prevents false "no plan" flashes
    hasFetchedPlan: false,

    // ── Hydrate ─────────────────────────────────────────────────────────────
    hydrate: async () => {
      const stored = await loadTokens();

      if (!stored) {
        set((s) => { s.isHydrated = true; });
        return;
      }

      const tokenStillValid = stored.accessExpiresAt - 60_000 > Date.now();

      if (tokenStillValid) {
        const cachedProfile = await loadProfile();
        const isInvited = cachedProfile?.status === "INVITED";

        set((s) => {
          s.tokens = stored;
          s.profile = cachedProfile;
          s.invitedProfile = isInvited;
          s.isHydrated = true;
        });

        // Silently refresh profile in background
        fetchProfile(stored.accessToken)
          .then(async (freshProfile) => {
            if (freshProfile) {
              set((s) => {
                s.profile = freshProfile;
                s.invitedProfile = freshProfile.status === "INVITED";
              });
              saveProfile(freshProfile).catch(() => {});

              // For owners: check subscription in background
              if (freshProfile.role === "owner" && freshProfile.status !== "INVITED") {
                const active = await fetchOwnerHasActivePlan(stored.accessToken);
                set((s) => {
                  s.hasActivePlan = active;
                  s.hasFetchedPlan = true;
                });
              } else {
                set((s) => { s.hasFetchedPlan = true; });
              }
            }
          })
          .catch(() => {});

        return;
      }

      // Token expired — try refresh
      const refreshed = await get().refresh();

      if (!refreshed) {
        await clearTokens();
        await clearProfile();
        set((s) => {
          s.tokens = null;
          s.profile = null;
          s.invitedProfile = false;
          s.isHydrated = true;
        });
      } else {
        set((s) => { s.isHydrated = true; });
      }
    },

    // ── Login ────────────────────────────────────────────────────────────────
    login: async (email, password) => {
      set((s) => {
        s.isLoading = true;
        s.isAuthenticating = true;
      });
      try {
        const res = await apiPost("/api/auth/mobile-login", { email, password });
        const data = await res.json();

        if (!res.ok) {
          set((s) => { s.isLoading = false; });
          return { error: data.error ?? "Login failed" };
        }

        const tokens: StoredTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessExpiresAt: Date.now() + data.expiresIn * 1000,
        };

        const isInvited = data.profile?.status === "INVITED";

        await saveTokens(tokens);
        await saveProfile(data.profile);
        set((s) => {
          s.tokens = tokens;
          s.profile = data.profile;
          s.invitedProfile = isInvited;
          s.isLoading = false;
          s.isAuthenticating = false;
        });

        // For owners (non-invited): check subscription in background
        if (data.profile?.role === "owner" && !isInvited) {
          fetchOwnerHasActivePlan(tokens.accessToken).then((active) => {
            set((s) => {
              s.hasActivePlan = active;
              s.hasFetchedPlan = true;
            });
          });
        } else {
          set((s) => { s.hasFetchedPlan = true; });
        }

        return {};
      } catch {
        set((s) => {
          s.isLoading = false;
          s.isAuthenticating = false;
        });
        return { error: "Network error. Please check your connection." };
      }
    },

    // ── Login + set role (atomic) ────────────────────────────────────────────
    loginAndSetRole: async (email, password, role) => {
      set((s) => {
        s.isLoading = true;
        s.isAuthenticating = true;
      });
      try {
        // Step 1: Login
        const loginRes = await apiPost("/api/auth/mobile-login", { email, password });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          set((s) => { s.isLoading = false; s.isAuthenticating = false; });
          return { error: loginData.error ?? "Login failed" };
        }

        const tokens: StoredTokens = {
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
          accessExpiresAt: Date.now() + loginData.expiresIn * 1000,
        };
        await saveTokens(tokens);

        // Step 2: Set role
        const roleRes = await fetch(`${API_BASE}/api/profile/set-role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ role }),
        });
        if (!roleRes.ok) {
          const roleData = await roleRes.json().catch(() => ({}));
          const fallbackProfile = await fetchProfile(tokens.accessToken);
          if (fallbackProfile) await saveProfile(fallbackProfile);
          set((s) => {
            s.tokens = tokens;
            s.profile = fallbackProfile;
            s.invitedProfile = fallbackProfile?.status === "INVITED";
            s.isLoading = false;
            s.isAuthenticating = false;
            s.hasFetchedPlan = true;
          });
          return { error: (roleData as any).error ?? "Failed to set role. Please pick your role manually." };
        }

        // Step 3: Fetch fresh profile
        const freshProfile = await fetchProfile(tokens.accessToken);
        if (!freshProfile) {
          const minProfile: AuthProfile = { ...loginData.profile, role, status: "ACTIVE" };
          await saveProfile(minProfile);
          set((s) => {
            s.tokens = tokens;
            s.profile = minProfile;
            s.invitedProfile = false;
            s.isLoading = false;
            s.isAuthenticating = false;
            s.hasFetchedPlan = true;
          });
          return {};
        }

        const isInvited = freshProfile.status === "INVITED";

        // Step 4: Commit atomically
        await saveProfile(freshProfile);
        set((s) => {
          s.tokens = tokens;
          s.profile = freshProfile;
          s.invitedProfile = isInvited;
          s.isLoading = false;
          s.isAuthenticating = false;
        });

        // For owners (non-invited): check subscription
        if (freshProfile.role === "owner" && !isInvited) {
          fetchOwnerHasActivePlan(tokens.accessToken).then((active) => {
            set((s) => {
              s.hasActivePlan = active;
              s.hasFetchedPlan = true;
            });
          });
        } else {
          set((s) => { s.hasFetchedPlan = true; });
        }

        return {};
      } catch {
        set((s) => {
          s.isLoading = false;
          s.isAuthenticating = false;
        });
        return { error: "Network error. Please check your connection." };
      }
    },

    // ── Logout ───────────────────────────────────────────────────────────────
    logout: async () => {
      const { tokens } = get();

      if (tokens?.refreshToken) {
        apiPost("/api/auth/mobile-logout", { refreshToken: tokens.refreshToken }).catch(() => {});
      }

      try {
        const Notifications = await import("expo-notifications");
        const Constants = await import("expo-constants");
        const projectId =
          Constants.default.expoConfig?.extra?.eas?.projectId ??
          Constants.default.easConfig?.projectId;
        if (projectId && tokens?.accessToken) {
          const { data: expoToken } = await Notifications.getExpoPushTokenAsync({ projectId });
          apiPost("/api/push/register-device", { expoPushToken: expoToken }, "DELETE", tokens.accessToken).catch(() => {});
        }
      } catch { /* non-fatal */ }

      await clearTokens();
      await clearProfile();
      set((s) => {
        s.tokens = null;
        s.profile = null;
        s.invitedProfile = false;
        s.hasActivePlan = true;
        s.hasFetchedPlan = false;
      });
    },

    // ── Silent refresh ───────────────────────────────────────────────────────
    refresh: async () => {
      const { tokens } = get();
      if (!tokens?.refreshToken) return false;

      try {
        const res = await apiPost("/api/auth/mobile-refresh", { refreshToken: tokens.refreshToken });
        if (!res.ok) return false;

        const data = await res.json();
        const newTokens: StoredTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessExpiresAt: Date.now() + data.expiresIn * 1000,
        };

        await saveTokens(newTokens);

        const profile = await fetchProfile(data.accessToken);
        if (profile) {
          await saveProfile(profile);
          set((s) => {
            s.tokens = newTokens;
            s.profile = profile;
            s.invitedProfile = profile.status === "INVITED";
          });
        } else {
          set((s) => { s.tokens = newTokens; });
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
          // If status changed away from INVITED, clear the flag
          if (partial.status && partial.status !== "INVITED") {
            s.invitedProfile = false;
          }
          saveProfile({ ...s.profile, ...partial } as AuthProfile).catch(() => {});
        }
      });
    },

    // ── Set hasActivePlan (call after plan activation) ───────────────────────
    setHasActivePlan: (val) => {
      set((s) => {
        s.hasActivePlan = val;
        s.hasFetchedPlan = true;
      });
    },
  })),
);
