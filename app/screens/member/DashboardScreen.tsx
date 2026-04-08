// // mobile/src/screens/member/DashboardScreen.tsx
// import { memberAttendanceApi, memberDashboardApi } from "@/api/endpoints";
// import { Avatar, Card, Skeleton } from "@/components";
// import { useAuthStore } from "@/store/authStore";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { DrawerActions, useNavigation } from "@react-navigation/native";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import React, { useMemo } from "react";
// import {
//   Dimensions,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const { width: SCREEN_W } = Dimensions.get("window");

// // ── Milestone config ──────────────────────────────────────────────────────────
// const MILESTONES: Record<number, { emoji: string; label: string }> = {
//   7: { emoji: "🔥", label: "7-Day Streak" },
//   14: { emoji: "⚡", label: "2-Week Warrior" },
//   30: { emoji: "🏆", label: "Consistency King" },
//   60: { emoji: "💪", label: "60-Day Champ" },
//   100: { emoji: "👑", label: "100-Day Legend" },
//   180: { emoji: "🌟", label: "180-Day Elite" },
//   365: { emoji: "🎖️", label: "1-Year Titan" },
// };

// // ── Mini attendance chart (last 7 days bars) ──────────────────────────────────
// function WeekBars({ attendance }: { attendance: any[] }) {
//   const days = useMemo(() => {
//     const result = [];
//     for (let i = 6; i >= 0; i--) {
//       const d = new Date();
//       d.setDate(d.getDate() - i);
//       const key = d.toDateString();
//       const hit = attendance.some(
//         (a) => new Date(a.checkInTime).toDateString() === key,
//       );
//       result.push({
//         label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
//         hit,
//         isToday: i === 0,
//       });
//     }
//     return result;
//   }, [attendance]);

//   return (
//     <View style={wb.row}>
//       {days.map((d, i) => (
//         <View key={i} style={wb.col}>
//           <View
//             style={[wb.bar, d.hit && wb.barFilled, d.isToday && wb.barToday]}
//           />
//           <Text style={[wb.lbl, d.isToday && { color: Colors.primary }]}>
//             {d.label}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// }
// const wb = StyleSheet.create({
//   row: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
//   col: { flex: 1, alignItems: "center", gap: 4 },
//   bar: {
//     width: "100%",
//     height: 32,
//     borderRadius: 6,
//     backgroundColor: Colors.surfaceRaised,
//   },
//   barFilled: { backgroundColor: Colors.primary + "60", height: 48 },
//   barToday: { borderWidth: 1.5, borderColor: Colors.primary },
//   lbl: { color: Colors.textMuted, fontSize: 9, fontWeight: "600" },
// });

// // ── Calorie mini-bar ──────────────────────────────────────────────────────────
// function CalorieBar({
//   consumed,
//   target,
// }: {
//   consumed: number;
//   target: number;
// }) {
//   const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
//   const color =
//     pct > 0.9 ? Colors.error : pct > 0.6 ? Colors.warning : Colors.success;
//   return (
//     <View>
//       <View
//         style={{
//           flexDirection: "row",
//           justifyContent: "space-between",
//           marginBottom: 6,
//         }}
//       >
//         <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>
//           Calories today
//         </Text>
//         <Text style={{ color, fontSize: Typography.xs, fontWeight: "700" }}>
//           {consumed} / {target} kcal
//         </Text>
//       </View>
//       <View
//         style={{
//           height: 6,
//           backgroundColor: Colors.surfaceRaised,
//           borderRadius: 3,
//           overflow: "hidden",
//         }}
//       >
//         <View
//           style={{
//             width: `${pct * 100}%`,
//             height: "100%",
//             backgroundColor: color,
//             borderRadius: 3,
//           }}
//         />
//       </View>
//     </View>
//   );
// }

// // ── Quick stat pill ───────────────────────────────────────────────────────────
// function StatPill({
//   icon,
//   value,
//   label,
//   color,
// }: {
//   icon: string;
//   value: string | number;
//   label: string;
//   color: string;
// }) {
//   return (
//     <View style={[sp.pill, { borderColor: color + "25" }]}>
//       <Icon name={icon} size={16} color={color} />
//       <Text style={[sp.val, { color }]}>{value}</Text>
//       <Text style={sp.lbl}>{label}</Text>
//     </View>
//   );
// }
// const sp = StyleSheet.create({
//   pill: {
//     flex: 1,
//     alignItems: "center",
//     gap: 3,
//     backgroundColor: Colors.surface,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     paddingVertical: Spacing.md,
//     paddingHorizontal: Spacing.sm,
//   },
//   val: { fontSize: Typography.lg, fontWeight: "800" },
//   lbl: {
//     color: Colors.textMuted,
//     fontSize: 9,
//     fontWeight: "600",
//     textAlign: "center",
//   },
// });

// // ── Main screen ───────────────────────────────────────────────────────────────
// export default function MemberDashboardScreen() {
//   const navigation = useNavigation<any>();
//   const { profile } = useAuthStore();
//   const qc = useQueryClient();

