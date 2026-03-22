// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { AuthStackParamList } from '../../navigation/AuthNavigator';

// type Props = {
//   navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
// };

// const C = {
//   bg: '#0A0A0A',
//   border: '#2C2C2E',
//   primary: '#FF3B30',
//   text: '#FFFFFF',
//   textSub: '#8E8E93',
//   inputBg: '#1C1C1E',
// };

// export default function ForgotPasswordScreen({ navigation }: Props) {
//   const [email, setEmail] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [sent, setSent] = useState(false);

//   const handleReset = async () => {
//     if (!email.trim()) return;
//     setLoading(true);
//     await new Promise(r => setTimeout(r, 1500));
//     setLoading(false);
//     setSent(true);
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <View style={styles.container}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//             <Ionicons name="arrow-back" size={24} color={C.text} />
//           </TouchableOpacity>

//           {!sent ? (
//             <>
//               <View style={styles.iconBox}>
//                 <Ionicons name="key-outline" size={36} color={C.primary} />
//               </View>
//               <Text style={styles.title}>Forgot Password?</Text>
//               <Text style={styles.subtitle}>
//                 Enter your email and we'll send you a reset link
//               </Text>

//               <Text style={styles.label}>Email Address</Text>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="mail-outline" size={18} color={C.textSub} style={{ marginRight: 10 }} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="you@example.com"
//                   placeholderTextColor={C.textSub}
//                   value={email}
//                   onChangeText={setEmail}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />
//               </View>

//               <TouchableOpacity
//                 style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
//                 onPress={handleReset}
//                 disabled={loading}
//                 activeOpacity={0.85}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.primaryBtnText}>SEND RESET LINK</Text>
//                 )}
//               </TouchableOpacity>
//             </>
//           ) : (
//             <>
//               <View style={[styles.iconBox, { backgroundColor: '#30D15822' }]}>
//                 <Ionicons name="checkmark-circle-outline" size={36} color="#30D158" />
//               </View>
//               <Text style={styles.title}>Check Your Email</Text>
//               <Text style={styles.subtitle}>
//                 We sent a password reset link to{'\n'}
//                 <Text style={{ color: C.text, fontWeight: '600' }}>{email}</Text>
//               </Text>
//               <TouchableOpacity
//                 style={styles.primaryBtn}
//                 onPress={() => navigation.navigate('Login')}
//                 activeOpacity={0.85}
//               >
//                 <Text style={styles.primaryBtnText}>BACK TO LOGIN</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: C.bg },
//   container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
//   backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: 32 },
//   iconBox: {
//     width: 72,
//     height: 72,
//     borderRadius: 20,
//     backgroundColor: '#FF3B3022',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   title: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 8 },
//   subtitle: { fontSize: 14, color: C.textSub, lineHeight: 21, marginBottom: 36 },
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
//     marginBottom: 28,
//   },
//   input: { flex: 1, color: C.text, fontSize: 15 },
//   primaryBtn: {
//     backgroundColor: C.primary,
//     borderRadius: 14,
//     height: 54,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
// });

import { Colors, Typography } from "@/theme";
import React from "react";
import { Text, View } from "react-native";

export function ForgotPasswordScreen() {
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
        ForgotPasswordScreen
      </Text>
    </View>
  );
}
