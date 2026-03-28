// // mobile/src/utils/pushNotifications.ts
// // Sets up Firebase Cloud Messaging (FCM) for push notifications.
// // On app start: requests permission, gets FCM token, registers with backend.
// // Handles foreground + background + quit-state notification display.

// import { useEffect } from "react"
// import messaging from "@react-native-firebase/messaging"
// import notifee, { AndroidImportance, AndroidStyle } from "@notifee/react-native"
// import { pushApi } from "@/api/endpoints"
// import { useAuthStore } from "@/store/authStore"

// // ── Channel setup (Android) ──────────────────────────────────────────────────
// async function createNotificationChannels() {
//     await notifee.createChannel({
//         id: "default",
//         name: "General Notifications",
//         importance: AndroidImportance.HIGH,
//     })
//     await notifee.createChannel({
//         id: "alerts",
//         name: "Expiry & Payment Alerts",
//         importance: AndroidImportance.HIGH,
//         vibration: true,
//     })
//     await notifee.createChannel({
//         id: "reminders",
//         name: "Check-in Reminders",
//         importance: AndroidImportance.DEFAULT,
//     })
// }

// // ── Display a local notification using Notifee ───────────────────────────────
// async function displayNotification(remoteMessage: any) {
//     const { title, body, imageUrl } = remoteMessage.notification ?? {}
//     const { channelId = "default", url } = remoteMessage.data ?? {}

//     await notifee.displayNotification({
//         title: title ?? "GymStack",
//         body: body ?? "",
//         android: {
//             channelId,
//             smallIcon: "ic_notification",   // needs to be in android/app/src/main/res/drawable
//             color: "#f97316",
//             importance: AndroidImportance.HIGH,
//             pressAction: { id: "default" },
//             ...(imageUrl ? {
//                 style: { type: AndroidStyle.BIGPICTURE, picture: imageUrl },
//             } : {}),
//             actions: url ? [
//                 { title: "Open", pressAction: { id: "open", launchActivity: "default" } },
//             ] : undefined,
//         },
//         ios: {
//             sound: "default",
//             categoryId: "gymstack",
//         },
//         data: remoteMessage.data,
//     })
// }

// // ── Register FCM token with backend ─────────────────────────────────────────
// async function registerToken() {
//     const { profile } = useAuthStore.getState()
//     if (!profile) return

//     try {
//         const token = await messaging().getToken()
//         if (token) {
//             await pushApi.registerToken(token)
//         }
//     } catch (err) {
//         console.warn("[Push] Token registration failed:", err)
//     }
// }

// // ── Main setup hook — call once in App.tsx ───────────────────────────────────
// export function usePushNotifications() {
//     const { profile } = useAuthStore()

//     useEffect(() => {
//         if (!profile) return

//         let unsubscribe: (() => void)[] = []

//         const setup = async () => {
//             // Create Android channels
//             await createNotificationChannels()

//             // Request permission (iOS + Android 13+)
//             const authStatus = await messaging().requestPermission()
//             const enabled =
//                 authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//                 authStatus === messaging.AuthorizationStatus.PROVISIONAL

//             if (!enabled) return

//             // Register token
//             await registerToken()

//             // Refresh token listener
//             const unsubToken = messaging().onTokenRefresh(async (newToken) => {
//                 await pushApi.registerToken(newToken).catch(() => { })
//             })
//             unsubscribe.push(unsubToken)

//             // Foreground message handler
//             const unsubForeground = messaging().onMessage(async (remoteMessage) => {
//                 await displayNotification(remoteMessage)
//             })
//             unsubscribe.push(unsubForeground)
//         }

//         setup().catch(console.warn)

//         return () => { unsubscribe.forEach(fn => fn()) }
//     }, [profile?.id])
// }

// // ── Background/quit handler — register OUTSIDE React (in index.js) ──────────
// export function registerBackgroundHandler() {
//     // Called when app is in background or terminated
//     messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//         // Notifee will auto-display via FCM data payload
//         // If you need custom display logic, call displayNotification here
//         console.log("[Push] Background message:", remoteMessage.notification?.title)
//     })

//     // Notifee background event handler
//     notifee.onBackgroundEvent(async ({ type, detail }) => {
//         // Handle notification action presses (background)
//         // type: PRESS, ACTION_PRESS, DISMISSED
//         console.log("[Notifee] Background event:", type, detail)
//     })
// }

// mobile/src/utils/pushNotifications.ts
// Expo Push Notifications — complete implementation.
//
// How it works:
//   1. On login, request permission via expo-notifications
//   2. Get an Expo Push Token → "ExponentPushToken[xxxxxx]"
//   3. POST token to /api/push/register-device  → stored in DB
//   4. Backend sends to https://exp.host/--/api/v2/push/send
//   5. Expo forwards to FCM (Android) or APNs (iOS) automatically
//
// What you do NOT need with Expo:
//   - firebase-admin / @react-native-firebase/messaging
//   - @notifee/react-native
//   - google-services.json / GoogleService-Info.plist
//   - A background handler registered outside React
//   - Any native Android/iOS configuration beyond app.json

import { pushApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// ── Foreground display behaviour ─────────────────────────────────────────────
// This must be called at module level (before any component renders).
// It tells expo-notifications to show alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Deep-link: URL → React Navigation screen ────────────────────────────────
// Every push payload we send from the backend includes a `url` field in `data`.
// This function maps that URL to a screen name the navigator understands.
export function resolveDeepLink(
  url: string | undefined,
  role: string | null | undefined,
): { screen: string; params?: Record<string, string> } | null {
  if (!url) return null;
  try {
    const path = url.replace(/^\//, "").split("?")[0];

    if (role === "owner") {
      if (path === "owner/dashboard") return { screen: "OwnerDashboard" };
      if (path === "owner/members") return { screen: "OwnerMembers" };
      if (path === "owner/payments") return { screen: "OwnerPayments" };
      if (path === "owner/notifications")
        return { screen: "OwnerNotifications" };
      if (path === "owner/expenses") return { screen: "OwnerExpenses" };
      if (path.startsWith("owner/members/")) {
        return {
          screen: "OwnerMemberDetail",
          params: { memberId: path.split("/")[2] },
        };
      }
    }

    if (role === "member") {
      if (path === "member/dashboard") return { screen: "MemberDashboard" };
      if (path === "member/notifications")
        return { screen: "MemberNotifications" };
      if (path === "member/payments") return { screen: "MemberPayments" };
    }

    if (role === "trainer") {
      if (path === "trainer/notifications")
        return { screen: "TrainerNotifications" };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Android notification channels ────────────────────────────────────────────
// Must be created before the first notification is shown on Android 8+.
async function setupAndroidChannels() {
  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#f97316",
  });
  await Notifications.setNotificationChannelAsync("alerts", {
    name: "Expiry & Payment Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#f97316",
  });
  await Notifications.setNotificationChannelAsync("payments", {
    name: "Payment Notifications",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Check-in Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// ── Request permission + get Expo Push Token ─────────────────────────────────
// Returns the Expo Push Token string, or null if not available.
async function registerForPushNotifications(): Promise<string | null> {
  // Push tokens only work on real physical devices
  if (!Device.isDevice) {
    console.log(
      "[Push] Skipped — simulator/emulator does not support push tokens",
    );
    return null;
  }

  // Create Android channels before requesting permission
  if (Platform.OS === "android") {
    await setupAndroidChannels();
  }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask the user if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission denied — no push notifications");
    return null;
  }

  // Get the Expo Push Token.
  // projectId is read from app.json → extra.eas.projectId, or from EXPO_PUBLIC_PROJECT_ID.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_PROJECT_ID;

  if (!projectId) {
    console.warn(
      "[Push] EXPO_PUBLIC_PROJECT_ID is not set — cannot get push token",
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Push] Token registered:", tokenData.data);
    return tokenData.data; // "ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]"
  } catch (err) {
    console.warn("[Push] getExpoPushTokenAsync failed:", err);
    return null;
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
// Call once inside AppContent in App.tsx.
// Handles: permission, token registration, foreground display, tap navigation,
// and killed-state navigation (app opened by tapping a notification).
export function usePushNotifications(navigationRef?: React.RefObject<any>) {
  const { profile } = useAuthStore();
  const navRef = useRef(navigationRef?.current);

  // Always keep navRef pointing at the latest navigation ref
  useEffect(() => {
    navRef.current = navigationRef?.current;
  });

  useEffect(() => {
    if (!profile) return;

    // Get token and register with backend
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          pushApi.registerToken(token).catch(() => {});
        }
      })
      .catch(console.warn);

    // Foreground listener — notification arrived while app is open.
    // expo-notifications shows the alert automatically (configured above).
    // Add any side-effects here (e.g. invalidate React Query cache).
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // The notification displays automatically.
        // Example side-effect: qc.invalidateQueries({ queryKey: ["unreadCount"] })
      },
    );

    // Tap listener — user tapped a notification (foreground or background).
    // `data.url` contains the deep-link URL we sent from the backend.
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;
        const dest = resolveDeepLink(url, profile.role);
        if (dest && navRef.current) {
          try {
            navRef.current.navigate(dest.screen, dest.params);
          } catch {}
        }
      },
    );

    // Killed-state: app was opened by tapping a notification while fully closed.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;
        const dest = resolveDeepLink(url, profile.role);
        if (dest && navRef.current) {
          // Wait for navigation to fully mount before navigating
          setTimeout(() => {
            try {
              navRef.current?.navigate(dest.screen, dest.params);
            } catch {}
          }, 500);
        }
      })
      .catch(() => {});

    return () => {
      foregroundSub.remove();
      tapSub.remove();
    };
  }, [profile?.id]);
}
