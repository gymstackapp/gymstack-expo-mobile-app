// // mobile/src/screens/onboarding/OnboardingScreen.tsx
// // 5-slide onboarding flow shown once on first install.
// // Slide 1 — Hook / identity
// // Slide 2 — Gym Owner (12+ features grid)
// // Slide 3 — Trainer
// // Slide 4 — Member
// // Slide 5 — Role picker → on pick, marks onboarding done + navigates to Signup
// //            with preselectedRole param so SignupScreen auto-sets role after register.
// //
// // Onboarding done flag is managed by useOnboardingStore
// // Once set, RootNavigator never shows this flow again.

// import { useOnboardingStore } from "@/store/onboardingStore";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useNavigation } from "@react-navigation/native";
// import React, { useRef, useState } from "react";
// import {
//     Animated,
//     Dimensions,
//     FlatList,
//     Image,
//     Platform,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import LinearGradient from "react-native-linear-gradient";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const { width: SW, height: SH } = Dimensions.get("window");
// const LOGO = require("../../../assets/images/logo.png");

// // ── Feature icon grid item ────────────────────────────────────────────────────
// function FeaturePill({
//   icon,
//   label,
//   color,
// }: {
//   icon: string;
//   label: string;
//   color: string;
// }) {
//   return (
//     <View style={fp.wrap}>
//       <View style={[fp.icon, { backgroundColor: color + "22" }]}>
//         <Icon name={icon} size={18} color={color} />
//       </View>
//       <Text style={fp.label} numberOfLines={2}>
//         {label}
//       </Text>
//     </View>
//   );
// }
// const fp = StyleSheet.create({
//   wrap: {
//     width: (SW - Spacing.lg * 2 - Spacing.sm * 2) / 3,
//     alignItems: "center",
//     gap: 5,
//     paddingVertical: Spacing.xs,
//   },
//   icon: {
//     width: 44,
//     height: 44,
//     borderRadius: Radius.lg,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   label: {
//     color: Colors.textSecondary,
//     fontSize: 10,
//     textAlign: "center",
//     lineHeight: 13,
//   },
// });

// // ── Per-slide data ────────────────────────────────────────────────────────────
// const OWNER_FEATURES = [
//   { icon: "account-group-outline", label: "Members", color: "#60a5fa" },
//   { icon: "credit-card-outline", label: "Payments", color: Colors.primary },
//   { icon: "calendar-check-outline", label: "Attendance", color: "#34d399" },
//   { icon: "account-tie-outline", label: "Trainers", color: "#a78bfa" },
//   { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
//   { icon: "food-apple-outline", label: "Diet Plans", color: "#34d399" },
//   { icon: "shopping-outline", label: "Supplements", color: "#facc15" },
//   { icon: "receipt-outline", label: "Expenses", color: "#f87171" },
//   { icon: "lock-outline", label: "Lockers", color: "#60a5fa" },
//   { icon: "chart-bar", label: "Reports", color: Colors.primary },
//   { icon: "bullhorn-outline", label: "Announcements", color: "#a78bfa" },
//   { icon: "gift-outline", label: "Refer & Earn", color: "#facc15" },
// ];

// const TRAINER_FEATURES = [
//   { icon: "account-group-outline", label: "Your Members", color: "#60a5fa" },
//   { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
//   { icon: "food-apple-outline", label: "Diet Plans", color: "#34d399" },
//   { icon: "calendar-check-outline", label: "Attendance", color: "#facc15" },
//   { icon: "bell-outline", label: "Notifications", color: "#a78bfa" },
//   { icon: "chart-line", label: "Progress", color: Colors.primary },
// ];

// const MEMBER_FEATURES = [
//   { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
//   { icon: "food-apple-outline", label: "Diet & Nutrition", color: "#34d399" },
//   { icon: "fire", label: "Streaks", color: Colors.primary },
//   { icon: "calendar-check-outline", label: "Check-in", color: "#60a5fa" },
//   { icon: "credit-card-outline", label: "Payments", color: "#a78bfa" },
//   { icon: "shopping-outline", label: "Supplements", color: "#facc15" },
//   { icon: "bullhorn-outline", label: "Announcements", color: "#f87171" },
//   { icon: "trophy-outline", label: "Milestones", color: "#facc15" },
//   { icon: "gift-outline", label: "Refer & Earn", color: "#34d399" },
// ];

