// import { API_BASE } from "@/api/config";
// import { Button, Input } from "@/components";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useNavigation } from "@react-navigation/native";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import LinearGradient from "react-native-linear-gradient";

// const GENDERS = ["Male", "Female", "Other"];

// // ── OTP Input — 6 individual boxes ───────────────────────────────────────────

// function OtpInput({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (v: string) => void;
// }) {
//   const inputs = useRef<(TextInput | null)[]>([]);
//   const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

//   const onKey = (index: number, key: string, digit: string) => {
//     if (key === "Backspace") {
//       const next = value.slice(0, index);
//       onChange(next);
//       if (index > 0) inputs.current[index - 1]?.focus();
//       return;
//     }
//     if (digit && /^\d$/.test(digit)) {
//       const next = value.slice(0, index) + digit + value.slice(index + 1);
//       onChange(next.slice(0, 6));
//       if (index < 5) inputs.current[index + 1]?.focus();
//     }
//   };

//   return (
//     <View style={otp.row}>
//       {digits.map((d, i) => (
//         <TextInput
//           key={i}
//           ref={(el) => {
//             inputs.current[i] = el;
//           }}
//           style={[
//             otp.box,
//             d && otp.boxFilled,
//             i === value.length && otp.boxActive,
//           ]}
//           value={d}
//           onChangeText={(digit) => onKey(i, "", digit.slice(-1))}
//           onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key, "")}
//           keyboardType="number-pad"
//           maxLength={1}
//           selectTextOnFocus
//           caretHidden
//         />
//       ))}
//     </View>
//   );
// }

// const otp = StyleSheet.create({
//   row: { flexDirection: "row", gap: Spacing.sm, justifyContent: "center" },
//   box: {
//     width: 48,
//     height: 56,
//     borderRadius: Radius.lg,
//     borderWidth: 2,
//     borderColor: Colors.border,
//     backgroundColor: Colors.surface,
//     textAlign: "center",
//     fontSize: 22,
//     fontWeight: "800",
//     color: Colors.textPrimary,
//   },
//   boxFilled: {
//     borderColor: Colors.primary,
//     backgroundColor: Colors.primaryFaded,
//   },
//   boxActive: { borderColor: Colors.primary },
// });

// // ── Main screen ───────────────────────────────────────────────────────────────

// type Step = "form" | "otp";

// export function SignupScreen() {
//   const navigation = useNavigation<any>();
//   const [step, setStep] = useState<Step>("form");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [otpCode, setOtpCode] = useState("");
//   const [resendTimer, setResendTimer] = useState(0);

//   const [form, setForm] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     confirmPw: "",
//     mobileNumber: "",
//     city: "",
//     gender: "",
//     referralCode: "",
//   });

//   // ── Resend countdown ──────────────────────────────────────────────────────
//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setTimeout(() => setResendTimer((r) => r - 1), 1_000);
//     return () => clearTimeout(t);
//   }, [resendTimer]);

//   const set = (key: keyof typeof form) => (val: string) =>
//     setForm((f) => ({ ...f, [key]: val }));

//   // ── Step 1 validation ─────────────────────────────────────────────────────
//   const validate = () => {
//     if (!form.fullName.trim()) return "Full name is required";
//     if (!form.email.trim() || !form.email.includes("@"))
//       return "Enter a valid email address";
//     if (form.password.length < 8)
//       return "Password must be at least 8 characters";
//     if (form.password !== form.confirmPw) return "Passwords don't match";
//     if (!form.mobileNumber.trim()) return "Mobile number is required";
//     if (form.mobileNumber.replace(/\D/g, "").length < 10)
//       return "Enter a valid 10-digit mobile number";
//     if (!form.city.trim()) return "City is required";
//     return null;
//   };

//   // ── Step 1 → send OTP ────────────────────────────────────────────────────
//   const onSendOtp = async () => {
//     setError("");
//     const err = validate();
//     if (err) {
//       setError(err);
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: form.email.trim().toLowerCase(),
//           fullName: form.fullName.trim(),
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         setError(data.error ?? "Failed to send code");
//         return;
//       }

