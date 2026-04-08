// // mobile/src/screens/auth/SelectRoleScreen.tsx
// // Shown after signup when profile.role is null.
// // Calls /api/auth/set-role with Bearer token, then refreshes profile from server.
// import { api } from "@/api/client";
// import { useAuthStore } from "@/store/authStore";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Image } from "expo-image";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const ROLES = [
//   {
//     id: "owner",
//     icon: "shield-check-outline",
//     title: "Gym Owner",
//     desc: "Manage your gym, members, trainers, billing and analytics.",
//     color: Colors.primary,
//   },
//   {
//     id: "trainer",
//     icon: "dumbbell",
//     title: "Trainer",
//     desc: "View your assigned members, create workout and diet plans.",
//     color: "#3b82f6",
//   },
//   {
//     id: "member",
//     icon: "account-outline",
//     title: "Member",
//     desc: "Track workouts, diet plans, attendance and payments.",
//     color: "#10b981",
//   },
// ] as const;

// type Role = "owner" | "trainer" | "member";

// export default function SelectRoleScreen() {
//   const { refresh, profile } = useAuthStore();
//   const [selected, setSelected] = useState<Role | null>(null);
//   const [loading, setLoading] = useState(false);

//   const onConfirm = async () => {
//     if (!selected) {
//       Alert.alert("Select a role", "Please choose how you'll use GymStack.");
//       return;
//     }

//     setLoading(true);
//     try {
//       // POST /api/auth/set-role — the api client attaches the Bearer token automatically
//       await api.post("/api/auth/set-role", { role: selected });

//       // Refresh profile in the store so RootNavigator re-evaluates role
//       // and navigates to the correct app stack automatically
//       await refresh();
//     } catch (err: any) {
//       Alert.alert(
//         "Error",
//         err?.message ?? "Failed to set role. Please try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={s.safe}>
//       <View style={s.container}>
//         {/* Header */}
//         <View style={s.header}>
//           <Image
//             source={require("../../../assets/images/logo_bg2.png")}
//             contentFit="contain"
//             style={{ width: 220, height: 110 }}
//           />
//           <Text style={s.title}>How will you use GymStack?</Text>
//           <Text style={s.subtitle}>
//             Choose your role — this cannot be changed later.
//           </Text>
//         </View>