// // ── Slides ────────────────────────────────────────────────────────────────────
// const SLIDES = [
//   { id: "hook" },
//   { id: "owner" },
//   { id: "trainer" },
//   { id: "member" },
//   { id: "pick" },
// ] as const;

// type SlideId = (typeof SLIDES)[number]["id"];

// // ── Slide components ──────────────────────────────────────────────────────────

// function SlideHook() {
//   return (
//     <View style={sl.wrap}>
//       <Image source={LOGO} style={sl.logo} resizeMode="contain" />
//       <View style={sl.textBlock}>
//         <Text style={sl.tagline}>Run smarter.</Text>
//         <Text style={[sl.tagline, { color: Colors.primary }]}>
//           Train harder.
//         </Text>
//       </View>
//       <Text style={sl.sub}>
//         The complete gym management platform — built for owners, trainers, and
//         members.
//       </Text>
//       <View style={sl.roleRow}>
//         {[
//           { icon: "office-building-outline", label: "Gym Owners" },
//           { icon: "account-tie-outline", label: "Trainers" },
//           { icon: "account-outline", label: "Members" },
//         ].map((r) => (
//           <View key={r.label} style={sl.roleChip}>
//             <Icon name={r.icon} size={16} color={Colors.primary} />
//             <Text style={sl.roleLabel}>{r.label}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// function SlideOwner() {
//   return (
//     <View style={sl.wrap}>
//       <View style={sl.headerRow}>
//         <View style={sl.badge}>
//           <Icon
//             name="office-building-outline"
//             size={18}
//             color={Colors.primary}
//           />
//         </View>
//         <View>
//           <Text style={sl.roleTitle}>Gym Owners</Text>
//           <Text style={sl.roleSub}>
//             Everything your gym needs, in your pocket
//           </Text>
//         </View>
//       </View>

//       <Text style={sl.featureCount}>12+ tools. One app. No spreadsheets.</Text>

//       <View style={sl.featureGrid}>
//         {OWNER_FEATURES.map((f) => (
//           <FeaturePill key={f.label} {...f} />
//         ))}
//       </View>

//       <View style={sl.highlight}>
//         <Icon name="trending-up" size={14} color={Colors.primary} />
//         <Text style={sl.highlightTxt}>
//           Track revenue, expenses & net profit across all your gyms in one
//           dashboard
//         </Text>
//       </View>
//     </View>
//   );
// }

// function SlideTrainer() {
//   return (
//     <View style={sl.wrap}>
//       <View style={sl.headerRow}>
//         <View style={[sl.badge, { backgroundColor: "#a78bfa20" }]}>
//           <Icon name="account-tie-outline" size={18} color="#a78bfa" />
//         </View>
//         <View>
//           <Text style={sl.roleTitle}>Trainers</Text>
//           <Text style={sl.roleSub}>Your members. Your plans. Your impact.</Text>
//         </View>
//       </View>

//       <View style={sl.featureGrid}>
//         {TRAINER_FEATURES.map((f) => (
//           <FeaturePill key={f.label} {...f} />
//         ))}
//       </View>

//       {/* 3-step workflow */}
//       <View style={sl.stepsWrap}>
//         {[
//           {
//             n: "1",
//             title: "See your members",
//             sub: "All assigned members in one place",
//           },
//           {
//             n: "2",
//             title: "Build plans",
//             sub: "Create personalised workout & diet plans",
//           },
//           {
//             n: "3",
//             title: "Track progress",
//             sub: "Follow attendance, streaks & milestones",
//           },
//         ].map((step) => (
//           <View key={step.n} style={sl.step}>
//             <View style={sl.stepNum}>
//               <Text style={sl.stepNumTxt}>{step.n}</Text>
//             </View>
//             <View>
//               <Text style={sl.stepTitle}>{step.title}</Text>
//               <Text style={sl.stepSub}>{step.sub}</Text>
//             </View>
//           </View>
//         ))}
//       </View>

//       <View style={sl.highlight}>
//         <Icon name="check-circle-outline" size={14} color="#a78bfa" />
//         <Text style={[sl.highlightTxt, { color: "#a78bfa" }]}>
//           Stop managing WhatsApp groups. Start coaching.
//         </Text>
//       </View>
//     </View>
//   );
// }

// function SlideMember() {
//   return (
//     <View style={sl.wrap}>
//       <View style={sl.headerRow}>
//         <View style={[sl.badge, { backgroundColor: "#34d39920" }]}>
//           <Icon name="account-outline" size={18} color="#34d399" />
//         </View>
//         <View>
//           <Text style={sl.roleTitle}>Members</Text>
//           <Text style={sl.roleSub}>Your gym. Your progress. Your goals.</Text>
//         </View>
//       </View>

