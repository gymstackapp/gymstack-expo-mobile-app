import { API_BASE } from "@/api/config";
import { Button, Dropdown, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

GoogleSignin.configure({
  webClientId:
    Constants.expoConfig?.extra?.googleWebClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    "",
});

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
  const googleSignIn = useAuthStore((s) => s.googleSignIn);
  const googleSignInAndSetRole = useAuthStore((s) => s.googleSignInAndSetRole);

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const [mobileError, setMobileError] = useState("");
  const [mobileOk, setMobileOk] = useState(false);
  const [mobileChecking, setMobileChecking] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailOk, setEmailOk] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const mobileDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
    city: "",
    gender: "",
    // referralCode: "",
  });

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1_000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const setF = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const checkMobileUnique = useCallback((raw: string) => {
    setMobileError("");
    setMobileOk(false);
    const digits = raw.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setMobileChecking(false);
      return;
    }
    if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
    setMobileChecking(true);
    mobileDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/auth/check-mobile-status?mobile=${digits}`,
        );
        const data = await res.json();
        if (data.status !== "NOT_FOUND") {
          setMobileError("An account with this mobile number already exists");
        } else {
          setMobileOk(true);
        }
      } catch {
        /* ignore network errors */
      } finally {
        setMobileChecking(false);
      }
    }, 500);
  }, []);

  const checkEmailUnique = useCallback((raw: string) => {
    setEmailError("");
    setEmailOk(false);
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setEmailChecking(false);
      return;
    }
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    setEmailChecking(true);
    emailDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/auth/check-email-status?email=${encodeURIComponent(email)}`,
        );
        const data = await res.json();
        if (data.status === "FOUND") {
          setEmailError("An account with this email already exists");
        } else {
          setEmailOk(true);
        }
      } catch {
        /* ignore network errors */
      } finally {
        setEmailChecking(false);
      }
    }, 500);
  }, []);

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const onGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        setError("Google sign-in failed — no token received");
        return;
      }

      if (pendingRole) {
        // PATH A: atomic google sign-in + role set
        setGoogleLoading(false);
        setSettingUp(true);
        const result = await googleSignInAndSetRole(idToken, pendingRole);
        clearPendingRole();
        if (result.error) {
          setSettingUp(false);
          setError(result.error);
        }
        return;
      }

      // PATH B: google sign-in only, role via SelectRole
      const result = await googleSignIn(idToken);
      if (result.error) setError(result.error);
    } catch (e: any) {
      console.log("er", e);
      if (
        e.code === statusCodes.SIGN_IN_CANCELLED ||
        e.code === statusCodes.IN_PROGRESS
      )
        return;
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

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
    if (!form.gender.trim()) return "Gender is required";
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
    if (mobileError || emailError) return;
    if (mobileChecking || emailChecking) {
      setError("Please wait while we verify your details");
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
          // referralCode: form.referralCode.trim() || undefined,
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
          {/* <Text style={s.logoSub}>
            {step === "form" ? "Create your account" : "Verify your email"}
          </Text> */}
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
            <View>
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: Typography.xxl,
                  fontWeight: Typography.bold,
                  marginBottom: 4,
                }}
              >
                Create you account
              </Text>
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: Typography.sm,
                  marginBottom: Spacing.xl,
                }}
              >
                Join GymStack and manage your gym smarter
              </Text>
            </View>

            <Input
              label="Full Name *"
              value={form.fullName}
              onChangeText={(v) => setF("fullName")(v.replace(/[0-9]/g, ""))}
              placeholder="Rahul Singh"
              autoCapitalize="words"
            />
            <Input
              label="Mobile Number *"
              value={form.mobileNumber}
              onChangeText={(v) => {
                setF("mobileNumber")(v);
                checkMobileUnique(v);
              }}
              placeholder="9876543210"
              keyboardType="phone-pad"
              error={mobileError}
              success={mobileOk && !mobileError ? "Available" : undefined}
              checking={mobileChecking}
            />
            <Input
              label="City *"
              value={form.city}
              onChangeText={(v) => setF("city")(v.replace(/[0-9]/g, ""))}
              placeholder="Mumbai"
              autoCapitalize="words"
            />
            <Input
              label="Email *"
              value={form.email}
              onChangeText={(v) => {
                setF("email")(v);
                checkEmailUnique(v);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              success={emailOk && !emailError ? "Available" : undefined}
              checking={emailChecking}
            />
            <View>
              {/* <Text style={s.fieldLabel}>Gender (optional)</Text>
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
              </View> */}
              <Dropdown
                label="Gender"
                value={form.gender}
                onChange={(v) => setF("gender")(v)}
                options={["Male", "Female", "Other", "Prefer not to say"]}
                placeholder="Select Gender"
                leftIcon="gender-male-female"
              />
            </View>

            <Input
              label="Password *"
              value={form.password}
              onChangeText={setF("password")}
              placeholder="Min 8 characters"
              password
            />

            {/* <Input
              label="Referral Code (optional)"
              value={form.referralCode}
              onChangeText={setF("referralCode")}
              placeholder="e.g. RAHUL1234"
              autoCapitalize="characters"
            /> */}
            <Button
              label="Create Account"
              onPress={onSendOtp}
              loading={loading}
            />

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google sign-up */}
            <TouchableOpacity
              style={[
                s.googleBtn,
                (loading || googleLoading) && { opacity: 0.6 },
              ]}
              onPress={onGoogleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              <Text style={s.googleBtnText}>
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </Text>
            </TouchableOpacity>
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: Spacing.lg,
  },
});
