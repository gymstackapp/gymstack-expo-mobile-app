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
//   navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
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

// export default function SignupScreen({ navigation }: Props) {
//   const { signup } = useAuth();
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleSignup = async () => {
//     if (!name.trim() || !email.trim() || !password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }
//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }
//     if (password.length < 6) {
//       Alert.alert('Error', 'Password must be at least 6 characters');
//       return;
//     }
//     setLoading(true);
//     try {
//       await signup(name.trim(), email.trim(), password);
//       navigation.navigate('SelectRole');
//     } catch {
//       Alert.alert('Error', 'Signup failed. Please try again.');
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
//           {/* Header */}
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//             <Ionicons name="arrow-back" size={24} color={C.text} />
//           </TouchableOpacity>

//           <View style={styles.header}>
//             <Text style={styles.title}>Create Account</Text>
//             <Text style={styles.subtitle}>Join GymStack and start your journey</Text>
//           </View>

//           {/* Form */}
//           <View style={styles.form}>
//             <Field
//               label="Full Name"
//               icon="person-outline"
//               placeholder="John Doe"
//               value={name}
//               onChangeText={setName}
//             />
//             <Field
//               label="Email"
//               icon="mail-outline"
//               placeholder="you@example.com"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//             <Field
//               label="Password"
//               icon="lock-closed-outline"
//               placeholder="Min. 6 characters"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry={!showPassword}
//               toggle={{ show: showPassword, onToggle: () => setShowPassword(v => !v) }}
//             />
//             <Field
//               label="Confirm Password"
//               icon="lock-closed-outline"
//               placeholder="Re-enter password"
//               value={confirmPassword}
//               onChangeText={setConfirmPassword}
//               secureTextEntry={!showConfirm}
//               toggle={{ show: showConfirm, onToggle: () => setShowConfirm(v => !v) }}
//             />

//             <TouchableOpacity
//               style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
//               onPress={handleSignup}
//               disabled={loading}
//               activeOpacity={0.85}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Footer */}
//           <View style={styles.footer}>
//             <Text style={styles.footerText}>Already have an account? </Text>
//             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//               <Text style={styles.footerLink}>Log In</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// type FieldProps = {
//   label: string;
//   icon: string;
//   placeholder: string;
//   value: string;
//   onChangeText: (v: string) => void;
//   keyboardType?: any;
//   autoCapitalize?: any;
//   secureTextEntry?: boolean;
//   toggle?: { show: boolean; onToggle: () => void };
// };

// function Field({ label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, toggle }: FieldProps) {
//   const C = {
//     border: '#2C2C2E', primary: '#FF3B30', text: '#FFFFFF', textSub: '#8E8E93', inputBg: '#1C1C1E',
//   };
//   return (
//     <View style={{ marginBottom: 16 }}>
//       <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 8, letterSpacing: 0.5 }}>
//         {label}
//       </Text>
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg,
//         borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 52,
//       }}>
//         <Ionicons name={icon as any} size={18} color={C.textSub} style={{ marginRight: 10 }} />
//         <TextInput
//           style={{ flex: 1, color: C.text, fontSize: 15 }}
//           placeholder={placeholder}
//           placeholderTextColor={C.textSub}
//           value={value}
//           onChangeText={onChangeText}
//           keyboardType={keyboardType}
//           autoCapitalize={autoCapitalize}
//           secureTextEntry={secureTextEntry}
//           autoCorrect={false}
//         />
//         {toggle && (
//           <TouchableOpacity onPress={toggle.onToggle} style={{ padding: 4 }}>
//             <Ionicons name={toggle.show ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSub} />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: '#0A0A0A' },
//   container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
//   backBtn: { width: 40, height: 40, justifyContent: 'center' },
//   header: { marginTop: 16, marginBottom: 36 },
//   title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
//   subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 6 },
//   form: {},
//   primaryBtn: {
//     backgroundColor: '#FF3B30',
//     borderRadius: 14,
//     height: 54,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
//   footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
//   footerText: { color: '#8E8E93', fontSize: 14 },
//   footerLink: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
// });

import { Colors, Typography } from "@/theme";
import React from "react";
import { Text, View } from "react-native";

export function SignupScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: Colors.textMuted, fontSize: Typography.base }}>
        SignupScreen
      </Text>
    </View>
  );
}