//   const { data, isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["memberDashboard"],
//     queryFn: memberDashboardApi.get,
//     staleTime: 60_000,
//   });

//   const checkInMutation = useMutation({
//     mutationFn: memberAttendanceApi.checkIn,
//     onSuccess: (res: any) => {
//       qc.invalidateQueries({ queryKey: ["memberDashboard"] });
//       qc.invalidateQueries({ queryKey: ["memberAttendance"] });
//       const m: number[] = res.newMilestones ?? [];
//       if (m.length > 0) {
//         const cfg = MILESTONES[Math.max(...m)];
//         Toast.show({
//           type: "success",
//           text1: `${cfg?.emoji} ${cfg?.label}!`,
//           text2: "Keep it up!",
//           position: "top",
//         });
//       } else {
//         Toast.show({
//           type: "success",
//           text1: res.message ?? "Checked in! 🔥",
//           position: "top",
//         });
//       }
//     },
//     onError: (err: any) => {
//       Toast.show({
//         type: "error",
//         text1: err?.message ?? "Check-in failed",
//         position: "top",
//       });
//     },
//   });

//   const firstName = profile?.fullName?.split(" ")[0] ?? "there";
//   const active = data?.activeMembership;
//   const streak = data?.streak ?? { current: 0, longest: 0, total: 0 };
//   const stats = data?.stats ?? {};
//   const checkedInToday = data?.checkedInToday ?? false;
//   const milestones = data?.milestones ?? [];
//   const recentAttendance = data?.recentAttendance ?? [];

//   // Workout summary — pick first plan, show today's exercises
//   const workoutPlans: any[] = []; // placeholder — pull from dashboard if API adds it
//   const todayName = [
//     "Sunday",
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//   ][new Date().getDay()];

//   // Diet calorie estimate from today's meals
//   const todayCaloriesConsumed = 0; // will fill from diet API when integrated
//   const calorieTarget = 2000;

//   return (
//     <SafeAreaView style={s.safe} edges={["top"]}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefetching}
//             onRefresh={refetch}
//             tintColor={Colors.primary}
//             colors={[Colors.primary]}
//           />
//         }
//       >
//         {/* ── Header ─────────────────────────────────────── */}
//         <View style={s.header}>
//           <TouchableOpacity
//             onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
//             hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//             style={s.menuBtn}
//           >
//             <Icon name="menu" size={24} color={Colors.textPrimary} />
//           </TouchableOpacity>
//           <View style={{ flex: 1 }}>
//             <Text style={s.greeting}>
//               Good{" "}
//               {new Date().getHours() < 12
//                 ? "morning"
//                 : new Date().getHours() < 17
//                   ? "afternoon"
//                   : "evening"}{" "}
//               👋
//             </Text>
//             <Text style={s.name}>{firstName}</Text>
//           </View>
//           <View style={s.headerRight}>
//             {streak.current > 0 && (
//               <View style={s.streakBadge}>
//                 <Text style={s.streakBadgeText}>🔥 {streak.current}</Text>
//               </View>
//             )}
//             <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
//               <Avatar
//                 name={profile?.fullName ?? "M"}
//                 url={profile?.avatarUrl}
//                 size={42}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* ── Membership card ─────────────────────────────── */}
//         {isLoading ? (
//           <Skeleton height={110} style={{ marginBottom: Spacing.lg }} />
//         ) : active ? (
//           <View style={s.membershipCard}>
//             <View style={s.membershipTop}>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.gymName}>{active.gym?.name}</Text>
//                 <Text style={s.planName}>
//                   {active.membershipPlan?.name ?? "Active Member"}
//                 </Text>
//                 {active.gym?.city && (
//                   <View style={s.gymMeta}>
//                     <Icon
//                       name="map-marker-outline"
//                       size={12}
//                       color="rgba(255,255,255,0.6)"
//                     />
//                     <Text style={s.gymMetaText}>{active.gym.city}</Text>
//                   </View>
//                 )}
//               </View>
//               <View style={s.membershipRight}>
//                 <View style={s.activeChip}>
//                   <View style={s.activeDot} />
//                   <Text style={s.activeText}>Active</Text>
//                 </View>
//                 {stats.daysUntilExpiry !== undefined &&
//                   stats.daysUntilExpiry !== null && (
//                     <Text
//                       style={[
//                         s.expiryText,
//                         stats.daysUntilExpiry <= 7 && s.expiryWarn,
//                       ]}
//                     >
//                       {stats.daysUntilExpiry <= 0
//                         ? "Expired"
//                         : `${stats.daysUntilExpiry}d left`}
//                     </Text>
//                   )}
//               </View>
//             </View>

//             {/* Trainer */}
//             {active.assignedTrainer && (
//               <View style={s.trainerRow}>
//                 <Icon
//                   name="account-tie-outline"
//                   size={12}
//                   color="rgba(255,255,255,0.6)"
//                 />
//                 <Text style={s.trainerText}>
//                   Trainer:{" "}
//                   {active.assignedTrainer.profile?.fullName ?? "Assigned"}
//                 </Text>
//               </View>
//             )}