//       <View style={sl.featureGrid}>
//         {MEMBER_FEATURES.map((f) => (
//           <FeaturePill key={f.label} {...f} />
//         ))}
//       </View>

//       {/* Day in the life */}
//       <View style={sl.stepsWrap}>
//         {[
//           {
//             icon: "weather-sunny",
//             time: "Morning",
//             txt: "Check today's workout & meals",
//           },
//           {
//             icon: "lightning-bolt",
//             time: "At Gym",
//             txt: "Check in & extend your streak",
//           },
//           {
//             icon: "chart-line",
//             time: "Anytime",
//             txt: "View progress, payments & announcements",
//           },
//         ].map((item) => (
//           <View key={item.time} style={sl.step}>
//             <View style={[sl.stepNum, { backgroundColor: "#34d39920" }]}>
//               <Icon name={item.icon} size={14} color="#34d399" />
//             </View>
//             <View>
//               <Text style={sl.stepTitle}>{item.time}</Text>
//               <Text style={sl.stepSub}>{item.txt}</Text>
//             </View>
//           </View>
//         ))}
//       </View>

//       <View
//         style={[
//           sl.highlight,
//           { backgroundColor: "#34d39912", borderColor: "#34d39930" },
//         ]}
//       >
//         <Icon name="check-circle-outline" size={14} color="#34d399" />
//         <Text style={[sl.highlightTxt, { color: "#34d399" }]}>
//           Free to join — your gym owner adds you
//         </Text>
//       </View>
//     </View>
//   );
// }

// function SlidePick({
//   onPickRole,
// }: {
//   onPickRole: (role: "owner" | "trainer" | "member" | null) => void;
// }) {
//   return (
//     <View style={sl.wrap}>
//       <Image source={LOGO} style={sl.logoSmall} resizeMode="contain" />
//       <Text style={sl.pickTitle}>Who are you?</Text>
//       <Text style={sl.pickSub}>We'll personalise your experience</Text>

//       <View style={sl.pickGrid}>
//         {[
//           {
//             role: "owner" as const,
//             icon: "office-building-outline",
//             label: "Gym Owner",
//             sub: "Manage your gym & business",
//             color: Colors.primary,
//             bg: Colors.primaryFaded,
//           },
//           {
//             role: "trainer" as const,
//             icon: "account-tie-outline",
//             label: "Trainer",
//             sub: "Coach your assigned members",
//             color: "#a78bfa",
//             bg: "#a78bfa18",
//           },
//           {
//             role: "member" as const,
//             icon: "account-outline",
//             label: "Member",
//             sub: "Track workouts, diet & progress",
//             color: "#34d399",
//             bg: "#34d39918",
//           },
//         ].map((opt) => (
//           <TouchableOpacity
//             key={opt.role}
//             style={[
//               sl.pickCard,
//               { borderColor: opt.color + "40", backgroundColor: opt.bg },
//             ]}
//             onPress={() => onPickRole(opt.role)}
//             activeOpacity={0.8}
//           >
//             <View style={[sl.pickIcon, { backgroundColor: opt.color + "25" }]}>
//               <Icon name={opt.icon} size={28} color={opt.color} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={[sl.pickLabel, { color: opt.color }]}>
//                 {opt.label}
//               </Text>
//               <Text style={sl.pickCardSub}>{opt.sub}</Text>
//             </View>
//             <Icon name="arrow-right" size={18} color={opt.color} />
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity onPress={() => onPickRole(null)} style={sl.signInLink}>
//         <Text style={sl.signInTxt}>Already have an account? </Text>
//         <Text
//           style={[sl.signInTxt, { color: Colors.primary, fontWeight: "700" }]}
//         >
//           Sign In
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// // ── Main screen ───────────────────────────────────────────────────────────────
// export function OnboardingScreen() {
//   const navigation = useNavigation<any>();
//   const flatRef = useRef<FlatList>(null);
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const [index, setIndex] = useState(0);

//   // markOnboardingDone updates Zustand state FIRST (synchronously),
//   // then persists to AsyncStorage. This means RootNavigator's useEffect
//   // sees seenOnboarding = true immediately and resolveTarget stops
//   // returning "Onboarding" — so it will never fight against navigation.reset.
//   const { markOnboardingDone } = useOnboardingStore();
//   const markDone = markOnboardingDone;

