// mobile/src/screens/auth/LoginScreen.tsx
import { Button, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

GoogleSignin.configure({
  webClientId:
    Constants.expoConfig?.extra?.googleWebClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    "",
});
export function LoginScreen() {
  const navigation = useNavigation();
  const { login, googleSignIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const onLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }
    const result = await login(email.trim(), password);
    if (result.error) setError(result.error);
    // Navigation handled automatically by RootNavigator on profile change
  };

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logo}>
          <Image
            source={require("../../../assets/images/logo_bg2.png")}
            contentFit="cover"
            style={{ width: 260, height: 130 }}
          />
          <Text style={styles.logoSub}>Manage your gym smarter</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            password
            placeholder="••••••••"
          />

          <TouchableOpacity
            onPress={() => (navigation as any).navigate("ForgotPassword")}
            style={{ alignSelf: "flex-end", marginBottom: Spacing.lg }}
          >
            <Text style={{ color: Colors.primary, fontSize: Typography.sm }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button label="Sign In" onPress={onLogin} loading={isLoading} />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[
              styles.googleBtn,
              (isLoading || googleLoading) && { opacity: 0.6 },
            ]}
            onPress={onGoogleSignIn}
            disabled={isLoading || googleLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleBtnText}>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("Signup")}
            >
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: Typography.sm,
                  fontWeight: Typography.semibold,
                }}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: Spacing.xl, justifyContent: "center" },
  logo: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
    marginTop: Spacing.xxxl,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
  },
  logoSub: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 4 },
  form: { gap: 0 },
  heading: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  subheading: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  errorText: { color: Colors.error, fontSize: Typography.sm },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
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
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
});