//       setStep("otp");
//       setOtpCode("");
//       setResendTimer(60);
//     } catch {
//       setError("Network error. Check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Resend OTP ────────────────────────────────────────────────────────────
//   const onResend = async () => {
//     if (resendTimer > 0) return;
//     setError("");
//     setOtpCode("");
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: form.email.trim().toLowerCase(),
//           fullName: form.fullName.trim(),
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         setError(data.error ?? "Failed to resend");
//         return;
//       }
//       setResendTimer(60);
//     } catch {
//       setError("Network error.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Step 2 → verify OTP + create account ─────────────────────────────────
//   const onVerifyAndCreate = async () => {
//     setError("");
//     if (otpCode.length !== 6) {
//       setError("Enter the 6-digit code");
//       return;
//     }

//     setLoading(true);
//     try {
//       // 1. Verify OTP
//       const verifyRes = await fetch(`${API_BASE}/api/auth/verify-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: form.email.trim().toLowerCase(),
//           otp: otpCode,
//         }),
//       });
//       const verifyData = await verifyRes.json();
//       if (!verifyRes.ok) {
//         setError(verifyData.error ?? "Invalid code");
//         return;
//       }

//       // 2. Create account
//       const regRes = await fetch(`${API_BASE}/api/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           fullName: form.fullName.trim(),
//           email: form.email.trim().toLowerCase(),
//           password: form.password,
//           mobileNumber: form.mobileNumber.trim(),
//           city: form.city.trim(),
//           gender: form.gender || null,
//           referralCode: form.referralCode.trim() || undefined,
//         }),
//       });
//       const regData = await regRes.json();
//       if (!regRes.ok) {
//         setError(regData.error ?? "Registration failed");
//         return;
//       }

//       // Account created + OTP verified — now log in automatically
//       // login() calls /api/auth/mobile-login, stores JWT tokens in Keychain,
//       // sets profile in store → RootNavigator sees role===null → shows SelectRoleScreen
//       const { login } = (
//         await import("@/store/authStore")
//       ).useAuthStore.getState();
//       const loginResult = await login(
//         form.email.trim().toLowerCase(),
//         form.password,
//       );

//       if (loginResult.error) {
//         // Login failed (shouldn't happen) — send to Login screen manually
//         setError("Account created! Please sign in.");
//         setStep("form");
//         navigation.navigate("Login");
//       }
//       // On success: RootNavigator automatically navigates to SelectRoleScreen
//       // because profile is now set with role === null. No navigation call needed.
//     } catch {
//       setError("Network error. Check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1, backgroundColor: Colors.bg }}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Logo */}
//         <View style={s.logo}>
//           <LinearGradient
//             colors={[Colors.primary, "#ea580c"]}
//             style={s.logoIcon}
//           >
//             <Text style={{ fontSize: 28 }}>💪</Text>
//           </LinearGradient>
//           <Text style={s.logoText}>GymStack</Text>
//           <Text style={s.logoSub}>
//             {step === "form" ? "Create your account" : "Verify your email"}
//           </Text>
//         </View>

//         {/* Error */}
//         {!!error && (
//           <View style={s.errorBox}>
//             <Text style={s.errorText}>{error}</Text>
//           </View>
//         )}

//         {/* ── STEP 1: Form ─────────────────────────────────── */}
//         {step === "form" && (
//           <View style={s.fields}>
//             <Input
//               label="Full Name *"
//               value={form.fullName}
//               onChangeText={set("fullName")}
//               placeholder="Rahul Singh"
//               autoCapitalize="words"
//             />
//             <Input
//               label="Email *"
//               value={form.email}
//               onChangeText={set("email")}
//               placeholder="you@example.com"
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//             <Input
//               label="Password *"
//               value={form.password}
//               onChangeText={set("password")}
//               placeholder="Min 8 characters"
//               password
//             />
//             <Input
//               label="Confirm Password *"
//               value={form.confirmPw}
//               onChangeText={set("confirmPw")}
//               placeholder="Re-enter password"
//               password
//             />
//             <Input
//               label="Mobile Number *"
//               value={form.mobileNumber}
//               onChangeText={set("mobileNumber")}
//               placeholder="9876543210"
//               keyboardType="phone-pad"
//             />
//             <Input
//               label="City *"
//               value={form.city}
//               onChangeText={set("city")}
//               placeholder="Mumbai"
//               autoCapitalize="words"
//             />