//   const goToSlide = (i: number) => {
//     flatRef.current?.scrollToIndex({ index: i, animated: true });
//   };

//   const handleNext = () => {
//     if (index < SLIDES.length - 1) goToSlide(index + 1);
//   };

//   const handlePickRole = async (
//     role: "owner" | "trainer" | "member" | null,
//   ) => {
//     // Mark onboarding done BEFORE navigating so RootNavigator never
//     // sends the user back to Onboarding if it re-evaluates state mid-transition.
//     await markDone();

//     if (role === null) {
//       // "Already have an account? Sign in" — go to Login, no role needed
//       navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//     } else {
//       // Navigate to Signup and pass preselectedRole so SignupScreen can
//       // automatically call set-role after registration, skipping SelectRoleScreen.
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: "Signup",
//             params: { preselectedRole: role },
//           },
//         ],
//       });
//     }
//   };

//   const handleSkip = async () => {
//     // User skipped — mark done and go to Login.
//     // They will see SelectRoleScreen after signing up (normal flow).
//     await markDone();
//     navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//   };

//   const slideComponents: Record<SlideId, React.ReactNode> = {
//     hook: <SlideHook />,
//     owner: <SlideOwner />,
//     trainer: <SlideTrainer />,
//     member: <SlideMember />,
//     pick: <SlidePick onPickRole={handlePickRole} />,
//   };

//   const isLast = index === SLIDES.length - 1;

//   return (
//     <SafeAreaView style={ob.safe} edges={["top", "bottom"]}>
//       {/* Skip button (hidden on last slide) */}
//       {!isLast && (
//         <TouchableOpacity style={ob.skip} onPress={handleSkip}>
//           <Text style={ob.skipTxt}>Skip</Text>
//         </TouchableOpacity>
//       )}

//       {/* Slides */}
//       <Animated.FlatList
//         ref={flatRef}
//         data={SLIDES}
//         keyExtractor={(item) => item.id}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         scrollEventThrottle={16}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false },
//         )}
//         onMomentumScrollEnd={(e) => {
//           const i = Math.round(e.nativeEvent.contentOffset.x / SW);
//           setIndex(i);
//         }}
//         renderItem={({ item }: { item: { id: SlideId } }) => (
//           <View style={{ width: SW, flex: 1 }}>
//             <View style={ob.slideWrap}>{slideComponents[item.id]}</View>
//           </View>
//         )}
//       />

//       {/* Bottom bar — dots + next button */}
//       {!isLast && (
//         <View style={ob.bottom}>
//           {/* Dot indicators */}
//           <View style={ob.dots}>
//             {SLIDES.map((_, i) => {
//               const inputRange = [(i - 1) * SW, i * SW, (i + 1) * SW];
//               const width = scrollX.interpolate({
//                 inputRange,
//                 outputRange: [8, 20, 8],
//                 extrapolate: "clamp",
//               });
//               const opacity = scrollX.interpolate({
//                 inputRange,
//                 outputRange: [0.3, 1, 0.3],
//                 extrapolate: "clamp",
//               });
//               return (
//                 <Animated.View key={i} style={[ob.dot, { width, opacity }]} />
//               );
//             })}
//           </View>

