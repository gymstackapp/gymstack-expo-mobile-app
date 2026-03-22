// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { AuthStackParamList } from '../../navigation/AuthNavigator';
// import { useAuth } from '../../context/AuthContext';

// type Props = {
//   navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
// };

// const C = {
//   bg: '#0A0A0A',
//   surface: '#1A1A1A',
//   border: '#2C2C2E',
//   primary: '#FF3B30',
//   text: '#FFFFFF',
//   textSub: '#8E8E93',
//   inputBg: '#1C1C1E',
// };

// export default function LoginScreen({ navigation }: Props) {
//   const { login } = useAuth();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!email.trim() || !password.trim()) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }
//     setLoading(true);
//     try {
//       await login(email.trim(), password);
//       navigation.navigate('SelectRole');
//     } catch {
//       Alert.alert('Error', 'Invalid credentials. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.container}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Brand */}
//           <View style={styles.brandContainer}>
//             <View style={styles.logoBox}>
//               <Ionicons name="barbell" size={36} color={C.primary} />
//             </View>
//             <Text style={styles.brandName}>GYMSTACK</Text>
//             <Text style={styles.tagline}>Welcome back, let's get to work</Text>
//           </View>

//           {/* Form */}
//           <View style={styles.form}>
//             <Text style={styles.label}>Email</Text>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="mail-outline" size={18} color={C.textSub} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="you@example.com"
//                 placeholderTextColor={C.textSub}
//                 value={email}
//                 onChangeText={setEmail}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 autoCorrect={false}
//               />
//             </View>

//             <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="lock-closed-outline" size={18} color={C.textSub} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="••••••••"
//                 placeholderTextColor={C.textSub}
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!showPassword}
//                 autoCapitalize="none"
//               />
//               <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
//                 <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSub} />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity
//               onPress={() => navigation.navigate('ForgotPassword')}
//               style={styles.forgotBtn}
//             >
//               <Text style={styles.forgotText}>Forgot Password?</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
//               onPress={handleLogin}
//               disabled={loading}
//               activeOpacity={0.85}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.primaryBtnText}>LOG IN</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Footer */}
//           <View style={styles.footer}>
//             <Text style={styles.footerText}>Don't have an account? </Text>
//             <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
//               <Text style={styles.footerLink}>Sign Up</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: C.bg },
//   container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },
//   brandContainer: { alignItems: 'center', marginBottom: 48 },
//   logoBox: {
//     width: 72,
//     height: 72,
//     borderRadius: 20,
//     backgroundColor: '#1C1C1E',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: C.border,
//   },
//   brandName: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: 4 },
//   tagline: { fontSize: 14, color: C.textSub, marginTop: 6 },
//   form: {},
//   label: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 8, letterSpacing: 0.5 },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: C.inputBg,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: C.border,
//     paddingHorizontal: 14,
//     height: 52,
//   },
//   inputIcon: { marginRight: 10 },
//   input: { flex: 1, color: C.text, fontSize: 15 },
//   eyeBtn: { padding: 4 },
//   forgotBtn: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 28 },
//   forgotText: { color: C.primary, fontSize: 13, fontWeight: '600' },
//   primaryBtn: {
//     backgroundColor: C.primary,
//     borderRadius: 14,
//     height: 54,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
//   footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
//   footerText: { color: C.textSub, fontSize: 14 },
//   footerLink: { color: C.primary, fontSize: 14, fontWeight: '700' },
// });

// mobile/src/screens/auth/LoginScreen.tsx
import { Button, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
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
export function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logo}>
          <Image
            source={require("../../../assets/images/logo_bg2.png")}
            contentFit="cover"
            style={{ width: 300, height: 150 }}
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
  logo: { alignItems: "center", marginBottom: Spacing.xxxl },
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
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
});