//             {/* Gender */}
//             <View>
//               <Text style={s.fieldLabel}>Gender (optional)</Text>
//               <View style={s.genderRow}>
//                 {GENDERS.map((g) => (
//                   <TouchableOpacity
//                     key={g}
//                     style={[s.genderBtn, form.gender === g && s.genderActive]}
//                     onPress={() => set("gender")(form.gender === g ? "" : g)}
//                   >
//                     <Text
//                       style={[
//                         s.genderText,
//                         form.gender === g && s.genderTextActive,
//                       ]}
//                     >
//                       {g}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>

//             <Input
//               label="Referral Code (optional)"
//               value={form.referralCode}
//               onChangeText={set("referralCode")}
//               placeholder="e.g. RAHUL1234"
//               autoCapitalize="characters"
//             />

//             <Button
//               label="Send Verification Code"
//               onPress={onSendOtp}
//               loading={loading}
//             />
//           </View>
//         )}

//         {/* ── STEP 2: OTP ──────────────────────────────────── */}
//         {step === "otp" && (
//           <View style={s.otpWrap}>
//             {/* Info */}
//             <View style={s.otpInfo}>
//               <Text style={s.otpInfoTitle}>Check your email</Text>
//               <Text style={s.otpInfoSub}>
//                 We sent a 6-digit code to{"\n"}
//                 <Text style={{ color: Colors.primary, fontWeight: "700" }}>
//                   {form.email}
//                 </Text>
//               </Text>
//             </View>

//             {/* OTP boxes */}
//             <OtpInput value={otpCode} onChange={setOtpCode} />

//             {/* Timer / resend */}
//             <View style={s.resendRow}>
//               <Text style={s.resendLabel}>Didn't receive it? </Text>
//               {resendTimer > 0 ? (
//                 <Text style={s.resendTimer}>Resend in {resendTimer}s</Text>
//               ) : (
//                 <TouchableOpacity onPress={onResend} disabled={loading}>
//                   <Text style={s.resendLink}>Resend code</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             <Button
//               label="Verify & Create Account"
//               onPress={onVerifyAndCreate}
//               loading={loading}
//             />

