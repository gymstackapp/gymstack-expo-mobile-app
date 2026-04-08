// // app/screens/auth/ForgotPasswordScreen.tsx
// import { Button, Input } from "@/components";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useNavigation } from "@react-navigation/native";
// import Constants from "expo-constants";
// import React, { useState } from "react";
// import {
//   KeyboardAvoidingView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// type PageState = "form" | "sent" | "no_account" | "oauth_account";

// const API_BASE: string =
//   process.env.EXPO_PUBLIC_API_URL ??
//   (Constants.expoConfig?.extra as any)?.apiUrl ??
//   "https://yourapp.com";

// export function ForgotPasswordScreen() {
//   const navigation = useNavigation();
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [pageState, setPageState] = useState<PageState>("form");
//   const [error, setError] = useState("");

//   const handleSubmit = async () => {
//     if (!email.trim()) {
//       setError("Email is required");
//       return;
//     }
//     setError("");
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: email.trim().toLowerCase() }),
//       });
//       const data = await res.json();

//       if (!res.ok) {
//         if (data.error === "no_account") {
//           setPageState("no_account");
//           return;
//         }
//         if (data.error === "oauth_account") {
//           setPageState("oauth_account");
//           return;
//         }
//         setError(data.error ?? "Failed to send reset email");
//         return;
//       }

//       setPageState("sent");
//     } catch {
//       setError("Network error. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const reset = () => {
//     setPageState("form");
//     setEmail("");
//     setError("");
//   };

//   // ── Email sent ────────────────────────────────────────────────────────────
//   if (pageState === "sent") {
//     return (
//       <View style={[styles.root, styles.centered]}>
//         <View style={[styles.iconCircle, { backgroundColor: Colors.primaryFaded }]}>
//           <Icon name="check-circle-outline" size={40} color={Colors.primary} />
//         </View>
//         <Text style={styles.stateTitle}>Check your inbox</Text>
//         <Text style={styles.stateSubtitle}>
//           A reset link has been sent to{"\n"}
//           <Text style={{ color: Colors.textPrimary, fontWeight: Typography.semibold }}>
//             {email}
//           </Text>
//           {"\n"}It expires in 1 hour.
//         </Text>
//         <Text style={styles.spamHint}>
//           Didn't receive it? Check your spam folder.
//         </Text>
//         <View style={styles.stateActions}>
//           <Button label="Try a different email" onPress={reset} variant="secondary" />
//           <TouchableOpacity
//             style={styles.ghostBtn}
//             onPress={() => (navigation as any).navigate("Login")}
//           >
//             <Icon name="arrow-left" size={16} color={Colors.textMuted} />
//             <Text style={styles.ghostBtnText}>Back to sign in</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   // ── No account found ──────────────────────────────────────────────────────
//   if (pageState === "no_account") {
//     return (
//       <View style={[styles.root, styles.centered]}>
//         <View style={[styles.iconCircle, { backgroundColor: "#FF9F0A22" }]}>
//           <Icon name="account-question-outline" size={40} color="#FF9F0A" />
//         </View>
//         <Text style={styles.stateTitle}>No account found</Text>
//         <Text style={styles.stateSubtitle}>
//           There's no GymStack account linked to{"\n"}
//           <Text style={{ color: Colors.textPrimary, fontWeight: Typography.semibold }}>
//             {email}
//           </Text>
//           {"\n"}Double-check the email or create a new account.
//         </Text>
//         <View style={styles.stateActions}>
//           <Button
//             label="Create an account"
//             onPress={() => (navigation as any).navigate("Signup")}
//           />
//           <Button label="Try a different email" onPress={reset} variant="secondary" />
//           <TouchableOpacity
//             style={styles.ghostBtn}
//             onPress={() => (navigation as any).navigate("Login")}
//           >
//             <Icon name="arrow-left" size={16} color={Colors.textMuted} />
//             <Text style={styles.ghostBtnText}>Back to sign in</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   // ── Google/OAuth account ──────────────────────────────────────────────────
//   if (pageState === "oauth_account") {
//     return (
//       <View style={[styles.root, styles.centered]}>
//         <View style={[styles.iconCircle, { backgroundColor: "#4285F422" }]}>
//           <Icon name="google" size={40} color="#4285F4" />
//         </View>
//         <Text style={styles.stateTitle}>Use Google to sign in</Text>
//         <Text style={styles.stateSubtitle}>
//           <Text style={{ color: Colors.textPrimary, fontWeight: Typography.semibold }}>
//             {email}
//           </Text>
//           {" "}is registered via Google.{"\n"}Sign in with your Google account — no password needed.
//         </Text>
//         <View style={styles.stateActions}>
//           <Button
//             label="Go to sign in"
//             onPress={() => (navigation as any).navigate("Login")}
//           />
//           <Button label="Try a different email" onPress={reset} variant="secondary" />
//         </View>
//       </View>
//     );
//   }

//   // ── Form ──────────────────────────────────────────────────────────────────
//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1, backgroundColor: Colors.bg }}
//       behavior="padding"
//     >
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.header}>
//           <View style={[styles.iconCircle, { backgroundColor: Colors.primaryFaded }]}>
//             <Icon name="lock-reset" size={30} color={Colors.primary} />
//           </View>
//           <Text style={styles.title}>Forgot your password?</Text>
//           <Text style={styles.subtitle}>
//             No worries — we'll send you a reset link
//           </Text>
//         </View>

