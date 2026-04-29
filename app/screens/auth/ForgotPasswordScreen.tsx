// mobile/src/screens/auth/ForgotPasswordScreen.tsx
import { API_BASE } from "@/api/endpoints";
import { Button, Input } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Image,
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
        <View style={s.successWrap}>
          <View
            style={{
              alignItems: "center",
              marginBottom: Spacing.xxl,
              marginTop: Spacing.xxxl,
            }}
          >
            <Image
              source={require("../../../assets/images/logo_bg2.png")}
              style={{ width: 260, height: 130 }}
            />
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: Typography.sm,
                marginTop: 4,
              }}
            >
              We sent reset instructions to your email
            </Text>
          </View>
          <Text style={s.successTitle}>Check your inbox</Text>
          <View style={s.successIcon}>
            <Icon name="email-check-outline" size={40} color={Colors.success} />
          </View>
          <Text style={s.successSub}>
            A reset link has been sent to{"\n"}
            <Text style={{ color: Colors.primary, fontWeight: "700" }}>
              {email}
            </Text>{" "}
            .It expires in 1 hour.
          </Text>
          <Text style={s.successNote}>
            Didn't receive it? Check your spam folder.
          </Text>
          <Button
            label="Try a different email"
            onPress={() => {
              setState("idle");
              setErrMsg("");
            }}
          />
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
      style={{
        flex: 1,
        backgroundColor: Colors.bg,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            alignItems: "center",
            marginBottom: Spacing.xxl,
            marginTop: Spacing.xxxl,
          }}
        >
          <Image
            source={require("../../../assets/images/logo_bg2.png")}
            style={{ width: 260, height: 130 }}
          />
        </View>

        <Text style={s.heading}>Forgot password?</Text>
        <Text style={s.sub}>No worries — we will send you a reset link</Text>

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
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: 40,
    justifyContent: "center",
  },
  backHeader: { paddingTop: Spacing.xxxl, paddingBottom: Spacing.lg },
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
});