//             {/* Check-in button */}
//             <TouchableOpacity
//               style={[s.checkInBtn, checkedInToday && s.checkInBtnDone]}
//               onPress={() => !checkedInToday && checkInMutation.mutate()}
//               disabled={checkedInToday || checkInMutation.isPending}
//               activeOpacity={0.8}
//             >
//               <Icon
//                 name={checkedInToday ? "check-circle" : "lightning-bolt"}
//                 size={16}
//                 color={checkedInToday ? Colors.success : Colors.primary}
//               />
//               <Text
//                 style={[
//                   s.checkInText,
//                   checkedInToday && { color: Colors.success },
//                 ]}
//               >
//                 {checkInMutation.isPending
//                   ? "Checking in…"
//                   : checkedInToday
//                     ? "Checked in today ✓"
//                     : "Check In Now"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <TouchableOpacity
//             style={s.noGymCard}
//             onPress={() => navigation.navigate("Discover")}
//             activeOpacity={0.8}
//           >
//             <Icon name="compass-outline" size={22} color={Colors.primary} />
//             <View style={{ flex: 1 }}>
//               <Text style={s.noGymTitle}>No active gym membership</Text>
//               <Text style={s.noGymSub}>
//                 Discover gyms near you and join today
//               </Text>
//             </View>
//             <Icon name="chevron-right" size={18} color={Colors.primary} />
//           </TouchableOpacity>
//         )}

//         {/* ── Stats pills ─────────────────────────────────── */}
//         {isLoading ? (
//           <Skeleton height={70} style={{ marginBottom: Spacing.lg }} />
//         ) : (
//           <View style={s.statsRow}>
//             <StatPill
//               icon="fire"
//               value={streak.current}
//               label="Streak"
//               color={Colors.primary}
//             />
//             <StatPill
//               icon="calendar-check"
//               value={stats.attendanceThisMonth ?? 0}
//               label="This Month"
//               color="#3b82f6"
//             />
//             <StatPill
//               icon="dumbbell"
//               value={stats.workoutPlans ?? 0}
//               label="Workouts"
//               color="#8b5cf6"
//             />
//             <StatPill
//               icon="food-apple-outline"
//               value={stats.dietPlans ?? 0}
//               label="Diets"
//               color="#10b981"
//             />
//           </View>
//         )}

//         {/* ── Attendance 7-day chart ───────────────────────── */}
//         <Card style={s.card}>
//           <View style={s.cardHeader}>
//             <Text style={s.cardTitle}>This Week</Text>
//             <TouchableOpacity
//               onPress={() => navigation.navigate("MemberAttendance")}
//             >
//               <Text style={s.cardLink}>View all</Text>
//             </TouchableOpacity>
//           </View>
//           {isLoading ? (
//             <Skeleton height={60} />
//           ) : (
//             <WeekBars attendance={recentAttendance} />
//           )}
//           <View style={s.streakMeta}>
//             <Text style={s.streakMetaText}>
//               Current streak:{" "}
//               <Text style={{ color: Colors.primary, fontWeight: "800" }}>
//                 {streak.current} days
//               </Text>
//               {"  ·  "}Best:{" "}
//               <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>
//                 {streak.longest} days
//               </Text>
//             </Text>
//           </View>
//         </Card>

//         {/* ── Calorie tracker ──────────────────────────────── */}
//         <Card style={s.card}>
//           <View style={s.cardHeader}>
//             <Text style={s.cardTitle}>Today's Nutrition</Text>
//             <TouchableOpacity onPress={() => navigation.navigate("MemberDiet")}>
//               <Text style={s.cardLink}>Diet plan</Text>
//             </TouchableOpacity>
//           </View>
//           <CalorieBar consumed={todayCaloriesConsumed} target={calorieTarget} />
//           <View style={s.macroRow}>
//             {[
//               { label: "Protein", value: "—g", color: "#ef4444" },
//               { label: "Carbs", value: "—g", color: "#f59e0b" },
//               { label: "Fats", value: "—g", color: "#3b82f6" },
//             ].map((m) => (
//               <View key={m.label} style={s.macroPill}>
//                 <Text style={[s.macroVal, { color: m.color }]}>{m.value}</Text>
//                 <Text style={s.macroLbl}>{m.label}</Text>
//               </View>
//             ))}
//           </View>
//           <TouchableOpacity
//             style={s.viewDietBtn}
//             onPress={() => navigation.navigate("MemberDiet")}
//           >
//             <Icon name="food-apple-outline" size={14} color={Colors.primary} />
//             <Text style={s.viewDietText}>View today's meal plan</Text>
//             <Icon name="chevron-right" size={14} color={Colors.primary} />
//           </TouchableOpacity>
//         </Card>