//         {error ? (
//           <View style={styles.errorBox}>
//             <Text style={styles.errorText}>{error}</Text>
//           </View>
//         ) : null}

//         <Input
//           label="Email address"
//           value={email}
//           onChangeText={(v) => {
//             setEmail(v);
//             if (error) setError("");
//           }}
//           placeholder="you@example.com"
//           keyboardType="email-address"
//           leftIcon="email-outline"
//           error={undefined}
//         />

//         <View style={{ marginTop: Spacing.md }}>
//           <Button label="Send reset link" onPress={handleSubmit} loading={loading} />
//         </View>

//         <TouchableOpacity
//           style={styles.ghostBtn}
//           onPress={() => (navigation as any).navigate("Login")}
//         >
//           <Icon name="arrow-left" size={16} color={Colors.textMuted} />
//           <Text style={styles.ghostBtnText}>Back to sign in</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: Colors.bg,
//   },
//   centered: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: Spacing.xl,
//     paddingVertical: 60,
//   },
//   scroll: {
//     flexGrow: 1,
//     paddingHorizontal: Spacing.xl,
//     paddingTop: 60,
//     paddingBottom: 40,
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: Spacing.xxl,
//   },
//   iconCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: Spacing.lg,
//   },
//   title: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: Typography.bold,
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   subtitle: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   errorBox: {
//     backgroundColor: Colors.errorFaded,
//     borderRadius: Radius.lg,
//     padding: Spacing.md,
//     marginBottom: Spacing.md,
//     borderWidth: 1,
//     borderColor: Colors.error + "40",
//   },
//   errorText: { color: Colors.error, fontSize: Typography.sm },
//   ghostBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     marginTop: Spacing.lg,
//     paddingVertical: Spacing.sm,
//   },
//   ghostBtnText: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//   },
//   // State screens
//   stateTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xl,
//     fontWeight: Typography.bold,
//     textAlign: "center",
//     marginBottom: Spacing.sm,
//   },
//   stateSubtitle: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     lineHeight: 22,
//     marginBottom: Spacing.sm,
//   },
//   spamHint: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     textAlign: "center",
//     marginBottom: Spacing.xl,
//     opacity: 0.6,
//   },
//   stateActions: {
//     width: "100%",
//     gap: Spacing.sm,
//     marginTop: Spacing.md,
//   },
// });
// mobile/src/screens/auth/ForgotPasswordScreen.tsx
import { API_BASE } from "@/api/endpoints";
import { Button, Input } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type State = "idle" | "loading" | "sent" | "error";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async () => {
    if (!email.trim()) {
      setErrMsg("Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      setErrMsg("Enter a valid email address");
      return;
    }

    setState("loading");
    setErrMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "no_account") {
          setErrMsg("No account found with this email. Please sign up.");
          setState("error");
          return;
        }
        if (data.error === "oauth_account") {
          setErrMsg(
            "This account uses Google Sign-In. Please sign in with Google.",
          );
          setState("error");
          return;
        }
        setErrMsg(data.error ?? "Something went wrong");
        setState("error");
        return;
      }

      setState("sent");
    } catch {
      setErrMsg("Network error. Please check your connection.");
      setState("error");
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (state === "sent") {
    return (
      <View style={s.safe}>
        <TouchableOpacity
          style={s.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <Icon name="email-check-outline" size={40} color={Colors.success} />
          </View>
          <Text style={s.successTitle}>Check your email</Text>
          <Text style={s.successSub}>
            We sent a password reset link to{"\n"}
            <Text style={{ color: Colors.primary, fontWeight: "700" }}>
              {email}
            </Text>
          </Text>
          <Text style={s.successNote}>
            The link expires in 1 hour. Check your spam folder if you don't see
            it.
          </Text>
          <TouchableOpacity
            style={s.resendBtn}
            onPress={() => {
              setState("idle");
              setErrMsg("");
            }}
          >
            <Text style={s.resendText}>Try a different email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.backToLogin}
            onPress={() => navigation.navigate("Login")}
          >
            <Icon name="arrow-left" size={16} color={Colors.primary} />
            <Text style={s.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={s.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={s.iconWrap}>
          <Icon name="lock-reset" size={36} color={Colors.primary} />
        </View>

        <Text style={s.heading}>Forgot password?</Text>
        <Text style={s.sub}>
          Enter your registered email and we'll send you a reset link.
        </Text>

        <View style={s.formWrap}>
          {/* Error */}
          {!!errMsg && (
            <View style={s.errorBox}>
              <Icon
                name="alert-circle-outline"
                size={16}
                color={Colors.error}
              />
              <Text style={s.errorText}>{errMsg}</Text>
            </View>
          )}

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            label="Send Reset Link"
            onPress={onSubmit}
            loading={state === "loading"}
          />
        </View>

        <TouchableOpacity
          style={s.backToLogin}
          onPress={() => navigation.navigate("Login")}
        >
          <Icon name="arrow-left" size={16} color={Colors.primary} />
          <Text style={s.backToLoginText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 40 },
  backHeader: { paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  formWrap: { gap: Spacing.md },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  errorText: { color: Colors.error, fontSize: Typography.sm, flex: 1 },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingTop: Spacing.xl,
  },
  backToLoginText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  // Success state
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.successFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
    textAlign: "center",
  },
  successSub: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    textAlign: "center",
    lineHeight: 24,
  },
  successNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    lineHeight: 20,
  },
  resendBtn: { paddingVertical: Spacing.sm },
  resendText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
