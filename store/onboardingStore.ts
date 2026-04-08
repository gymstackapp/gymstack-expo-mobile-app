// // mobile/src/store/onboardingStore.ts
// //
// // Shared state for the onboarding flow.
// // Both RootNavigator (reader) and OnboardingScreen (writer) use this store
// // so they are always in sync — no AsyncStorage race conditions.
// //
// // On app start, RootNavigator calls loadOnboardingState() which reads
// // AsyncStorage and sets seenOnboarding in this store.
// // When the user completes/skips onboarding, OnboardingScreen calls
// // markOnboardingDone() which writes AsyncStorage AND updates this store
// // atomically — so RootNavigator's useEffect fires with the correct value
// // immediately.

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { create } from "zustand";

// const ONBOARDING_KEY = "gymstack_onboarding_done";

// interface OnboardingState {
//   // null  = not yet loaded from AsyncStorage
//   // false = first install, show onboarding
//   // true  = already seen, skip onboarding
//   seenOnboarding: boolean | null;

//   // Called once on app start by RootNavigator
//   loadOnboardingState: () => Promise<void>;

//   // Called by OnboardingScreen when user finishes or skips
//   // Writes AsyncStorage + updates store atomically
//   markOnboardingDone: () => Promise<void>;
// }

// export const useOnboardingStore = create<OnboardingState>((set) => ({
//   seenOnboarding: null,

//   loadOnboardingState: async () => {
//     try {
//       const val = await AsyncStorage.getItem(ONBOARDING_KEY);
//       set({ seenOnboarding: val === "true" });
//     } catch {
//       // If AsyncStorage fails, assume first install → show onboarding
//       set({ seenOnboarding: false });
//     }
//   },

//   markOnboardingDone: async () => {
//     // Update Zustand FIRST so RootNavigator re-evaluates immediately
//     // with seenOnboarding = true before navigation.reset fires
//     set({ seenOnboarding: true });
//     // Then persist to AsyncStorage (fire-and-forget — state already updated)
//     try {
//       await AsyncStorage.setItem(ONBOARDING_KEY, "true");
//     } catch {
//       // Non-fatal — worst case user sees onboarding again on next cold start
//     }
//   },
// }));

// mobile/src/store/onboardingStore.ts
//
// Single source of truth for onboarding state.
// Used by RootNavigator (reader), OnboardingScreen (writer), SignupScreen (reader+writer).
//
// WHY THIS EXISTS:
// RootNavigator is the ONLY component allowed to call navigation.reset/navigate.
// Screens must NEVER call navigation.reset to drive auth flows — doing so races
// with RootNavigator's own useEffect and causes unpredictable navigation.
//
// Instead, screens mutate this store, and RootNavigator's resolveTarget()
// reacts to the new state and decides where to go — always winning, always correct.
//
// STATE MACHINE:
//   seenOnboarding = null     → app just launched, AsyncStorage not read yet
//   seenOnboarding = false    → first install, RootNavigator → "Onboarding"
//   seenOnboarding = true  +
//     pendingRole = null      → completed/skipped onboarding, no role chosen
//                             → RootNavigator → "Login"
//   seenOnboarding = true  +
//     pendingRole = "owner"   → user picked role in slide 5
//                             → RootNavigator → "Signup"
//                             → SignupScreen reads pendingRole, shows badge,
//                               calls loginAndSetRole after registration
//                             → clearPendingRole() called after use

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ONBOARDING_KEY = "gymstack_onboarding_done";

type Role = "owner" | "trainer" | "member";

interface OnboardingState {
  /** null = not loaded yet; false = first install; true = already seen */
  seenOnboarding: boolean | null;

  /**
   * Role the user picked on onboarding slide 5.
   * null = no role chosen (user skipped, or came from Login link).
   * When set: RootNavigator routes to Signup instead of Login.
   * Cleared by SignupScreen after loginAndSetRole completes.
   */
  pendingRole: Role | null;

  /** Called once on app start by RootNavigator */
  loadOnboardingState: () => Promise<void>;

  /**
   * Called by OnboardingScreen slide 5 when user picks a role.
   * Sets pendingRole + marks onboarding done.
   * RootNavigator will route to Signup automatically.
   */
  setPendingRoleAndFinish: (role: Role) => Promise<void>;

  /**
   * Called by OnboardingScreen when user taps Skip or "Already have account".
   * Marks onboarding done WITHOUT a pending role → RootNavigator → Login.
   */
  finishWithoutRole: () => Promise<void>;

  /**
   * Called by SignupScreen after loginAndSetRole completes (success or error).
   * Clears pendingRole so it isn't reused on next signup attempt.
   */
  clearPendingRole: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  seenOnboarding: null,
  pendingRole: null,

  loadOnboardingState: async () => {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      // pendingRole starts null on every cold start — if the user was mid-onboarding
      // when the app was killed, they'll start onboarding fresh next time.
      set({ seenOnboarding: val === "true", pendingRole: null });
    } catch {
      set({ seenOnboarding: false, pendingRole: null });
    }
  },

  setPendingRoleAndFinish: async (role: Role) => {
    // Update Zustand FIRST (synchronous) so RootNavigator reacts immediately.
    // AsyncStorage write is fire-and-forget — Zustand is the source of truth.
    set({ seenOnboarding: true, pendingRole: role });
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      /* non-fatal */
    }
  },

  finishWithoutRole: async () => {
    set({ seenOnboarding: true, pendingRole: null });
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      /* non-fatal */
    }
  },

  clearPendingRole: () => {
    set({ pendingRole: null });
  },
}));
