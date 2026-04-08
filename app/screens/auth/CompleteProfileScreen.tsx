// app/screens/auth/CompleteProfileScreen.tsx
// Shown to users who were added by a gym owner (profile.status === "INVITED").
// Their mobile is pre-filled and locked.
// Two verification paths:
//   A — Enter the SMS token sent at invitation time
//   B — Verify with email: enter email → request OTP → verify → complete
// On success: update profile in store (status=ACTIVE), RootNavigator auto-routes.

import { authCompletionApi } from "@/api/endpoints";
import { Button, Card, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation } from "@tanstack/react-query";
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
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";

type VerifyMode = "token" | "email";
type EmailStep = "input" | "otp" | "done";
type Gender = "Male" | "Female" | "Other";

const GENDERS: Gender[] = ["Male", "Female", "Other"];

export function CompleteProfileScreen() {
  const { profile, updateProfile } = useAuthStore();

  const [verifyMode, setVerifyMode] = useState<VerifyMode>("token");
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailStep, setEmailStep] = useState<EmailStep>("input");

  // Token path
  const [smsToken, setSmsToken] = useState("");

  // Email path
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  // Common completion form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Request email OTP ──────────────────────────────────────────────────────
  const requestOtpMutation = useMutation({
    mutationFn: () => authCompletionApi.requestOtp({ email }),
    onSuccess: () => {
      setEmailStep("otp");
      Toast.show({ type: "success", text1: "OTP sent to your email" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to send OTP" }),
  });

  // ── Complete profile ───────────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof authCompletionApi.complete>[0] = {
        profileId: profile!.id,
        email,
        password,
        city: city || undefined,
        gender: gender || undefined,
      };
      if (verifyMode === "token") {
        payload.token = smsToken;
      } else {
        payload.emailOtp = emailOtp;
      }
      return authCompletionApi.complete(payload);
    },
    onSuccess: (data: any) => {
      // Update profile in store — status becomes ACTIVE, RootNavigator re-routes
      updateProfile({
        status: "ACTIVE",
        email: email || profile?.email || "",
        city: city || profile?.city || null,
        gender: gender || profile?.gender || null,
        ...(data?.profile ?? {}),
      });
      Toast.show({ type: "success", text1: "Profile set up! Welcome 🎉" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Verification failed" }),
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateCompletion = () => {
    const e: Record<string, string> = {};
    if (verifyMode === "token" && !smsToken.trim()) {
      e.smsToken = "Enter the code from your SMS";
    }
    if (verifyMode === "email" && !emailOtp.trim()) {
      e.emailOtp = "Enter the OTP from your email";
    }
    if (verifyMode === "email" && !email.trim()) {
      e.email = "Email is required";
    }
    if (!password || password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleComplete = () => {
    if (validateCompletion()) completeMutation.mutate();
  };

  const handleRequestOtp = () => {
    if (!email.trim()) {
      setErrors((e) => ({ ...e, email: "Enter your email first" }));
      return;
    }
    requestOtpMutation.mutate();
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Icon name="account-check-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={s.title}>Complete Your Profile</Text>
            <Text style={s.subtitle}>
              You were added to a gym. Set up your account to get started.
            </Text>
          </View>

          {/* Mobile (locked) */}
          <Card style={s.card}>
            <Text style={s.sectionLabel}>YOUR MOBILE</Text>
            <View style={s.lockedRow}>
              <Icon name="phone-outline" size={18} color={Colors.textMuted} />
              <Text style={s.lockedText}>
                {profile?.mobileNumber ?? "—"}
              </Text>
              <View style={s.lockedBadge}>
                <Icon name="lock-outline" size={11} color={Colors.textMuted} />
                <Text style={s.lockedBadgeTxt}>Locked</Text>
              </View>
            </View>
          </Card>

          {/* Verification — Option A: SMS token */}
          <Card style={s.card}>
            <Text style={s.sectionLabel}>VERIFY YOUR IDENTITY</Text>

            <TouchableOpacity
              style={[
                s.optionRow,
                verifyMode === "token" && s.optionRowActive,
              ]}
              onPress={() => {
                setVerifyMode("token");
                setEmailExpanded(false);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.radio,
                  verifyMode === "token" && s.radioActive,
                ]}
              >
                {verifyMode === "token" && (
                  <View style={s.radioDot} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>Enter code from SMS</Text>
                <Text style={s.optionSub}>
                  Use the invitation code sent to your mobile
                </Text>
              </View>
            </TouchableOpacity>

            {verifyMode === "token" && (
              <Input
                label="SMS Code *"
                value={smsToken}
                onChangeText={(v) => {
                  setSmsToken(v);
                  setErrors((e) => ({ ...e, smsToken: "" }));
                }}
                placeholder="Enter invitation code"
                leftIcon="message-text-outline"
                error={errors.smsToken}
                autoCapitalize="characters"
              />
            )}

            {/* Option B: Email */}
            <TouchableOpacity
              style={[
                s.optionRow,
                { marginTop: Spacing.sm },
                verifyMode === "email" && s.optionRowActive,
              ]}
              onPress={() => {
                setVerifyMode("email");
                setEmailExpanded(true);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.radio,
                  verifyMode === "email" && s.radioActive,
                ]}
              >
                {verifyMode === "email" && (
                  <View style={s.radioDot} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>Verify with email instead</Text>
                <Text style={s.optionSub}>
                  We'll send a one-time code to your email
                </Text>
              </View>
              <Icon
                name={emailExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>

            {verifyMode === "email" && (
              <View style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
                {emailStep === "input" && (
                  <>
                    <Input
                      label="Email *"
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setErrors((e) => ({ ...e, email: "" }));
                      }}
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon="email-outline"
                      error={errors.email}
                    />
                    <Button
                      label="Send OTP"
                      onPress={handleRequestOtp}
                      loading={requestOtpMutation.isPending}
                      variant="outline"
                    />
                  </>
                )}

                {emailStep === "otp" && (
                  <>
                    <View style={s.otpSentRow}>
                      <Icon name="check-circle-outline" size={16} color={Colors.success} />
                      <Text style={s.otpSentTxt}>OTP sent to {email}</Text>
                      <TouchableOpacity onPress={() => setEmailStep("input")}>
                        <Text style={s.changeLink}>Change</Text>
                      </TouchableOpacity>
                    </View>
                    <Input
                      label="Email OTP *"
                      value={emailOtp}
                      onChangeText={(v) => {
                        setEmailOtp(v);
                        setErrors((e) => ({ ...e, emailOtp: "" }));
                      }}
                      placeholder="6-digit code"
                      keyboardType="number-pad"
                      leftIcon="shield-key-outline"
                      error={errors.emailOtp}
                    />
                    <TouchableOpacity
                      onPress={handleRequestOtp}
                      style={{ alignSelf: "flex-end" }}
                    >
                      <Text style={s.resendLink}>
                        {requestOtpMutation.isPending ? "Sending…" : "Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </Card>

          {/* Completion form */}
          <Card style={s.card}>
            <Text style={s.sectionLabel}>SET UP YOUR ACCOUNT</Text>

            {verifyMode === "email" && emailStep === "otp" && (
              <Input
                label="Email *"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErrors((e) => ({ ...e, email: "" }));
                }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="email-outline"
                error={errors.email}
                editable={false}
              />
            )}

            {verifyMode === "token" && (
              <Input
                label="Email *"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErrors((e) => ({ ...e, email: "" }));
                }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="email-outline"
                error={errors.email}
              />
            )}

            <Input
              label="Password *"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrors((e) => ({ ...e, password: "" }));
              }}
              placeholder="Minimum 8 characters"
              secureTextEntry
              leftIcon="lock-outline"
              error={errors.password}
            />
            <Input
              label="Confirm Password *"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setErrors((e) => ({ ...e, confirmPassword: "" }));
              }}
              placeholder="Re-enter password"
              secureTextEntry
              leftIcon="lock-check-outline"
              error={errors.confirmPassword}
            />

            <Text style={s.sectionLabel}>OPTIONAL DETAILS</Text>

            <Input
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
              leftIcon="city-variant-outline"
            />

            {/* Gender pill selector */}
            <View>
              <Text style={s.fieldLabel}>Gender</Text>
              <View style={s.pillRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[s.pill, gender === g && s.pillActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[s.pillTxt, gender === g && s.pillTxtActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          <Button
            label="Complete Setup"
            onPress={handleComplete}
            loading={completeMutation.isPending}
            style={{ marginTop: Spacing.sm }}
          />

          <Text style={s.footerNote}>
            Your mobile number is verified by your gym. This sets your password
            and email for future logins.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  header: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
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
    lineHeight: 20,
  },
  card: { gap: Spacing.sm },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  lockedText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedBadgeTxt: { color: Colors.textMuted, fontSize: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  optionRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  optionSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  otpSentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  otpSentTxt: {
    flex: 1,
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  changeLink: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  resendLink: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
    marginTop: 4,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  pillTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  pillTxtActive: { color: Colors.primary, fontWeight: "700" },
  footerNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