//         {/* ── Today's workout ──────────────────────────────── */}
//         <Card style={s.card}>
//           <View style={s.cardHeader}>
//             <Text style={s.cardTitle}>Today's Workout</Text>
//             <TouchableOpacity
//               onPress={() => navigation.navigate("MemberWorkouts")}
//             >
//               <Text style={s.cardLink}>All plans</Text>
//             </TouchableOpacity>
//           </View>
//           {isLoading ? (
//             <Skeleton height={60} />
//           ) : stats.workoutPlans > 0 ? (
//             <TouchableOpacity
//               style={s.workoutCta}
//               onPress={() => navigation.navigate("MemberWorkouts")}
//               activeOpacity={0.8}
//             >
//               <Icon name="dumbbell" size={20} color={Colors.primary} />
//               <View style={{ flex: 1 }}>
//                 <Text style={s.workoutCtaTitle}>
//                   {stats.workoutPlans} plan{stats.workoutPlans > 1 ? "s" : ""}{" "}
//                   assigned
//                 </Text>
//                 <Text style={s.workoutCtaSub}>
//                   Tap to view {todayName}'s exercises
//                 </Text>
//               </View>
//               <Icon name="chevron-right" size={18} color={Colors.primary} />
//             </TouchableOpacity>
//           ) : (
//             <View style={s.emptyInCard}>
//               <Icon name="dumbbell" size={24} color={Colors.textMuted} />
//               <Text style={s.emptyInCardText}>
//                 No workout plan assigned yet
//               </Text>
//             </View>
//           )}
//         </Card>

//         {/* ── Milestones ───────────────────────────────────── */}
//         {milestones.length > 0 && (
//           <View>
//             <Text style={s.sectionTitle}>Achievements 🏅</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={{ marginHorizontal: -Spacing.lg }}
//             >
//               <View
//                 style={{
//                   flexDirection: "row",
//                   paddingHorizontal: Spacing.lg,
//                   gap: Spacing.sm,
//                 }}
//               >
//                 {milestones.map((m: any) => {
//                   const cfg = MILESTONES[m.milestone];
//                   return (
//                     <View key={m.id ?? m.milestone} style={s.milestone}>
//                       <Text style={{ fontSize: 24 }}>{cfg?.emoji ?? "🏅"}</Text>
//                       <Text style={s.milestoneLbl}>
//                         {cfg?.label ?? `${m.milestone}d`}
//                       </Text>
//                     </View>
//                   );
//                 })}
//               </View>
//             </ScrollView>
//           </View>
//         )}