//           {/* Next button */}
//           <TouchableOpacity
//             style={ob.nextBtn}
//             onPress={handleNext}
//             activeOpacity={0.85}
//           >
//             <LinearGradient
//               colors={[Colors.primary, "#ea580c"]}
//               style={ob.nextGrad}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//             >
//               <Text style={ob.nextTxt}>Next</Text>
//               <Icon name="arrow-right" size={18} color="#fff" />
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// // ── Shared slide styles ───────────────────────────────────────────────────────
// const sl = StyleSheet.create({
//   wrap: {
//     flex: 1,
//     paddingHorizontal: Spacing.lg,
//     paddingTop: Spacing.xl,
//     gap: Spacing.lg,
//   },
//   logo: { width: SW * 0.55, height: SW * 0.55, alignSelf: "center" },
//   logoSmall: { width: SW * 0.35, height: SW * 0.35, alignSelf: "center" },
//   textBlock: { alignItems: "center", gap: 2 },
//   tagline: {
//     color: Colors.textPrimary,
//     fontSize: 36,
//     fontWeight: "900",
//     textAlign: "center",
//     lineHeight: 42,
//   },
//   sub: {
//     color: Colors.textMuted,
//     fontSize: Typography.base,
//     textAlign: "center",
//     lineHeight: 24,
//   },
//   roleRow: {
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: Spacing.md,
//     flexWrap: "wrap",
//   },
//   roleChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.full,
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderWidth: 1,
//     borderColor: Colors.primary + "30",
//   },
//   roleLabel: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "700",
//   },
//   // Owner / Trainer / Member slides
//   headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
//   badge: {
//     width: 48,
//     height: 48,
//     borderRadius: Radius.xl,
//     backgroundColor: Colors.primaryFaded,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   roleTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xl,
//     fontWeight: "800",
//   },
//   roleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   featureCount: {
//     color: Colors.textSecondary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
//   highlight: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: Spacing.sm,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.lg,
//     padding: Spacing.md,
//     borderWidth: 1,
//     borderColor: Colors.primary + "30",
//   },
//   highlightTxt: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     lineHeight: 18,
//     flex: 1,
//   },
//   // Steps
//   stepsWrap: { gap: Spacing.md },
//   step: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
//   stepNum: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.primaryFaded,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   stepNumTxt: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "800",
//   },
//   stepTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//   },
//   stepSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: 2,
//     lineHeight: 17,
//   },
//   // Pick slide
//   pickTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: "900",
//     textAlign: "center",
//   },
//   pickSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     marginTop: -Spacing.sm,
//   },
//   pickGrid: { gap: Spacing.md },
//   pickCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     borderRadius: Radius.xl,
//     borderWidth: 1.5,
//     padding: Spacing.lg,
//   },
//   pickIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: Radius.xl,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   pickLabel: { fontSize: Typography.base, fontWeight: "800" },
//   pickCardSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: 3,
//     lineHeight: 17,
//   },
//   signInLink: {
//     flexDirection: "row",
//     justifyContent: "center",
//     paddingBottom: Spacing.md,
//   },
//   signInTxt: { color: Colors.textMuted, fontSize: Typography.sm },
// });

// // ── Onboarding chrome styles ──────────────────────────────────────────────────
// const ob = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   skip: {
//     position: "absolute",
//     top: Platform.OS === "ios" ? 54 : 16,
//     right: Spacing.lg,
//     zIndex: 10,
//     padding: Spacing.sm,
//   },
//   skipTxt: { color: Colors.textMuted, fontSize: Typography.sm },
//   slideWrap: { flex: 1 },
//   bottom: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: Spacing.lg,
//     paddingBottom: Spacing.xl,
//     paddingTop: Spacing.md,
//   },
//   dots: { flexDirection: "row", alignItems: "center", gap: 6 },
//   dot: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
//   nextBtn: { borderRadius: Radius.full, overflow: "hidden" },
//   nextGrad: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     paddingHorizontal: Spacing.xl,
//     paddingVertical: 14,
//   },
//   nextTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "800" },
// });

// mobile/src/screens/onboarding/OnboardingScreen.tsx
// 5-slide onboarding flow shown once on first install.
// Slide 1 — Hook / identity
// Slide 2 — Gym Owner (12+ features grid)
// Slide 3 — Trainer
// Slide 4 — Member
// Slide 5 — Role picker → on pick, marks onboarding done + navigates to Signup
//            with preselectedRole param so SignupScreen auto-sets role after register.
//
// Onboarding done flag is managed by useOnboardingStore
// Once set, RootNavigator never shows this flow again.

import { useOnboardingStore } from "@/store/onboardingStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW, height: SH } = Dimensions.get("window");
const LOGO = require("../../../assets/images/logo.png");