//             {/* Back */}
//             <TouchableOpacity
//               style={s.backBtn}
//               onPress={() => {
//                 setStep("form");
//                 setError("");
//               }}
//             >
//               <Text style={s.backBtnText}>← Edit my details</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Sign in link */}
//         <View style={s.loginRow}>
//           <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>
//             Already have an account?{" "}
//           </Text>
//           <TouchableOpacity onPress={() => navigation.navigate("Login")}>
//             <Text
//               style={{
//                 color: Colors.primary,
//                 fontSize: Typography.sm,
//                 fontWeight: "700",
//               }}
//             >
//               Sign In
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const s = StyleSheet.create({
//   scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 48 },
//   logo: {
//     alignItems: "center",
//     paddingTop: Spacing.xl,
//     marginBottom: Spacing.xl,
//     gap: Spacing.xs,
//   },
//   logoIcon: {
//     width: 72,
//     height: 72,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   logoText: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: "900",
//     letterSpacing: -0.5,
//   },
//   logoSub: { color: Colors.textMuted, fontSize: Typography.sm },
//   errorBox: {
//     backgroundColor: Colors.errorFaded,
//     borderRadius: Radius.lg,
//     padding: Spacing.md,
//     marginBottom: Spacing.md,
//     borderWidth: 1,
//     borderColor: Colors.error + "40",
//   },
//   errorText: { color: Colors.error, fontSize: Typography.sm },
//   fields: { gap: Spacing.md, marginBottom: Spacing.lg },
//   fieldLabel: {
//     color: Colors.textSecondary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//     marginBottom: Spacing.sm,
//   },
//   genderRow: { flexDirection: "row", gap: Spacing.sm },
//   genderBtn: {
//     paddingHorizontal: 16,
//     paddingVertical: 9,
//     borderRadius: Radius.full,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     backgroundColor: Colors.surface,
//   },
//   genderActive: {
//     borderColor: Colors.primary,
//     backgroundColor: Colors.primaryFaded,
//   },
//   genderText: { color: Colors.textMuted, fontSize: Typography.sm },
//   genderTextActive: { color: Colors.primary, fontWeight: "700" },
//   otpWrap: { gap: Spacing.xl, marginBottom: Spacing.lg },
//   otpInfo: { alignItems: "center", gap: Spacing.sm },
//   otpInfoTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xl,
//     fontWeight: "800",
//   },
//   otpInfoSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     lineHeight: 22,
//   },
//   resendRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   resendLabel: { color: Colors.textMuted, fontSize: Typography.sm },
//   resendTimer: { color: Colors.textMuted, fontSize: Typography.sm },
//   resendLink: {
//     color: Colors.primary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//   },
//   backBtn: { alignItems: "center", paddingTop: Spacing.sm },
//   backBtnText: { color: Colors.textMuted, fontSize: Typography.sm },
//   loginRow: {
//     flexDirection: "row",
//     justifyContent: "center",
//     paddingTop: Spacing.lg,
//   },
// });

// mobile/src/screens/auth/SignupScreen.tsx
//
// Registration — two steps: form → OTP → account created.
//
// TWO PATHS after registration:
//
//   PATH A  pendingRole in onboardingStore (user picked role on Onboarding slide 5)
//     → calls loginAndSetRole(email, password, pendingRole)
//     → loginAndSetRole keeps isAuthenticating=true the ENTIRE time
//     → When it resolves, profile.role is already set in Zustand
//     → RootNavigator fires once: resolveTarget → OwnerApp/TrainerApp/MemberApp
//     → SelectRoleScreen is NEVER shown
//     → clearPendingRole() called to clean up store
//
//   PATH B  no pendingRole (user tapped "Create account" from Login screen)
//     → calls login() normally
//     → profile.role = null → RootNavigator → SelectRole
//     → User picks role manually on SelectRoleScreen
//
// NO navigation calls in this file. RootNavigator drives everything.

import { API_BASE } from "@/api/config";
import { Button, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const LOGO = require("../../../assets/images/logo.png");
const GENDERS = ["Male", "Female", "Other"] as const;
type Role = "owner" | "trainer" | "member";

// ── Role display metadata ─────────────────────────────────────────────────────
const ROLE_META: Record<Role, { icon: string; label: string; color: string }> =
  {
    owner: {
      icon: "office-building-outline",
      label: "Gym Owner",
      color: Colors.primary,
    },
    trainer: {
      icon: "account-tie-outline",
      label: "Trainer",
      color: "#a78bfa",
    },
    member: { icon: "account-outline", label: "Member", color: "#34d399" },
  };

// ── OTP 6-box input ───────────────────────────────────────────────────────────
function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (idx: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(-1);
    if (!clean) return;
    const next = value.slice(0, idx) + clean + value.slice(idx + 1);
    onChange(next.slice(0, 6));
    if (idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKey = (idx: number, key: string) => {
    if (key === "Backspace") {
      onChange(value.slice(0, idx));
      if (idx > 0) inputs.current[idx - 1]?.focus();
    }
  };
  return (
    <View style={otp.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          style={[
            otp.box,
            d ? otp.boxFilled : null,
            i === value.length ? otp.boxActive : null,
          ]}
          value={d}
          onChangeText={(digit) => handleChange(i, digit)}
          onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          caretHidden
        />
      ))}
    </View>
  );
}
const otp = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.sm, justifyContent: "center" },
  box: {
    width: 48,
    height: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  boxActive: { borderColor: Colors.primary },
});

// ── Role badge shown at top of form when pendingRole is set ───────────────────
function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return (
    <View
      style={[
        rb.wrap,
        { backgroundColor: m.color + "18", borderColor: m.color + "40" },
      ]}
    >
      <Icon name={m.icon} size={14} color={m.color} />
      <Text style={[rb.txt, { color: m.color }]}>Signing up as {m.label}</Text>
    </View>
  );
}
const rb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "center",
  },
  txt: { fontSize: Typography.xs, fontWeight: "700" },
});