//         {/* ── Quick actions ────────────────────────────────── */}
//         <Text style={s.sectionTitle}>Quick Actions</Text>
//         <View style={s.quickGrid}>
//           {[
//             {
//               icon: "calendar-check-outline",
//               label: "Attendance",
//               screen: "MemberAttendance",
//               color: Colors.info,
//             },
//             {
//               icon: "credit-card-outline",
//               label: "Payments",
//               screen: "MemberPayments",
//               color: Colors.success,
//             },
//             {
//               icon: "gift-outline",
//               label: "Refer & Earn",
//               screen: "MemberReferral",
//               color: Colors.warning,
//             },
//             {
//               icon: "office-building-outline",
//               label: "My Gyms",
//               screen: "Gyms",
//               color: Colors.purple,
//             },
//           ].map((q) => (
//             <TouchableOpacity
//               key={q.screen}
//               style={s.quickCard}
//               onPress={() => navigation.navigate(q.screen)}
//               activeOpacity={0.75}
//             >
//               <View style={[s.quickIcon, { backgroundColor: q.color + "18" }]}>
//                 <Icon name={q.icon} size={20} color={q.color} />
//               </View>
//               <Text style={s.quickLabel}>{q.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* ── Recent activity ──────────────────────────────── */}
//         {recentAttendance.length > 0 && (
//           <>
//             <View style={s.rowBetween}>
//               <Text style={s.sectionTitle}>Recent Activity</Text>
//               <TouchableOpacity
//                 onPress={() => navigation.navigate("MemberAttendance")}
//               >
//                 <Text style={s.seeAll}>See all</Text>
//               </TouchableOpacity>
//             </View>
//             {recentAttendance.slice(0, 3).map((r: any) => {
//               const dt = new Date(r.checkInTime);
//               const today = dt.toDateString() === new Date().toDateString();
//               return (
//                 <View key={r.id} style={s.activityRow}>
//                   <View
//                     style={[
//                       s.activityDot,
//                       {
//                         backgroundColor: today ? Colors.success : Colors.border,
//                       },
//                     ]}
//                   />
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.activityGym}>{r.gym?.name}</Text>
//                     <Text style={s.activityTime}>
//                       {today
//                         ? "Today"
//                         : dt.toLocaleDateString("en-IN", {
//                             weekday: "short",
//                             day: "numeric",
//                             month: "short",
//                           })}
//                       {" · "}
//                       {dt.toLocaleTimeString("en-IN", {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </Text>
//                   </View>
//                   {today && (
//                     <View style={s.activeBadge}>
//                       <Text style={s.activeBadgeText}>Active</Text>
//                     </View>
//                   )}
//                 </View>
//               );
//             })}
//           </>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
//   // Header
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   menuBtn: {
//     width: 38,
//     height: 38,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: Spacing.sm,
//   },
//   greeting: { color: Colors.textMuted, fontSize: Typography.sm },
//   name: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: "800",
//   },
//   headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
//   streakBadge: {
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.full,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderWidth: 1,
//     borderColor: Colors.primary + "40",
//   },
//   streakBadgeText: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "800",
//   },
//   // Membership card
//   membershipCard: {
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.xl,
//     borderWidth: 1,
//     borderColor: Colors.primary + "40",
//     padding: Spacing.lg,
//     gap: Spacing.md,
//   },
//   membershipTop: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: Spacing.md,
//   },
//   gymName: {
//     color: Colors.textPrimary,
//     fontSize: Typography.lg,
//     fontWeight: "800",
//   },
//   planName: {
//     color: Colors.primary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//     marginTop: 2,
//   },
//   gymMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
//   gymMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
//   membershipRight: { alignItems: "flex-end", gap: 4 },
//   activeChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: Colors.successFaded,
//     borderRadius: Radius.full,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },
//   activeDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: Colors.success,
//   },
//   activeText: {
//     color: Colors.success,
//     fontSize: Typography.xs,
//     fontWeight: "700",
//   },
//   expiryText: { color: Colors.textMuted, fontSize: Typography.xs },
//   expiryWarn: { color: Colors.warning },
//   trainerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
//   trainerText: { color: Colors.textMuted, fontSize: Typography.xs },
//   checkInBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.sm,
//     backgroundColor: Colors.primary + "20",
//     borderRadius: Radius.xl,
//     padding: Spacing.md,
//     borderWidth: 1,
//     borderColor: Colors.primary + "40",
//   },
//   checkInBtnDone: {
//     backgroundColor: Colors.successFaded,
//     borderColor: Colors.success + "40",
//   },
//   checkInText: {
//     color: Colors.primary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//   },
//   noGymCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.xl,
//     padding: Spacing.lg,
//     borderWidth: 1,
//     borderColor: Colors.primary + "30",
//   },
//   noGymTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//   },
//   noGymSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   // Stats pills
//   statsRow: { flexDirection: "row", gap: Spacing.sm },
//   // Cards
//   card: {},
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: Spacing.md,
//   },
//   cardTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//   },
//   cardLink: { color: Colors.primary, fontSize: Typography.sm },
//   streakMeta: { marginTop: Spacing.sm },
//   streakMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
//   // Macros
//   macroRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
//   macroPill: {
//     flex: 1,
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     padding: Spacing.sm,
//     alignItems: "center",
//   },
//   macroVal: { fontSize: Typography.sm, fontWeight: "800" },
//   macroLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
//   viewDietBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     marginTop: Spacing.md,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.lg,
//     padding: Spacing.sm + 2,
//   },
//   viewDietText: {
//     flex: 1,
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "600",
//   },
//   // Workout
//   workoutCta: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.lg,
//     padding: Spacing.md,
//   },
//   workoutCtaTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//   },
//   workoutCtaSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: 2,
//   },
//   emptyInCard: {
//     alignItems: "center",
//     gap: Spacing.sm,
//     paddingVertical: Spacing.lg,
//   },
//   emptyInCardText: { color: Colors.textMuted, fontSize: Typography.sm },
//   // Milestones
//   sectionTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//   },
//   milestone: {
//     alignItems: "center",
//     backgroundColor: Colors.surface,
//     borderRadius: Radius.xl,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     padding: Spacing.md,
//     width: 80,
//     gap: 4,
//   },
//   milestoneLbl: { color: Colors.textMuted, fontSize: 9, textAlign: "center" },
//   // Quick actions
//   quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
//   quickCard: {
//     width: (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2,
//     backgroundColor: Colors.surface,
//     borderRadius: Radius.xl,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     padding: Spacing.md,
//     gap: Spacing.sm,
//     alignItems: "flex-start",
//   },
//   quickIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: Radius.lg,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   quickLabel: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//   },
//   // Activity
//   rowBetween: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   seeAll: { color: Colors.primary, fontSize: Typography.sm },
//   activityRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     paddingVertical: Spacing.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
//   activityGym: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//   },
//   activityTime: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: 2,
//   },
//   activeBadge: {
//     backgroundColor: Colors.successFaded,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: Radius.full,
//   },
//   activeBadgeText: {
//     color: Colors.success,
//     fontSize: Typography.xs,
//     fontWeight: "700",
//   },
// });

// mobile/src/screens/member/DashboardScreen.tsx
import { memberAttendanceApi, memberDashboardApi } from "@/api/endpoints";
import { Avatar, Card, Skeleton } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── API response types ────────────────────────────────────────────────────────

interface GymMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
  gym: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    contactNumber: string | null;
  } | null;
  membershipPlan: {
    name: string;
    price: number;
    durationMonths: number;
  } | null;
  assignedTrainer: {
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}