// ── Feature icon grid item ────────────────────────────────────────────────────
function FeaturePill({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={fp.wrap}>
      <View style={[fp.icon, { backgroundColor: color + "22" }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={fp.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
const fp = StyleSheet.create({
  wrap: {
    width: (SW - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    alignItems: "center",
    gap: 5,
    paddingVertical: Spacing.xs,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
});

// ── Per-slide data ────────────────────────────────────────────────────────────
const OWNER_FEATURES = [
  { icon: "account-group-outline", label: "Members", color: "#60a5fa" },
  { icon: "credit-card-outline", label: "Payments", color: Colors.primary },
  { icon: "calendar-check-outline", label: "Attendance", color: "#34d399" },
  { icon: "account-tie-outline", label: "Trainers", color: "#a78bfa" },
  { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
  { icon: "food-apple-outline", label: "Diet Plans", color: "#34d399" },
  { icon: "shopping-outline", label: "Supplements", color: "#facc15" },
  { icon: "receipt-outline", label: "Expenses", color: "#f87171" },
  { icon: "locker-outline", label: "Lockers", color: "#60a5fa" },
  { icon: "chart-bar", label: "Reports", color: Colors.primary },
  { icon: "bullhorn-outline", label: "Announcements", color: "#a78bfa" },
  { icon: "gift-outline", label: "Refer & Earn", color: "#facc15" },
];

const TRAINER_FEATURES = [
  { icon: "account-group-outline", label: "Your Members", color: "#60a5fa" },
  { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
  { icon: "food-apple-outline", label: "Diet Plans", color: "#34d399" },
  { icon: "calendar-check-outline", label: "Attendance", color: "#facc15" },
  { icon: "bell-outline", label: "Notifications", color: "#a78bfa" },
  { icon: "chart-line", label: "Progress", color: Colors.primary },
];

const MEMBER_FEATURES = [
  { icon: "dumbbell", label: "Workout Plans", color: Colors.primary },
  { icon: "food-apple-outline", label: "Diet & Nutrition", color: "#34d399" },
  { icon: "fire", label: "Streaks", color: Colors.primary },
  { icon: "calendar-check-outline", label: "Check-in", color: "#60a5fa" },
  { icon: "credit-card-outline", label: "Payments", color: "#a78bfa" },
  { icon: "shopping-outline", label: "Supplements", color: "#facc15" },
  { icon: "bullhorn-outline", label: "Announcements", color: "#f87171" },
  { icon: "trophy-outline", label: "Milestones", color: "#facc15" },
  { icon: "gift-outline", label: "Refer & Earn", color: "#34d399" },
];

// ── Slides ────────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: "hook" },
  { id: "owner" },
  { id: "trainer" },
  { id: "member" },
  { id: "pick" },
] as const;

type SlideId = (typeof SLIDES)[number]["id"];

// ── Slide components ──────────────────────────────────────────────────────────

function SlideHook() {
  return (
    <View style={sl.wrap}>
      <Image source={LOGO} style={sl.logo} resizeMode="contain" />
      <View style={sl.textBlock}>
        <Text style={sl.tagline}>Run smarter.</Text>
        <Text style={[sl.tagline, { color: Colors.primary }]}>
          Train harder.
        </Text>
      </View>
      <Text style={sl.sub}>
        The complete gym management platform — built for owners, trainers, and
        members.
      </Text>
      <View style={sl.roleRow}>
        {[
          { icon: "office-building-outline", label: "Gym Owners" },
          { icon: "account-tie-outline", label: "Trainers" },
          { icon: "account-outline", label: "Members" },
        ].map((r) => (
          <View key={r.label} style={sl.roleChip}>
            <Icon name={r.icon} size={16} color={Colors.primary} />
            <Text style={sl.roleLabel}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SlideOwner() {
  return (
    <View style={sl.wrap}>
      <View style={sl.headerRow}>
        <View style={sl.badge}>
          <Icon
            name="office-building-outline"
            size={18}
            color={Colors.primary}
          />
        </View>
        <View>
          <Text style={sl.roleTitle}>Gym Owners</Text>
          <Text style={sl.roleSub}>
            Everything your gym needs, in your pocket
          </Text>
        </View>
      </View>

      <Text style={sl.featureCount}>12+ tools. One app. No spreadsheets.</Text>

      <View style={sl.featureGrid}>
        {OWNER_FEATURES.map((f) => (
          <FeaturePill key={f.label} {...f} />
        ))}
      </View>

      <View style={sl.highlight}>
        <Icon name="trending-up" size={14} color={Colors.primary} />
        <Text style={sl.highlightTxt}>
          Track revenue, expenses & net profit across all your gyms in one
          dashboard
        </Text>
      </View>
    </View>
  );
}

function SlideTrainer() {
  return (
    <View style={sl.wrap}>
      <View style={sl.headerRow}>
        <View style={[sl.badge, { backgroundColor: "#a78bfa20" }]}>
          <Icon name="account-tie-outline" size={18} color="#a78bfa" />
        </View>
        <View>
          <Text style={sl.roleTitle}>Trainers</Text>
          <Text style={sl.roleSub}>Your members. Your plans. Your impact.</Text>
        </View>
      </View>

      <View style={sl.featureGrid}>
        {TRAINER_FEATURES.map((f) => (
          <FeaturePill key={f.label} {...f} />
        ))}
      </View>

      {/* 3-step workflow */}
      <View style={sl.stepsWrap}>
        {[
          {
            n: "1",
            title: "See your members",
            sub: "All assigned members in one place",
          },
          {
            n: "2",
            title: "Build plans",
            sub: "Create personalised workout & diet plans",
          },
          {
            n: "3",
            title: "Track progress",
            sub: "Follow attendance, streaks & milestones",
          },
        ].map((step) => (
          <View key={step.n} style={sl.step}>
            <View style={sl.stepNum}>
              <Text style={sl.stepNumTxt}>{step.n}</Text>
            </View>
            <View>
              <Text style={sl.stepTitle}>{step.title}</Text>
              <Text style={sl.stepSub}>{step.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={sl.highlight}>
        <Icon name="check-circle-outline" size={14} color="#a78bfa" />
        <Text style={[sl.highlightTxt, { color: "#a78bfa" }]}>
          Stop managing WhatsApp groups. Start coaching.
        </Text>
      </View>
    </View>
  );
}

function SlideMember() {
  return (
    <View style={sl.wrap}>
      <View style={sl.headerRow}>
        <View style={[sl.badge, { backgroundColor: "#34d39920" }]}>
          <Icon name="account-outline" size={18} color="#34d399" />
        </View>
        <View>
          <Text style={sl.roleTitle}>Members</Text>
          <Text style={sl.roleSub}>Your gym. Your progress. Your goals.</Text>
        </View>
      </View>

      <View style={sl.featureGrid}>
        {MEMBER_FEATURES.map((f) => (
          <FeaturePill key={f.label} {...f} />
        ))}
      </View>

      {/* Day in the life */}
      <View style={sl.stepsWrap}>
        {[
          {
            icon: "weather-sunny",
            time: "Morning",
            txt: "Check today's workout & meals",
          },
          {
            icon: "lightning-bolt",
            time: "At Gym",
            txt: "Check in & extend your streak",
          },
          {
            icon: "chart-line",
            time: "Anytime",
            txt: "View progress, payments & announcements",
          },
        ].map((item) => (
          <View key={item.time} style={sl.step}>
            <View style={[sl.stepNum, { backgroundColor: "#34d39920" }]}>
              <Icon name={item.icon} size={14} color="#34d399" />
            </View>
            <View>
              <Text style={sl.stepTitle}>{item.time}</Text>
              <Text style={sl.stepSub}>{item.txt}</Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={[
          sl.highlight,
          { backgroundColor: "#34d39912", borderColor: "#34d39930" },
        ]}
      >
        <Icon name="check-circle-outline" size={14} color="#34d399" />
        <Text style={[sl.highlightTxt, { color: "#34d399" }]}>
          Free to join — your gym owner adds you
        </Text>
      </View>
    </View>
  );
}

function SlidePick({
  onPickRole,
}: {
  onPickRole: (role: "owner" | "trainer" | "member" | null) => void;
}) {
  return (
    <View style={sl.wrap}>
      <Image source={LOGO} style={sl.logoSmall} resizeMode="contain" />
      <Text style={sl.pickTitle}>Who are you?</Text>
      <Text style={sl.pickSub}>We'll personalise your experience</Text>

      <View style={sl.pickGrid}>
        {[
          {
            role: "owner" as const,
            icon: "office-building-outline",
            label: "Gym Owner",
            sub: "Manage your gym & business",
            color: Colors.primary,
            bg: Colors.primaryFaded,
          },
          {
            role: "trainer" as const,
            icon: "account-tie-outline",
            label: "Trainer",
            sub: "Coach your assigned members",
            color: "#a78bfa",
            bg: "#a78bfa18",
          },
          {
            role: "member" as const,
            icon: "account-outline",
            label: "Member",
            sub: "Track workouts, diet & progress",
            color: "#34d399",
            bg: "#34d39918",
          },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.role}
            style={[
              sl.pickCard,
              { borderColor: opt.color + "40", backgroundColor: opt.bg },
            ]}
            onPress={() => onPickRole(opt.role)}
            activeOpacity={0.8}
          >
            <View style={[sl.pickIcon, { backgroundColor: opt.color + "25" }]}>
              <Icon name={opt.icon} size={28} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sl.pickLabel, { color: opt.color }]}>
                {opt.label}
              </Text>
              <Text style={sl.pickCardSub}>{opt.sub}</Text>
            </View>
            <Icon name="arrow-right" size={18} color={opt.color} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => onPickRole(null)} style={sl.signInLink}>
        <Text style={sl.signInTxt}>Already have an account? </Text>
        <Text
          style={[sl.signInTxt, { color: Colors.primary, fontWeight: "700" }]}
        >
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  // NO navigation.reset() calls in this screen.
  // We update onboardingStore; RootNavigator reacts and routes automatically.
  const { setPendingRoleAndFinish, finishWithoutRole } = useOnboardingStore();

  const goToSlide = (i: number) => {
    flatRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) goToSlide(index + 1);
  };

  const handlePickRole = async (
    role: "owner" | "trainer" | "member" | null,
  ) => {
    if (role === null) {
      // "Already have an account? Sign in" — finish with no pending role
      // resolveTarget: seenOnboarding=true, pendingRole=null, profile=null → "Login"
      await finishWithoutRole();
    } else {
      // User picked a role — store it and mark onboarding done
      // resolveTarget: seenOnboarding=true, pendingRole="owner" etc → "Signup"
      // SignupScreen reads pendingRole from store (not from nav params)
      await setPendingRoleAndFinish(role);
    }
    // RootNavigator drives navigation — no reset() call here
  };

  const handleSkip = async () => {
    // Skipped onboarding — no pending role, go to Login
    await finishWithoutRole();
  };

  const slideComponents: Record<SlideId, React.ReactNode> = {
    hook: <SlideHook />,
    owner: <SlideOwner />,
    trainer: <SlideTrainer />,
    member: <SlideMember />,
    pick: <SlidePick onPickRole={handlePickRole} />,
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={ob.safe} edges={["top", "bottom"]}>
      {/* Skip button (hidden on last slide) */}
      {!isLast && (
        <TouchableOpacity style={ob.skip} onPress={handleSkip}>
          <Text style={ob.skipTxt}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SW);
          setIndex(i);
        }}
        renderItem={({ item }: { item: { id: SlideId } }) => (
          <View style={{ width: SW, flex: 1 }}>
            <View style={ob.slideWrap}>{slideComponents[item.id]}</View>
          </View>
        )}
      />

      {/* Bottom bar — dots + next button */}
      {!isLast && (
        <View style={ob.bottom}>
          {/* Dot indicators */}
          <View style={ob.dots}>
            {SLIDES.map((_, i) => {
              const inputRange = [(i - 1) * SW, i * SW, (i + 1) * SW];
              const width = scrollX.interpolate({
                inputRange,
                outputRange: [8, 20, 8],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <Animated.View key={i} style={[ob.dot, { width, opacity }]} />
              );
            })}
          </View>

          {/* Next button */}
          <TouchableOpacity
            style={ob.nextBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, "#ea580c"]}
              style={ob.nextGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={ob.nextTxt}>Next</Text>
              <Icon name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Shared slide styles ───────────────────────────────────────────────────────
const sl = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  logo: { width: SW * 0.55, height: SW * 0.55, alignSelf: "center" },
  logoSmall: { width: SW * 0.35, height: SW * 0.35, alignSelf: "center" },
  textBlock: { alignItems: "center", gap: 2 },
  tagline: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 42,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    textAlign: "center",
    lineHeight: 24,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  roleLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  // Owner / Trainer / Member slides
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  badge: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
  },
  roleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  featureCount: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  highlight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  highlightTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    lineHeight: 18,
    flex: 1,
  },
  // Steps
  stepsWrap: { gap: Spacing.md },
  step: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "800",
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  stepSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
    lineHeight: 17,
  },
  // Pick slide
  pickTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "900",
    textAlign: "center",
  },
  pickSub: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    marginTop: -Spacing.sm,
  },
  pickGrid: { gap: Spacing.md },
  pickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
  },
  pickIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pickLabel: { fontSize: Typography.base, fontWeight: "800" },
  pickCardSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 3,
    lineHeight: 17,
  },
  signInLink: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: Spacing.md,
  },
  signInTxt: { color: Colors.textMuted, fontSize: Typography.sm },
});

// ── Onboarding chrome styles ──────────────────────────────────────────────────
const ob = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  skip: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 16,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  slideWrap: { flex: 1 },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  nextBtn: { borderRadius: Radius.full, overflow: "hidden" },
  nextGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  nextTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "800" },
});