//         {/* Role cards */}
//         <View style={s.roles}>
//           {ROLES.map((role) => {
//             const active = selected === role.id;
//             return (
//               <TouchableOpacity
//                 key={role.id}
//                 style={[
//                   s.roleCard,
//                   active && {
//                     borderColor: role.color,
//                     backgroundColor: role.color + "0f",
//                   },
//                 ]}
//                 onPress={() => setSelected(role.id)}
//                 activeOpacity={0.8}
//               >
//                 <View
//                   style={[s.roleIcon, { backgroundColor: role.color + "18" }]}
//                 >
//                   <Icon name={role.icon} size={26} color={role.color} />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={[s.roleTitle, active && { color: role.color }]}>
//                     {role.title}
//                   </Text>
//                   <Text style={s.roleDesc}>{role.desc}</Text>
//                 </View>
//                 <View
//                   style={[s.radioOuter, active && { borderColor: role.color }]}
//                 >
//                   {active && (
//                     <View
//                       style={[s.radioInner, { backgroundColor: role.color }]}
//                     />
//                   )}
//                 </View>
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         {/* Confirm button */}
//         <TouchableOpacity
//           style={[s.confirmBtn, !selected && s.confirmBtnDisabled]}
//           onPress={onConfirm}
//           disabled={loading || !selected}
//           activeOpacity={0.85}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <>
//               <Text style={s.confirmText}>
//                 Continue as{" "}
//                 {selected ? ROLES.find((r) => r.id === selected)?.title : "..."}
//               </Text>
//               <Icon name="arrow-right" size={18} color="#fff" />
//             </>
//           )}
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   container: {
//     flex: 1,
//     padding: Spacing.lg,
//     justifyContent: "center",
//     gap: Spacing.xl,
//   },
//   header: { alignItems: "center", gap: Spacing.md },
//   logoWrap: {
//     width: 72,
//     height: 72,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: "800",
//     textAlign: "center",
//   },
//   subtitle: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     lineHeight: 22,
//   },
//   roles: { gap: Spacing.md },
//   roleCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     backgroundColor: Colors.surface,
//     borderRadius: Radius.xl,
//     borderWidth: 2,
//     borderColor: Colors.border,
//     padding: Spacing.lg,
//   },
//   roleIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: Radius.lg,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   roleTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//     marginBottom: 3,
//   },
//   roleDesc: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     lineHeight: 18,
//   },
//   radioOuter: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     borderWidth: 2,
//     borderColor: Colors.border,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   radioInner: { width: 12, height: 12, borderRadius: 6 },
//   confirmBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.sm,
//     backgroundColor: Colors.primary,
//     borderRadius: Radius.xl,
//     padding: Spacing.lg,
//   },
//   confirmBtnDisabled: { backgroundColor: Colors.textMuted, opacity: 0.5 },
//   confirmText: { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
// });

// mobile/src/screens/auth/SelectRoleScreen.tsx
//
// IMPORTANT — why we use useAuthStore.getState() not the hook:
// onConfirm is an async callback. React closures capture hook values at
// render time. By the time the user taps "Confirm", a re-render may have
// occurred between mount and the tap. useAuthStore.getState() always gives
// the LIVE store value at call time — no stale closure possible.

import { API_BASE } from "@/api/config";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ROLES = [
  {
    id: "owner" as const,
    icon: "shield-check-outline",
    title: "Gym Owner",
    desc: "Manage your gym, members, trainers, billing and analytics.",
    color: Colors.primary,
  },
  {
    id: "trainer" as const,
    icon: "dumbbell",
    title: "Trainer",
    desc: "View assigned members, create workout and diet plans.",
    color: "#3b82f6",
  },
  {
    id: "member" as const,
    icon: "account-outline",
    title: "Member",
    desc: "Track workouts, diet plans, attendance and payments.",
    color: "#10b981",
  },
];

type Role = "owner" | "trainer" | "member";

export default function SelectRoleScreen() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onConfirm = async () => {
    if (!selected) {
      Alert.alert("Select a role", "Please choose how you'll use GymStack.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Read LIVE token via getState() — never from a hook/closure in async code
      const { tokens, refresh, logout } = useAuthStore.getState();

      if (!tokens?.accessToken) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        // Clear state and let RootNavigator navigate to Login
        await logout();
        return;
      }

      const res = await fetch(`${API_BASE}/api/profile/set-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ role: selected }),
      });

      // Log for debugging — remove after confirming it works
      console.log(`[SelectRole] set-role response: ${res.status}`);

      if (res.status === 401) {
        // Token rejected — try to refresh once then retry
        console.log("[SelectRole] 401 received — attempting token refresh");
        const refreshed = await refresh();
        if (!refreshed) {
          setError("Session expired. Please sign in again.");
          await logout();
          return;
        }

        // Retry with new token
        const freshTokens = useAuthStore.getState().tokens;
        if (!freshTokens?.accessToken) {
          setError("Session error. Please sign in again.");
          await logout();
          return;
        }

        const retryRes = await fetch(`${API_BASE}/api/profile/set-role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshTokens.accessToken}`,
          },
          body: JSON.stringify({ role: selected }),
        });

        console.log(`[SelectRole] retry response: ${retryRes.status}`);

        if (!retryRes.ok) {
          const retryData = await retryRes.json().catch(() => ({}));
          setError(
            (retryData as any).error ?? "Failed to set role. Please try again.",
          );
          return;
        }
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error ?? `Failed to set role (${res.status})`);
        return;
      }

      // Success — refresh profile so RootNavigator navigates automatically
      await refresh();
    } catch (err: any) {
      console.error("[SelectRole] error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <LinearGradient
            colors={[Colors.primary, "#ea580c"]}
            style={s.logoWrap}
          >
            <Text style={{ fontSize: 28 }}>💪</Text>
          </LinearGradient>
          <Text style={s.title}>How will you use GymStack?</Text>
          <Text style={s.subtitle}>
            Choose your role carefully — this cannot be changed later.
          </Text>
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Role cards */}
        <View style={s.roles}>
          {ROLES.map((role) => {
            const active = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  s.roleCard,
                  active && {
                    borderColor: role.color,
                    backgroundColor: role.color + "0f",
                  },
                ]}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[s.roleIcon, { backgroundColor: role.color + "18" }]}
                >
                  <Icon name={role.icon} size={26} color={role.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.roleTitle, active && { color: role.color }]}>
                    {role.title}
                  </Text>
                  <Text style={s.roleDesc}>{role.desc}</Text>
                </View>
                <View
                  style={[s.radioOuter, active && { borderColor: role.color }]}
                >
                  {active && (
                    <View
                      style={[s.radioInner, { backgroundColor: role.color }]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[s.confirmBtn, (!selected || loading) && s.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={s.confirmText}>
                Continue as{" "}
                {ROLES.find((r) => r.id === selected)?.title ?? "..."}
              </Text>
              <Icon name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    gap: Spacing.xl,
  },
  header: { alignItems: "center", gap: Spacing.md },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  errorText: { color: Colors.error, fontSize: Typography.sm },
  roles: { gap: Spacing.md },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: 3,
  },
  roleDesc: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
});