interface DashboardData {
  activeMembership: GymMembership | null;
  memberships: GymMembership[];
  streak: { current: number; longest: number; total: number };
  checkedInToday: boolean;
  milestones: { id: string; milestone: number; achievedAt: string }[];
  stats: {
    attendanceThisMonth: number;
    totalAttendance: number;
    workoutPlans: number;
    dietPlans: number;
    daysUntilExpiry: number | null;
    unreadNotifications: number;
  };
  recentAttendance: {
    id: string;
    checkInTime: string;
    gym: { name: string };
  }[];
}

const { width: SCREEN_W } = Dimensions.get("window");

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  attendanceThisMonth: number;
  totalAttendance: number;
  workoutPlans: number;
  dietPlans: number;
  daysUntilExpiry: number | null;
  unreadNotifications: number;
}

const MILESTONES: Record<number, { emoji: string; label: string }> = {
  7: { emoji: "🔥", label: "7-Day Streak" },
  14: { emoji: "⚡", label: "2-Week Warrior" },
  30: { emoji: "🏆", label: "Consistency King" },
  60: { emoji: "💪", label: "60-Day Champ" },
  100: { emoji: "👑", label: "100-Day Legend" },
  180: { emoji: "🌟", label: "180-Day Elite" },
  365: { emoji: "🎖️", label: "1-Year Titan" },
};

