// mobile/src/navigation/RootNavigator.tsx
//
// SINGLE SOURCE OF TRUTH FOR NAVIGATION.
// No screen is ever allowed to call navigation.reset() or navigate() to drive
// auth/onboarding flows. Screens update Zustand state; this component reacts.
//
// COMPLETE STATE MACHINE (resolveTarget):
//
//   splashDone=false                        → null       (Splash screen stays)
//   isHydrated=false                        → null       (reading Keychain)
//   seenOnboarding=null                     → null       (reading AsyncStorage)
//   isAuthenticating=true                   → null       (login in flight)
//   seenOnboarding=false                    → Onboarding
//   seenOnboarding=true, profile=null,
//     pendingRole≠null                      → Signup
//   seenOnboarding=true, profile=null,
//     pendingRole=null                      → Login
//   profile.role=null                       → SelectRole
//   profile.status=INVITED                  → CompleteProfile  ← NEW
//   profile.role=owner, !hasActivePlan,
//     hasFetchedPlan=true                   → ChoosePlan       ← NEW
//   profile.role=owner                      → OwnerApp
//   profile.role=trainer                    → TrainerApp
//   else                                    → MemberApp

import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { forwardRef, useEffect, useRef, useState } from "react";

import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import SelectRoleScreen from "../screens/auth/SelectRoleScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";
import { CompleteProfileScreen } from "../screens/auth/CompleteProfileScreen";
import { ChoosePlanScreen } from "../screens/owner/ChoosePlanScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { MemberNavigator } from "./MemberNavigator";
import { OwnerNavigator } from "./OwnerNavigator";
import { TrainerNavigator } from "./TrainerNavigator";

const MIN_SPLASH_MS = 1800;

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  SelectRole: undefined;
  CompleteProfile: undefined;
  ChoosePlan: undefined;
  OwnerApp: undefined;
  MemberApp: undefined;
  TrainerApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── resolveTarget ──────────────────────────────────────────────────────────────
function resolveTarget(
  splashDone: boolean,
  isHydrated: boolean,
  isAuthenticating: boolean,
  seenOnboarding: boolean | null,
  pendingRole: string | null,
  profile: { role?: string | null; status?: string } | null,
  hasActivePlan: boolean,
  hasFetchedPlan: boolean,
): keyof RootStackParamList | null {
  // ── Not ready yet ────────────────────────────────────────────────────────
  if (!splashDone) return null;
  if (!isHydrated) return null;
  if (seenOnboarding === null) return null;
  if (isAuthenticating) return null;

  // ── Onboarding ───────────────────────────────────────────────────────────
  if (!seenOnboarding) return "Onboarding";

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!profile) {
    if (pendingRole) return "Signup";
    return "Login";
  }

  // ── No role yet ───────────────────────────────────────────────────────────
  if (!profile.role) return "SelectRole";

  // ── INVITED — must complete profile before accessing app ─────────────────
  if (profile.status === "INVITED") return "CompleteProfile";

  // ── Owner without active plan ─────────────────────────────────────────────
  // Only route to ChoosePlan once we've actually fetched the subscription status.
  // hasFetchedPlan prevents a false redirect before the check completes.
  if (profile.role === "owner" && hasFetchedPlan && !hasActivePlan) {
    return "ChoosePlan";
  }

  // ── Logged in with role ───────────────────────────────────────────────────
  if (profile.role === "owner") return "OwnerApp";
  if (profile.role === "trainer") return "TrainerApp";
  return "MemberApp";
}

export const RootNavigator = forwardRef<any, Record<string, never>>(
  function RootNavigator(_, ref) {
    const {
      isHydrated,
      isAuthenticating,
      profile,
      hydrate,
      hasActivePlan,
      hasFetchedPlan,
    } = useAuthStore();
    const { seenOnboarding, pendingRole, loadOnboardingState } = useOnboardingStore();

    const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
    const ready = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [splashDone, setSplashDone] = useState(false);

    useEffect(() => {
      hydrate();
      loadOnboardingState();
      timer.current = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }, []);

    useEffect(() => {
      const target = resolveTarget(
        splashDone,
        isHydrated,
        isAuthenticating,
        seenOnboarding,
        pendingRole,
        profile,
        hasActivePlan,
        hasFetchedPlan,
      );
      if (!target || !ready.current || !navRef.current) return;

      const current = navRef.current.getCurrentRoute()?.name;
      if (current === target) return;

      navRef.current.reset({ index: 0, routes: [{ name: target }] });
    }, [
      splashDone,
      isHydrated,
      isAuthenticating,
      seenOnboarding,
      pendingRole,
      profile?.role,
      profile?.status,
      !!profile,
      hasActivePlan,
      hasFetchedPlan,
    ]);

    const initialRoute: keyof RootStackParamList =
      resolveTarget(
        splashDone,
        isHydrated,
        isAuthenticating,
        seenOnboarding,
        pendingRole,
        profile,
        hasActivePlan,
        hasFetchedPlan,
      ) ?? "Splash";

    return (
      <NavigationContainer
        ref={(el) => {
          (navRef as any).current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as any).current = el;
        }}
        onReady={() => {
          ready.current = true;
        }}
      >
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: "fade" }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ animation: "none" }}
          />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="SelectRole"
            component={SelectRoleScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="ChoosePlan"
            component={ChoosePlanScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen name="OwnerApp" component={OwnerNavigator} />
          <Stack.Screen name="MemberApp" component={MemberNavigator} />
          <Stack.Screen name="TrainerApp" component={TrainerNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  },
);