// ── Setting-up overlay ────────────────────────────────────────────────────────
// Shown during loginAndSetRole (PATH A). Replaces the screen entirely so
// there is zero gap for RootNavigator to show SelectRoleScreen.
// Component stays mounted until RootNavigator unmounts it by navigating away.
function SettingUpOverlay({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return (
    <View style={ov.root}>
      <Image source={LOGO} style={ov.logo} resizeMode="contain" />
      <ActivityIndicator
        color={m.color}
        size="large"
        style={{ marginBottom: Spacing.lg }}
      />
      <Text style={[ov.title, { color: m.color }]}>
        Setting up your workspace
      </Text>
      <Text style={ov.sub}>
        Configuring your{" "}
        <Text style={{ fontWeight: "800", color: m.color }}>{m.label}</Text>{" "}
        account…
      </Text>
    </View>
  );
}
const ov = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  logo: { width: 120, height: 120, marginBottom: Spacing.lg },
  title: { fontSize: Typography.xl, fontWeight: "800" },
  sub: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 22,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
type Step = "form" | "otp";

export function SignupScreen() {
  const navigation = useNavigation<any>();

  // PATH A: pendingRole set by OnboardingScreen slide 5 → stored in onboardingStore
  // PATH B: pendingRole is null → user came from Login "Create account" link
  const { pendingRole, clearPendingRole } = useOnboardingStore();

  const login = useAuthStore((s) => s.login);
  const loginAndSetRole = useAuthStore((s) => s.loginAndSetRole);

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
    city: "",
    gender: "",
    referralCode: "",
  });

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1_000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const setF = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.email.trim() || !form.email.includes("@"))
      return "Enter a valid email address";
    if (form.password.length < 8)
      return "Password must be at least 8 characters";
    if (!form.mobileNumber.trim()) return "Mobile number is required";
    if (form.mobileNumber.replace(/\D/g, "").length < 10)
      return "Enter a valid 10-digit mobile number";
    if (!form.city.trim()) return "City is required";
    return null;
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const onSendOtp = async () => {
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          fullName: form.fullName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }
      setStep("otp");
      setOtpCode("");
      setResendTimer(60);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const onResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setOtpCode("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          fullName: form.fullName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resend");
        return;
      }
      setResendTimer(60);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP → Register → Login/LoginAndSetRole ───────────────────────────
  const onVerifyAndCreate = async () => {
    setError("");
    if (otpCode.length !== 6) {
      setError("Enter the complete 6-digit code");
      return;
    }
    setLoading(true);

    try {
      // 1. Verify OTP
      const verifyRes = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: otpCode,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Invalid code");
        return;
      }

      // 2. Register
      const regRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          mobileNumber: form.mobileNumber.trim(),
          city: form.city.trim(),
          gender: form.gender || null,
          referralCode: form.referralCode.trim() || undefined,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        setError(regData.error ?? "Registration failed");
        return;
      }

      // ── PATH A: pendingRole set — atomic login + role set ───────────────────
      if (pendingRole) {
        // Show the overlay BEFORE any async work.
        // This replaces the screen so even if RootNavigator fires during the
        // async operations below, the user sees the overlay (not SelectRole).
        setLoading(false);
        setSettingUp(true);

        const result = await loginAndSetRole(
          form.email.trim().toLowerCase(),
          form.password,
          pendingRole,
        );

        // Always clear pendingRole regardless of success/failure.
        // On success: profile.role is set, RootNavigator routes to correct app,
        //             this component is unmounted — clearPendingRole is still safe.
        // On failure: user is either logged in with role=null (→ SelectRole)
        //             or not logged in (→ Login), either way role pick is lost.
        clearPendingRole();

        if (result.error) {
          // loginAndSetRole committed whatever state it could.
          // RootNavigator will route appropriately.
          // Show error briefly — component will unmount when nav happens.
          setSettingUp(false);
          setError(result.error);
        }
        // On success: do nothing. RootNavigator handles navigation.
        return;
      }

      // ── PATH B: no pendingRole — plain login, role via SelectRole ───────────
      const loginResult = await login(
        form.email.trim().toLowerCase(),
        form.password,
      );
      if (loginResult.error) {
        setStep("form");
        setError("Account created! Please sign in with your credentials.");
      }
      // On success: profile.role=null → RootNavigator → SelectRole (correct)
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Overlay guard — must be BEFORE the form render ──────────────────────────
  // When settingUp=true, render the overlay instead of the form.
  // This ensures zero chance of RootNavigator showing SelectRole while we work.
  if (settingUp && pendingRole) {
    return <SettingUpOverlay role={pendingRole} />;
  }

  // ── Form / OTP render ───────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <Image source={LOGO} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoSub}>
            {step === "form" ? "Create your account" : "Verify your email"}
          </Text>
          {pendingRole && step === "form" && <RoleBadge role={pendingRole} />}
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errorBox}>
            <Icon name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* ── STEP 1: Form ──────────────────────────────────────────────────── */}
        {step === "form" && (
          <View style={s.fields}>
            <Input
              label="Full Name *"
              value={form.fullName}
              onChangeText={setF("fullName")}
              placeholder="Rahul Singh"
              autoCapitalize="words"
            />
            <Input
              label="Email *"
              value={form.email}
              onChangeText={setF("email")}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password *"
              value={form.password}
              onChangeText={setF("password")}
              placeholder="Min 8 characters"
              password
            />
            <Input
              label="Mobile Number *"
              value={form.mobileNumber}
              onChangeText={setF("mobileNumber")}
              placeholder="9876543210"
              keyboardType="phone-pad"
            />
            <Input
              label="City *"
              value={form.city}
              onChangeText={setF("city")}
              placeholder="Mumbai"
              autoCapitalize="words"
            />

            <View>
              <Text style={s.fieldLabel}>Gender (optional)</Text>
              <View style={s.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      s.genderBtn,
                      form.gender === g && s.genderBtnActive,
                    ]}
                    onPress={() => setF("gender")(form.gender === g ? "" : g)}
                  >
                    <Text
                      style={[
                        s.genderTxt,
                        form.gender === g && s.genderTxtActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Referral Code (optional)"
              value={form.referralCode}
              onChangeText={setF("referralCode")}
              placeholder="e.g. RAHUL1234"
              autoCapitalize="characters"
            />
            <Button
              label="Send Verification Code"
              onPress={onSendOtp}
              loading={loading}
            />
          </View>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────────────── */}
        {step === "otp" && (
          <View style={s.otpWrap}>
            <View style={s.otpInfo}>
              <Text style={s.otpTitle}>Check your email</Text>
              <Text style={s.otpSub}>
                We sent a 6-digit code to{"\n"}
                <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                  {form.email}
                </Text>
              </Text>
              {pendingRole && (
                <View style={s.roleReminder}>
                  <Icon
                    name={ROLE_META[pendingRole].icon}
                    size={13}
                    color={ROLE_META[pendingRole].color}
                  />
                  <Text
                    style={[
                      s.roleReminderTxt,
                      { color: ROLE_META[pendingRole].color },
                    ]}
                  >
                    You'll be set up as {ROLE_META[pendingRole].label}
                  </Text>
                </View>
              )}
            </View>

            <OtpInput value={otpCode} onChange={setOtpCode} />

            <View style={s.resendRow}>
              <Text style={s.resendLabel}>Didn't receive it? </Text>
              {resendTimer > 0 ? (
                <Text style={s.resendTimer}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={onResend} disabled={loading}>
                  <Text style={s.resendLink}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>

            <Button
              label={loading ? "Creating account…" : "Verify & Create Account"}
              onPress={onVerifyAndCreate}
              loading={loading}
            />

            <TouchableOpacity
              style={s.backBtn}
              onPress={() => {
                setStep("form");
                setError("");
                setOtpCode("");
              }}
            >
              <Text style={s.backBtnTxt}>← Edit my details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign in link */}
        <View style={s.signInRow}>
          <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text
              style={{
                color: Colors.primary,
                fontSize: Typography.sm,
                fontWeight: "700",
              }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 48 },
  logoWrap: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoImg: { width: 100, height: 100 },
  logoSub: { color: Colors.textMuted, fontSize: Typography.sm },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  errorText: { color: Colors.error, fontSize: Typography.sm, flex: 1 },
  fields: { gap: Spacing.md, marginBottom: Spacing.lg },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  genderRow: { flexDirection: "row", gap: Spacing.sm },
  genderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  genderTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  genderTxtActive: { color: Colors.primary, fontWeight: "700" },
  otpWrap: { gap: Spacing.xl, marginBottom: Spacing.lg },
  otpInfo: { alignItems: "center", gap: Spacing.sm },
  otpTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
  },
  otpSub: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  roleReminder: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleReminderTxt: { fontSize: Typography.xs, fontWeight: "600" },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendLabel: { color: Colors.textMuted, fontSize: Typography.sm },
  resendTimer: { color: Colors.textMuted, fontSize: Typography.sm },
  resendLink: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  backBtn: { alignItems: "center", paddingTop: Spacing.sm },
  backBtnTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: Spacing.lg,
  },
});