// ── Mini attendance chart (last 7 days bars) ──────────────────────────────────
function WeekBars({ attendance }: { attendance: any[] }) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const hit = attendance.some(
        (a) => new Date(a.checkInTime).toDateString() === key,
      );
      result.push({
        label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
        hit,
        isToday: i === 0,
      });
    }
    return result;
  }, [attendance]);

  return (
    <View style={wb.row}>
      {days.map((d, i) => (
        <View key={i} style={wb.col}>
          <View
            style={[wb.bar, d.hit && wb.barFilled, d.isToday && wb.barToday]}
          />
          <Text style={[wb.lbl, d.isToday && { color: Colors.primary }]}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
const wb = StyleSheet.create({
  row: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
  col: { flex: 1, alignItems: "center", gap: 4 },
  bar: {
    width: "100%",
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surfaceRaised,
  },
  barFilled: { backgroundColor: Colors.primary + "60", height: 48 },
  barToday: { borderWidth: 1.5, borderColor: Colors.primary },
  lbl: { color: Colors.textMuted, fontSize: 9, fontWeight: "600" },
});

// ── Calorie mini-bar ──────────────────────────────────────────────────────────
function CalorieBar({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const color =
    pct > 0.9 ? Colors.error : pct > 0.6 ? Colors.warning : Colors.success;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>
          Calories today
        </Text>
        <Text style={{ color, fontSize: Typography.xs, fontWeight: "700" }}>
          {consumed} / {target} kcal
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: Colors.surfaceRaised,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ── Quick stat pill ───────────────────────────────────────────────────────────
function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={[sp.pill, { borderColor: color + "25" }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[sp.val, { color }]}>{value}</Text>
      <Text style={sp.lbl}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  val: { fontSize: Typography.lg, fontWeight: "800" },
  lbl: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MemberDashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["memberDashboard"],
    queryFn: memberDashboardApi.get as () => Promise<DashboardData>,
    staleTime: 60_000,
  });

  const checkInMutation = useMutation({
    mutationFn: memberAttendanceApi.checkIn,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["memberDashboard"] });
      qc.invalidateQueries({ queryKey: ["memberAttendance"] });
      const m: number[] = res.newMilestones ?? [];
      if (m.length > 0) {
        const cfg = MILESTONES[Math.max(...m)];
        Toast.show({
          type: "success",
          text1: `${cfg?.emoji} ${cfg?.label}!`,
          text2: "Keep it up!",
          position: "top",
        });
      } else {
        Toast.show({
          type: "success",
          text1: res.message ?? "Checked in! 🔥",
          position: "top",
        });
      }
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: err?.message ?? "Check-in failed",
        position: "top",
      });
    },
  });

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";
  const active = data?.activeMembership ?? null;
  const streak = data?.streak ?? { current: 0, longest: 0, total: 0 };
  const stats: DashboardStats = data?.stats ?? {
    attendanceThisMonth: 0,
    totalAttendance: 0,
    workoutPlans: 0,
    dietPlans: 0,
    daysUntilExpiry: null,
    unreadNotifications: 0,
  };
  const checkedInToday = data?.checkedInToday ?? false;
  const milestones = data?.milestones ?? [];
  const recentAttendance = data?.recentAttendance ?? [];

  // Workout summary — pick first plan, show today's exercises
  const workoutPlans: any[] = []; // placeholder — pull from dashboard if API adds it
  const todayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];

  // Diet calorie estimate from today's meals
  const todayCaloriesConsumed = 0; // will fill from diet API when integrated
  const calorieTarget = 2000;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.menuBtn}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 17
                  ? "afternoon"
                  : "evening"}{" "}
              👋
            </Text>
            <Text style={s.name}>{firstName}</Text>
          </View>
          <View style={s.headerRight}>
            {streak.current > 0 && (
              <View style={s.streakBadge}>
                <Text style={s.streakBadgeText}>🔥 {streak.current}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Avatar
                name={profile?.fullName ?? "M"}
                url={profile?.avatarUrl}
                size={42}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Membership card ─────────────────────────────── */}
        {isLoading ? (
          <Skeleton height={110} style={{ marginBottom: Spacing.lg }} />
        ) : active ? (
          <View style={s.membershipCard}>
            <View style={s.membershipTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.gymName}>{active.gym?.name}</Text>
                <Text style={s.planName}>
                  {active.membershipPlan?.name ?? "Active Member"}
                </Text>
                {active.gym?.city && (
                  <View style={s.gymMeta}>
                    <Icon
                      name="map-marker-outline"
                      size={12}
                      color="rgba(255,255,255,0.6)"
                    />
                    <Text style={s.gymMetaText}>{active.gym.city}</Text>
                  </View>
                )}
              </View>
              <View style={s.membershipRight}>
                <View style={s.activeChip}>
                  <View style={s.activeDot} />
                  <Text style={s.activeText}>Active</Text>
                </View>
                {stats.daysUntilExpiry !== undefined &&
                  stats.daysUntilExpiry !== null && (
                    <Text
                      style={[
                        s.expiryText,
                        stats.daysUntilExpiry <= 7 && s.expiryWarn,
                      ]}
                    >
                      {stats.daysUntilExpiry <= 0
                        ? "Expired"
                        : `${stats.daysUntilExpiry}d left`}
                    </Text>
                  )}
              </View>
            </View>

            {/* Trainer */}
            {active.assignedTrainer && (
              <View style={s.trainerRow}>
                <Icon
                  name="account-tie-outline"
                  size={12}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={s.trainerText}>
                  Trainer:{" "}
                  {active.assignedTrainer.profile?.fullName ?? "Assigned"}
                </Text>
              </View>
            )}

            {/* Check-in button */}
            <TouchableOpacity
              style={[s.checkInBtn, checkedInToday && s.checkInBtnDone]}
              onPress={() => !checkedInToday && checkInMutation.mutate()}
              disabled={checkedInToday || checkInMutation.isPending}
              activeOpacity={0.8}
            >
              <Icon
                name={checkedInToday ? "check-circle" : "lightning-bolt"}
                size={16}
                color={checkedInToday ? Colors.success : Colors.primary}
              />
              <Text
                style={[
                  s.checkInText,
                  checkedInToday && { color: Colors.success },
                ]}
              >
                {checkInMutation.isPending
                  ? "Checking in…"
                  : checkedInToday
                    ? "Checked in today ✓"
                    : "Check In Now"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.noGymCard}
            onPress={() => navigation.navigate("Discover")}
            activeOpacity={0.8}
          >
            <Icon name="compass-outline" size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.noGymTitle}>No active gym membership</Text>
              <Text style={s.noGymSub}>
                Discover gyms near you and join today
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── Stats pills ─────────────────────────────────── */}
        {isLoading ? (
          <Skeleton height={70} style={{ marginBottom: Spacing.lg }} />
        ) : (
          <View style={s.statsRow}>
            <StatPill
              icon="fire"
              value={streak.current}
              label="Streak"
              color={Colors.primary}
            />
            <StatPill
              icon="calendar-check"
              value={stats.attendanceThisMonth ?? 0}
              label="This Month"
              color="#3b82f6"
            />
            <StatPill
              icon="dumbbell"
              value={stats.workoutPlans ?? 0}
              label="Workouts"
              color="#8b5cf6"
            />
            <StatPill
              icon="food-apple-outline"
              value={stats.dietPlans ?? 0}
              label="Diets"
              color="#10b981"
            />
          </View>
        )}

        {/* ── Attendance 7-day chart ───────────────────────── */}
        <Card style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>This Week</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("MemberAttendance")}
            >
              <Text style={s.cardLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <Skeleton height={60} />
          ) : (
            <WeekBars attendance={recentAttendance} />
          )}
          <View style={s.streakMeta}>
            <Text style={s.streakMetaText}>
              Current streak:{" "}
              <Text style={{ color: Colors.primary, fontWeight: "800" }}>
                {streak.current} days
              </Text>
              {"  ·  "}Best:{" "}
              <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>
                {streak.longest} days
              </Text>
            </Text>
          </View>
        </Card>

        {/* ── Calorie tracker ──────────────────────────────── */}
        <Card style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Today's Nutrition</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MemberDiet")}>
              <Text style={s.cardLink}>Diet plan</Text>
            </TouchableOpacity>
          </View>
          <CalorieBar consumed={todayCaloriesConsumed} target={calorieTarget} />
          <View style={s.macroRow}>
            {[
              { label: "Protein", value: "—g", color: "#ef4444" },
              { label: "Carbs", value: "—g", color: "#f59e0b" },
              { label: "Fats", value: "—g", color: "#3b82f6" },
            ].map((m) => (
              <View key={m.label} style={s.macroPill}>
                <Text style={[s.macroVal, { color: m.color }]}>{m.value}</Text>
                <Text style={s.macroLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={s.viewDietBtn}
            onPress={() => navigation.navigate("MemberDiet")}
          >
            <Icon name="food-apple-outline" size={14} color={Colors.primary} />
            <Text style={s.viewDietText}>View today's meal plan</Text>
            <Icon name="chevron-right" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* ── Today's workout ──────────────────────────────── */}
        <Card style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Today's Workout</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("MemberWorkouts")}
            >
              <Text style={s.cardLink}>All plans</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <Skeleton height={60} />
          ) : stats.workoutPlans > 0 ? (
            <TouchableOpacity
              style={s.workoutCta}
              onPress={() => navigation.navigate("MemberWorkouts")}
              activeOpacity={0.8}
            >
              <Icon name="dumbbell" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.workoutCtaTitle}>
                  {stats.workoutPlans} plan{stats.workoutPlans > 1 ? "s" : ""}{" "}
                  assigned
                </Text>
                <Text style={s.workoutCtaSub}>
                  Tap to view {todayName}'s exercises
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={s.emptyInCard}>
              <Icon name="dumbbell" size={24} color={Colors.textMuted} />
              <Text style={s.emptyInCardText}>
                No workout plan assigned yet
              </Text>
            </View>
          )}
        </Card>

        {/* ── Milestones ───────────────────────────────────── */}
        {milestones.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Achievements 🏅</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -Spacing.lg }}
            >
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: Spacing.lg,
                  gap: Spacing.sm,
                }}
              >
                {milestones.map((m: any) => {
                  const cfg = MILESTONES[m.milestone];
                  return (
                    <View key={m.id ?? m.milestone} style={s.milestone}>
                      <Text style={{ fontSize: 24 }}>{cfg?.emoji ?? "🏅"}</Text>
                      <Text style={s.milestoneLbl}>
                        {cfg?.label ?? `${m.milestone}d`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Quick actions ────────────────────────────────── */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            {
              icon: "calendar-check-outline",
              label: "Attendance",
              screen: "MemberAttendance",
              color: Colors.info,
            },
            {
              icon: "credit-card-outline",
              label: "Payments",
              screen: "MemberPayments",
              color: Colors.success,
            },
            {
              icon: "gift-outline",
              label: "Refer & Earn",
              screen: "MemberReferral",
              color: Colors.warning,
            },
            {
              icon: "office-building-outline",
              label: "My Gyms",
              screen: "MemberGyms",
              color: Colors.purple,
            },
          ].map((q) => (
            <TouchableOpacity
              key={q.screen}
              style={s.quickCard}
              onPress={() => navigation.navigate(q.screen)}
              activeOpacity={0.75}
            >
              <View style={[s.quickIcon, { backgroundColor: q.color + "18" }]}>
                <Icon name={q.icon} size={20} color={q.color} />
              </View>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent activity ──────────────────────────────── */}
        {recentAttendance.length > 0 && (
          <>
            <View style={s.rowBetween}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("MemberAttendance")}
              >
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentAttendance.slice(0, 3).map((r: any) => {
              const dt = new Date(r.checkInTime);
              const today = dt.toDateString() === new Date().toDateString();
              return (
                <View key={r.id} style={s.activityRow}>
                  <View
                    style={[
                      s.activityDot,
                      {
                        backgroundColor: today ? Colors.success : Colors.border,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.activityGym}>{r.gym?.name}</Text>
                    <Text style={s.activityTime}>
                      {today
                        ? "Today"
                        : dt.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                      {" · "}
                      {dt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {today && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  greeting: { color: Colors.textMuted, fontSize: Typography.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  streakBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  streakBadgeText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "800",
  },
  // Membership card
  membershipCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  membershipTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  planName: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 2,
  },
  gymMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  gymMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
  membershipRight: { alignItems: "flex-end", gap: 4 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  expiryText: { color: Colors.textMuted, fontSize: Typography.xs },
  expiryWarn: { color: Colors.warning },
  trainerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trainerText: { color: Colors.textMuted, fontSize: Typography.xs },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary + "20",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  checkInBtnDone: {
    backgroundColor: Colors.successFaded,
    borderColor: Colors.success + "40",
  },
  checkInText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  noGymCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  noGymTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  noGymSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  // Stats pills
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  // Cards
  card: {},
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  cardLink: { color: Colors.primary, fontSize: Typography.sm },
  streakMeta: { marginTop: Spacing.sm },
  streakMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
  // Macros
  macroRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  macroPill: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: "center",
  },
  macroVal: { fontSize: Typography.sm, fontWeight: "800" },
  macroLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  viewDietBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  viewDietText: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  // Workout
  workoutCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  workoutCtaTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  workoutCtaSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  emptyInCard: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyInCardText: { color: Colors.textMuted, fontSize: Typography.sm },
  // Milestones
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  milestone: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    width: 80,
    gap: 4,
  },
  milestoneLbl: { color: Colors.textMuted, fontSize: 9, textAlign: "center" },
  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  quickCard: {
    width: (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  // Activity
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: { color: Colors.primary, fontSize: Typography.sm },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  activityGym: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  activityTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: Colors.successFaded,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
});
