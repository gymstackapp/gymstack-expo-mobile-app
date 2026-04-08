// // mobile/src/screens/owner/DashboardScreen.tsx
// import { ownerDashboardApi } from "@/api/endpoints";
// import { Avatar, Card, Skeleton, StatCard } from "@/components";
// import { useAuthStore } from "@/store/authStore";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import type {
//   DashboardCheckin,
//   DashboardRecentMember,
//   DashboardResponse,
// } from "@/types/api";
// import { DrawerActions, useNavigation } from "@react-navigation/native";
// import { useQuery } from "@tanstack/react-query";
// import React, { useState } from "react";
// import {
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// // Extend DashboardResponse locally with new expense fields
// type ExtendedDashboard = DashboardResponse & {
//   rangeExpenses: number;
//   todayExpenses: number;
//   netRevenue: number;
//   dailyExpenses: { date: string; amount: number }[];
//   dailySupplementRevenue: { date: string; amount: number }[];
//   recentExpenses: {
//     id: string;
//     title: string;
//     amount: number;
//     category: string;
//     expenseDate: string;
//     gym: { name: string };
//   }[];
// };

// const RANGES = [
//   { key: "today", label: "Today" },
//   { key: "this_week", label: "Week" },
//   { key: "this_month", label: "Month" },
//   { key: "last_3_months", label: "3 Mon" },
//   { key: "last_year", label: "Year" },
// ];

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
//   if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// function SparkLine({
//   revenue,
//   expenses,
//   supplementRevenue,
// }: {
//   revenue: { date: string; revenue: number }[];
//   expenses?: { date: string; amount: number }[];
//   supplementRevenue?: { date: string; amount: number }[];
// }) {
//   if (!revenue?.length) return null;
//   const expMap: Record<string, number> = {};
//   for (const e of expenses ?? []) expMap[e.date] = e.amount;
//   const suppMap: Record<string, number> = {};
//   for (const s of supplementRevenue ?? []) suppMap[s.date] = s.amount;

//   const allValues = [
//     ...revenue.map((d) => d.revenue),
//     ...revenue.map((d) => expMap[d.date] ?? 0),
//     ...revenue.map((d) => suppMap[d.date] ?? 0),
//     1,
//   ];
//   const max = Math.max(...allValues);
//   const H = 44;
//   const hasExpenses = (expenses?.length ?? 0) > 0;
//   const hasSupplements = (supplementRevenue?.length ?? 0) > 0;

//   return (
//     <View>
//       <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
//         <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
//           <View
//             style={{
//               width: 10,
//               height: 10,
//               borderRadius: 2,
//               backgroundColor: Colors.primary,
//             }}
//           />
//           <Text style={{ color: Colors.textMuted, fontSize: 10 }}>Membership</Text>
//         </View>
//         {hasSupplements && (
//           <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
//             <View
//               style={{
//                 width: 10,
//                 height: 10,
//                 borderRadius: 2,
//                 backgroundColor: Colors.success,
//               }}
//             />
//             <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//               Supplements
//             </Text>
//           </View>
//         )}
//         {hasExpenses && (
//           <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
//             <View
//               style={{
//                 width: 10,
//                 height: 10,
//                 borderRadius: 2,
//                 backgroundColor: Colors.error,
//               }}
//             />
//             <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//               Expenses
//             </Text>
//           </View>
//         )}
//       </View>
//       <View
//         style={{
//           flexDirection: "row",
//           alignItems: "flex-end",
//           height: H,
//           gap: 3,
//         }}
//       >
//         {revenue.map((d, i) => {
//           const revH = max > 0 ? (d.revenue / max) * H : 2;
//           const suppH = max > 0 ? ((suppMap[d.date] ?? 0) / max) * H : 0;
//           const expH = max > 0 ? ((expMap[d.date] ?? 0) / max) * H : 0;
//           return (
//             <View
//               key={i}
//               style={{
//                 flex: 1,
//                 flexDirection: "row",
//                 alignItems: "flex-end",
//                 gap: 1,
//               }}
//             >
//               <View
//                 style={{
//                   flex: 1,
//                   height: Math.max(revH, 2),
//                   backgroundColor: Colors.primary,
//                   borderRadius: 2,
//                   opacity: 0.8,
//                 }}
//               />
//               {suppH > 0 && (
//                 <View
//                   style={{
//                     flex: 1,
//                     height: Math.max(suppH, 2),
//                     backgroundColor: Colors.success,
//                     borderRadius: 2,
//                     opacity: 0.8,
//                   }}
//                 />
//               )}
//               {expH > 0 && (
//                 <View
//                   style={{
//                     flex: 1,
//                     height: Math.max(expH, 2),
//                     backgroundColor: Colors.error,
//                     borderRadius: 2,
//                     opacity: 0.7,
//                   }}
//                 />
//               )}
//             </View>
//           );
//         })}
//       </View>
//     </View>
//   );
// }

// function ExpiryAlert({
//   names,
//   count,
//   days,
// }: {
//   names?: string[];
//   count: number;
//   days: number;
// }) {
//   if (!count) return null;
//   const color =
//     days === 0 ? Colors.error : days <= 3 ? Colors.warning : Colors.info;
//   const bg =
//     days === 0
//       ? Colors.errorFaded
//       : days <= 3
//         ? Colors.warningFaded
//         : Colors.infoFaded;
//   return (
//     <View
//       style={[styles.alert, { backgroundColor: bg, borderColor: color + "40" }]}
//     >
//       <Icon name="alert-circle-outline" size={16} color={color} />
//       <Text style={[styles.alertText, { color }]}>
//         {days === 0
//           ? `Last day: ${names?.join(", ") ?? count + " memberships"}`
//           : `${count} expiring in ${days} day${days !== 1 ? "s" : ""}`}
//       </Text>
//     </View>
//   );
// }

// export default function OwnerDashboardScreen() {
//   const navigation = useNavigation();
//   const { profile } = useAuthStore();
//   const [range, setRange] = useState("this_month");
//   const [gymId, setGymId] = useState("");

//   const { data, isLoading, refetch, isRefetching } =
//     useQuery<ExtendedDashboard>({
//       queryKey: ["ownerDashboard", range, gymId],
//       queryFn: () =>
//         ownerDashboardApi.get({ range, gymId: gymId || undefined }),
//       staleTime: 2 * 60 * 1000,
//     });

//   const firstName = profile?.fullName?.split(" ")[0] ?? "there";

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefetching}
//             onRefresh={refetch}
//             tintColor={Colors.primary}
//           />
//         }
//       >
//         {/* ── Header ─────────────────────────────────────────── */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
//             hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//             style={styles.menuBtn}
//           >
//             <Icon name="menu" size={24} color={Colors.textPrimary} />
//           </TouchableOpacity>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
//             <Text style={styles.name}>{firstName}</Text>
//           </View>
//           <TouchableOpacity
//             onPress={() => (navigation as any).navigate("Profile")}
//           >
//             <Avatar
//               name={profile?.fullName ?? "O"}
//               url={profile?.avatarUrl}
//               size={42}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* ── Gym filter ─────────────────────────────────────── */}
//         {(data?.gyms?.length ?? 0) > 1 && (
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             style={styles.gymFilter}
//           >
//             {[{ id: "", name: "All Gyms" }, ...(data?.gyms ?? [])].map((g) => (
//               <TouchableOpacity
//                 key={g.id}
//                 onPress={() => setGymId(g.id)}
//                 style={[styles.gymChip, gymId === g.id && styles.gymChipActive]}
//               >
//                 <Text
//                   style={[
//                     styles.gymChipText,
//                     gymId === g.id && styles.gymChipTextActive,
//                   ]}
//                 >
//                   {g.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         )}

//         {/* ── Range tabs ─────────────────────────────────────── */}
//         <View style={styles.rangeTabs}>
//           {RANGES.map((r) => (
//             <TouchableOpacity
//               key={r.key}
//               onPress={() => setRange(r.key)}
//               style={[
//                 styles.rangeTab,
//                 range === r.key && styles.rangeTabActive,
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.rangeTabText,
//                   range === r.key && styles.rangeTabTextActive,
//                 ]}
//               >
//                 {r.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* ── Expiry alerts ──────────────────────────────────── */}
//         {!isLoading && (
//           <View style={{ gap: Spacing.sm }}>
//             <ExpiryAlert
//               names={data?.expiringToday}
//               count={data?.expiringToday?.length ?? 0}
//               days={0}
//             />
//             <ExpiryAlert count={data?.expiringMembers3 ?? 0} days={3} />
//             <ExpiryAlert count={data?.expiringMembers ?? 0} days={7} />
//           </View>
//         )}

//         {/* ── Revenue card ───────────────────────────────────── */}
//         {isLoading ? (
//           <Skeleton height={140} style={{ marginTop: Spacing.lg }} />
//         ) : (
//           <Card style={styles.revenueCard}>
//             <Text style={styles.revenueLabel}>Total Revenue</Text>
//             <Text style={styles.revenueValue}>
//               {fmt(data?.totalRevenue ?? 0)}
//             </Text>
//             <View style={styles.revenueSplit}>
//               <View>
//                 <Text style={styles.revenueSplitLabel}>Memberships</Text>
//                 <Text
//                   style={[styles.revenueSplitValue, { color: Colors.primary }]}
//                 >
//                   {fmt(data?.rangeRevenue ?? 0)}
//                 </Text>
//               </View>
//               <View>
//                 <Text style={styles.revenueSplitLabel}>Supplements</Text>
//                 <Text
//                   style={[styles.revenueSplitValue, { color: Colors.success }]}
//                 >
//                   {fmt(data?.rangeSupplementRevenue ?? 0)}
//                 </Text>
//               </View>
//               {(data?.rangeExpenses ?? 0) > 0 && (
//                 <View>
//                   <Text style={styles.revenueSplitLabel}>Expenses</Text>
//                   <Text
//                     style={[
//                       styles.revenueSplitValue,
//                       { color: Colors.error },
//                     ]}
//                   >
//                     −{fmt(data?.rangeExpenses ?? 0)}
//                   </Text>
//                 </View>
//               )}
//             </View>
//             <SparkLine
//               revenue={data?.dailyRevenue ?? []}
//               expenses={data?.dailyExpenses ?? []}
//               supplementRevenue={data?.dailySupplementRevenue ?? []}
//             />
//           </Card>
//         )}

//         {/* ── Stats grid ─────────────────────────────────────── */}
//         {isLoading ? (
//           <View style={styles.statsGrid}>
//             {[...Array(4)].map((_, i) => (
//               <Skeleton key={i} height={90} style={{ flex: 1 }} />
//             ))}
//           </View>
//         ) : (
//           <View style={styles.statsGrid}>
//             <StatCard
//               icon="account-group-outline"
//               label="Members"
//               value={data?.totalMembers ?? 0}
//             />
//             <StatCard
//               icon="dumbbell"
//               label="Active Gyms"
//               value={data?.activeGyms ?? 0}
//               color={Colors.info}
//               bg={Colors.infoFaded}
//             />
//             <StatCard
//               icon="calendar-check-outline"
//               label="Check-ins"
//               value={data?.todayAttendance ?? 0}
//               color={Colors.success}
//               bg={Colors.successFaded}
//             />
//             <StatCard
//               icon="account-plus-outline"
//               label="New Today"
//               value={data?.todayNewMembers ?? 0}
//               color={Colors.purple}
//               bg={Colors.purpleFaded}
//             />
//           </View>
//         )}

//         {/* ── Recent Expenses ────────────────────────────────── */}
//         {(data?.recentExpenses?.length ?? 0) > 0 && (
//           <View style={{ marginTop: Spacing.lg }}>
//             <View style={styles.rowBetween}>
//               <Text style={styles.sectionTitle}>Recent Expenses</Text>
//               <TouchableOpacity
//                 onPress={() => (navigation as any).navigate("OwnerExpenses")}
//               >
//                 <Text style={styles.seeAll}>See all</Text>
//               </TouchableOpacity>
//             </View>
//             {data!.recentExpenses.map(
//               (e: ExtendedDashboard["recentExpenses"][0]) => (
//                 <View key={e.id} style={styles.listRow}>
//                   <View
//                     style={{
//                       width: 36,
//                       height: 36,
//                       borderRadius: Radius.md,
//                       backgroundColor: Colors.errorFaded,
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                   >
//                     <Icon
//                       name="receipt-outline"
//                       size={16}
//                       color={Colors.error}
//                     />
//                   </View>
//                   <View style={{ flex: 1, marginLeft: Spacing.md }}>
//                     <Text style={styles.listName} numberOfLines={1}>
//                       {e.title}
//                     </Text>
//                     <Text style={styles.listSub}>
//                       {new Date(e.expenseDate).toLocaleDateString("en-IN", {
//                         day: "numeric",
//                         month: "short",
//                       })}
//                     </Text>
//                   </View>
//                   <Text
//                     style={{
//                       color: Colors.error,
//                       fontSize: Typography.sm,
//                       fontWeight: "700",
//                     }}
//                   >
//                     −{fmt(e.amount)}
//                   </Text>
//                 </View>
//               ),
//             )}
//           </View>
//         )}

//         {/* ── Recent check-ins ───────────────────────────────── */}
//         {(data?.todayCheckins?.length ?? 0) > 0 && (
//           <View style={{ marginTop: Spacing.lg }}>
//             <View style={styles.rowBetween}>
//               <Text style={styles.sectionTitle}>Today's Check-ins</Text>
//               <TouchableOpacity
//                 onPress={() => (navigation as any).navigate("Attendance")}
//               >
//                 <Text style={styles.seeAll}>View all</Text>
//               </TouchableOpacity>
//             </View>
//             {data!.todayCheckins.slice(0, 5).map((c: DashboardCheckin) => (
//               <View key={c.id} style={styles.listRow}>
//                 <Avatar
//                   name={c.member?.profile?.fullName ?? "?"}
//                   url={c.member?.profile?.avatarUrl}
//                   size={36}
//                 />
//                 <View style={{ flex: 1, marginLeft: Spacing.md }}>
//                   <Text style={styles.listName}>
//                     {c.member?.profile?.fullName}
//                   </Text>
//                   <Text style={styles.listSub}>
//                     {new Date(c.checkInTime).toLocaleTimeString("en-IN", {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </Text>
//                 </View>
//                 <View style={styles.activeBadge}>
//                   <Text style={styles.activeBadgeText}>Active</Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* ── Recent members ─────────────────────────────────── */}
//         {(data?.recentMembers?.length ?? 0) > 0 && (
//           <View style={{ marginTop: Spacing.lg }}>
//             <View style={styles.rowBetween}>
//               <Text style={styles.sectionTitle}>Recent Members</Text>
//               <TouchableOpacity
//                 onPress={() => (navigation as any).navigate("Members")}
//               >
//                 <Text style={styles.seeAll}>See all</Text>
//               </TouchableOpacity>
//             </View>
//             {data!.recentMembers.slice(0, 4).map((m: DashboardRecentMember) => (
//               <TouchableOpacity
//                 key={m.id}
//                 style={styles.listRow}
//                 onPress={() =>
//                   (navigation as any).navigate("OwnerMemberDetail", {
//                     memberId: m.id,
//                   })
//                 }
//               >
//                 <Avatar
//                   name={m.profile?.fullName ?? "?"}
//                   url={m.profile?.avatarUrl}
//                   size={36}
//                 />
//                 <View style={{ flex: 1, marginLeft: Spacing.md }}>
//                   <Text style={styles.listName}>{m.profile?.fullName}</Text>
//                   <Text style={styles.listSub}>{m.gym?.name}</Text>
//                 </View>
//                 <Icon name="chevron-right" size={18} color={Colors.textMuted} />
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// function getGreeting() {
//   const h = new Date().getHours();
//   if (h < 12) return "morning";
//   if (h < 17) return "afternoon";
//   return "evening";
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   scroll: { padding: Spacing.lg, paddingBottom: 40 },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: Spacing.xl,
//     gap: Spacing.md,
//   },
//   menuBtn: {
//     width: 38,
//     height: 38,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   greeting: { color: Colors.textMuted, fontSize: Typography.sm },
//   name: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxl,
//     fontWeight: Typography.bold,
//   },
//   gymFilter: { marginBottom: Spacing.md },
//   gymChip: {
//     paddingHorizontal: Spacing.md,
//     paddingVertical: 6,
//     borderRadius: Radius.full,
//     backgroundColor: Colors.surfaceRaised,
//     marginRight: Spacing.sm,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   gymChipActive: {
//     backgroundColor: Colors.primaryFaded,
//     borderColor: Colors.primary,
//   },
//   gymChipText: { color: Colors.textMuted, fontSize: Typography.xs },
//   gymChipTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
//   rangeTabs: {
//     flexDirection: "row",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     padding: 4,
//     marginBottom: Spacing.lg,
//   },
//   rangeTab: {
//     flex: 1,
//     paddingVertical: 8,
//     alignItems: "center",
//     borderRadius: Radius.md,
//   },
//   rangeTabActive: { backgroundColor: Colors.primary },
//   rangeTabText: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: Typography.medium,
//   },
//   rangeTabTextActive: { color: "#fff", fontWeight: Typography.bold },
//   alert: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     padding: Spacing.md,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     marginBottom: Spacing.sm,
//   },
//   alertText: {
//     fontSize: Typography.xs,
//     fontWeight: Typography.medium,
//     flex: 1,
//   },
//   revenueCard: { marginTop: Spacing.lg },
//   revenueLabel: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     marginBottom: 4,
//   },
//   revenueValue: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xxxl,
//     fontWeight: Typography.bold,
//     marginBottom: Spacing.md,
//   },
//   revenueSplit: {
//     flexDirection: "row",
//     gap: Spacing.xxl,
//     marginBottom: Spacing.md,
//   },
//   revenueSplitLabel: { color: Colors.textMuted, fontSize: Typography.xs },
//   revenueSplitValue: {
//     fontSize: Typography.lg,
//     fontWeight: Typography.bold,
//     marginTop: 2,
//   },
//   statsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: Spacing.sm,
//     marginTop: Spacing.lg,
//   },
//   sectionTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: Typography.semibold,
//     marginBottom: Spacing.md,
//   },
//   listRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: Spacing.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   listName: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: Typography.medium,
//   },
//   listSub: { color: Colors.textMuted, fontSize: Typography.xs },
//   activeBadge: {
//     backgroundColor: Colors.successFaded,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: Radius.full,
//   },
//   activeBadgeText: {
//     color: Colors.success,
//     fontSize: Typography.xs,
//     fontWeight: Typography.semibold,
//   },
//   rowBetween: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: Spacing.md,
//   },
//   seeAll: { color: Colors.primary, fontSize: Typography.sm },
// });

// mobile/src/screens/owner/DashboardScreen.tsx
import { ownerDashboardApi } from "@/api/endpoints";
import { Avatar, Card, Skeleton, StatCard } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardData {
  gyms: { id: string; name: string; city: string | null }[];
  totalMembers: number;
  activeGyms: number;
  range: string;
  rangeStart: string;
  rangeEnd: string;
  rangeRevenue: number;
  rangeSupplementRevenue: number;
  totalRevenue: number;
  rangeExpenses: number;
  todayExpenses: number;
  netRevenue: number;
  rangeAttendance: number;
  rangeNewMembers: number;
  todayRevenue: number;
  todayAttendance: number;
  todayNewMembers: number;
  expiringMembers: number;
  expiringMembers3: number;
  expiringToday: string[];
  dailyRevenue: { date: string; revenue: number }[];
  dailyMembershipRevenue: { date: string; amount: number }[];
  dailySupplementRevenue: { date: string; amount: number }[];
  dailyExpenses: { date: string; amount: number }[];
  recentMembers: {
    id: string;
    createdAt: string;
    status: string;
    profile: { fullName: string; avatarUrl: string | null };
    gym: { name: string };
  }[];
  todayCheckins: {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    member: { profile: { fullName: string; avatarUrl: string | null } };
  }[];
  recentSupplementSales: {
    id: string;
    qty: number;
    totalAmount: number;
    memberName: string | null;
    soldAt: string;
    supplement: { name: string; unitSize: string | null };
    member: { profile: { fullName: string } } | null;
  }[];
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    expenseDate: string;
    gym: { name: string };
  }[];
  lowStockAlerts?: {
    id: string;
    name: string;
    brand?: string | null;
    stockQty: number;
    lowStockAt: number;
    gymId: string;
  }[];
}

// ── Constants ──────────────────────────────────────────────────────────────────
const RANGES = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "Week" },
  { key: "this_month", label: "Month" },
  { key: "last_3_months", label: "3 Mo" },
  { key: "last_year", label: "Year" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const dy = Math.floor(diff / 86_400_000);
  if (dy > 0) return `${dy}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.max(0, m)}m ago`;
}

// ── Colors matching the reference image ─────────────────────────────────────
// Membership  = amber/orange (primary)
// Supplements = yellow-gold
// Expenses    = blue
const CHART_COLORS = {
  membership: Colors.primary, // orange-amber  ~#f97316
  supplement: "#eab308", // yellow-gold
  expense: "#3b82f6", // blue
};

// ── Multi-series bar chart ────────────────────────────────────────────────────
// Three bars per bucket always rendered (membership, supplement, expense).
// Zero-value bars show as a faint ghost so the grouped structure is always visible.
function RevenueChart({ data }: { data: DashboardData }) {
  const membership = data.dailyMembershipRevenue ?? [];
  const supplement = data.dailySupplementRevenue ?? [];
  const expenses = data.dailyExpenses ?? [];
  const labels = data.dailyRevenue.map((d) => d.date);

  if (!labels.length) return null;

  const allValues = [
    ...membership.map((d) => d.amount),
    ...supplement.map((d) => d.amount),
    ...expenses.map((d) => d.amount),
    1,
  ];
  const max = Math.max(...allValues);
  const BAR_H = 60;
  const showEvery = labels.length > 14 ? Math.ceil(labels.length / 7) : 1;

  const totalMem = membership.reduce((s, d) => s + d.amount, 0);
  const totalSupp = supplement.reduce((s, d) => s + d.amount, 0);
  const totalExp = expenses.reduce((s, d) => s + d.amount, 0);
  const net = totalMem + totalSupp - totalExp;

  return (
    <View>
      {/* Legend */}
      <View style={ch.legend}>
        {[
          { color: CHART_COLORS.membership, label: "Membership" },
          { color: CHART_COLORS.supplement, label: "Supplements" },
          { color: CHART_COLORS.expense, label: "Expenses" },
        ].map((l) => (
          <View key={l.label} style={ch.legendItem}>
            <View style={[ch.legendDot, { backgroundColor: l.color }]} />
            <Text style={ch.legendTxt}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Bars — always three per bucket */}
      <View style={[ch.barsWrap, { height: BAR_H }]}>
        {labels.map((_, i) => {
          const mem = membership[i]?.amount ?? 0;
          const supp = supplement[i]?.amount ?? 0;
          const exp = expenses[i]?.amount ?? 0;
          // Use minimum 2px height so zero-value bars are visible as ghosts
          const memH = max > 0 ? Math.max((mem / max) * BAR_H, 2) : 2;
          const suppH = max > 0 ? Math.max((supp / max) * BAR_H, 2) : 2;
          const expH = max > 0 ? Math.max((exp / max) * BAR_H, 2) : 2;

          return (
            <View key={i} style={ch.barGroup}>
              <View
                style={[
                  ch.bar,
                  {
                    height: memH,
                    backgroundColor: CHART_COLORS.membership,
                    opacity: mem > 0 ? 0.85 : 0.12,
                  },
                ]}
              />
              <View
                style={[
                  ch.bar,
                  {
                    height: suppH,
                    backgroundColor: CHART_COLORS.supplement,
                    opacity: supp > 0 ? 0.85 : 0.12,
                  },
                ]}
              />
              <View
                style={[
                  ch.bar,
                  {
                    height: expH,
                    backgroundColor: CHART_COLORS.expense,
                    opacity: exp > 0 ? 0.85 : 0.12,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Date labels */}
      <View style={ch.labelRow}>
        {labels.map((lbl, i) => {
          if (i % showEvery !== 0) {
            return <Text key={i} style={ch.labelTxt} />;
          }
          // Backend sends "D Mon" format e.g. "1 Mar", "15 Mar".
          // Show just the day number; keep full label on the 1st so month is visible.
          const parts = lbl.split(" ");
          const display = parts[0] === "1" ? lbl : parts[0];
          return (
            <Text key={i} style={ch.labelTxt} numberOfLines={1}>
              {display}
            </Text>
          );
        })}
      </View>

      {/* Summary totals */}
      <View style={ch.summaryRow}>
        <Text style={ch.summaryItem}>
          Mem:{" "}
          <Text style={{ color: CHART_COLORS.membership, fontWeight: "700" }}>
            {fmt(totalMem)}
          </Text>
        </Text>
        <Text style={ch.summaryItem}>
          Supp:{" "}
          <Text style={{ color: CHART_COLORS.supplement, fontWeight: "700" }}>
            {fmt(totalSupp)}
          </Text>
        </Text>
        <Text style={ch.summaryItem}>
          Exp:{" "}
          <Text style={{ color: CHART_COLORS.expense, fontWeight: "700" }}>
            −{fmt(totalExp)}
          </Text>
        </Text>
        <Text style={[ch.summaryItem, { marginLeft: "auto" as any }]}>
          Net:{" "}
          <Text
            style={{
              fontWeight: "700",
              color: net >= 0 ? Colors.success : Colors.error,
            }}
          >
            {fmt(net)}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendTxt: { color: Colors.textMuted, fontSize: 10 },
  barsWrap: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  barGroup: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 1 },
  bar: { flex: 1, borderRadius: 2, minHeight: 2 },
  labelRow: { flexDirection: "row", marginTop: 4 },
  labelTxt: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 8,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: { color: Colors.textMuted, fontSize: Typography.xs },
});

// ── Expiry alert ───────────────────────────────────────────────────────────────
function ExpiryAlert({
  names,
  count,
  days,
}: {
  names?: string[];
  count: number;
  days: number;
}) {
  if (!count) return null;
  const color =
    days === 0 ? Colors.error : days <= 3 ? Colors.warning : Colors.info;
  const bg =
    days === 0
      ? Colors.errorFaded
      : days <= 3
        ? Colors.warningFaded
        : Colors.infoFaded;
  return (
    <View style={[s.alert, { backgroundColor: bg, borderColor: color + "40" }]}>
      <Icon name="alert-circle-outline" size={16} color={color} />
      <Text style={[s.alertTxt, { color }]}>
        {days === 0
          ? `Last day: ${names?.join(", ") ?? count + " memberships"}`
          : `${count} expiring in ${days} day${days !== 1 ? "s" : ""}`}
      </Text>
    </View>
  );
}

// ── Quick action button ────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[qa.btn, { backgroundColor: bg + "22" }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[qa.iconWrap, { backgroundColor: bg + "33" }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[qa.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const qa = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 13,
  },
});

// ── Low stock alert item ───────────────────────────────────────────────────────

function StockAlertItem({
  item,
  onPress,
}: {
  item: NonNullable<DashboardData["lowStockAlerts"]>[0];
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isOut = item.stockQty === 0;
  const isCritical = !isOut && item.stockQty <= Math.floor(item.lowStockAt / 2);

  // Pulse animation for critical / out-of-stock
  useEffect(() => {
    if (!isOut && !isCritical) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isOut, isCritical]);

  const color = isOut ? Colors.error : isCritical ? Colors.warning : Colors.yellow;
  const bg = isOut ? Colors.errorFaded : isCritical ? Colors.warningFaded : Colors.yellowFaded;
  const label = isOut ? "Out of Stock" : isCritical ? "Critical" : "Low Stock";

  return (
    <TouchableOpacity style={[ls.row, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.75}>
      {(isOut || isCritical) && (
        <Animated.View style={[ls.pulse, { backgroundColor: color, opacity: pulse }]} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={ls.name} numberOfLines={1}>{item.name}</Text>
        {item.brand ? <Text style={ls.brand}>{item.brand}</Text> : null}
      </View>
      <View style={[ls.badge, { backgroundColor: bg }]}>
        <Text style={[ls.badgeTxt, { color }]}>{label}</Text>
      </View>
      <Text style={[ls.qty, { color }]}>{item.stockQty} left</Text>
    </TouchableOpacity>
  );
}

const ls = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "50",
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  name: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  brand: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  qty: { fontSize: Typography.xs, fontWeight: "700", flexShrink: 0, minWidth: 44, textAlign: "right" },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const [range, setRange] = useState("this_month");
  const [gymId, setGymId] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["ownerDashboard", range, gymId],
    queryFn: () =>
      ownerDashboardApi.get({
        range,
        gymId: gymId || undefined,
      }) as Promise<DashboardData>,
    staleTime: 2 * 60_000,
  });

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? "Month";

  const QUICK_ACTIONS = [
    {
      icon: "account-plus-outline",
      label: "Add Member",
      color: "#60a5fa",
      bg: "#3b82f6",
      screen: "OwnerMembers",
    },
    {
      icon: "calendar-check-outline",
      label: "Attendance",
      color: "#34d399",
      bg: "#10b981",
      screen: "Attendance",
    },
    {
      icon: "clipboard-list-outline",
      label: "Workouts",
      color: "#c084fc",
      bg: "#8b5cf6",
      screen: "OwnerWorkouts",
    },
    {
      icon: "chart-bar",
      label: "Reports",
      color: "#fb923c",
      bg: "#f97316",
      screen: "OwnerReports",
    },
    {
      icon: "shopping-outline",
      label: "Supplements",
      color: "#4ade80",
      bg: "#22c55e",
      screen: "OwnerSupplements",
    },
    {
      icon: "gift-outline",
      label: "Refer & Earn",
      color: "#facc15",
      bg: "#eab308",
      screen: "OwnerReferral",
    },
  ];

  const SkelRow = ({ n = 2 }: { n?: number }) => (
    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} height={88} style={{ flex: 1 }} />
      ))}
    </View>
  );

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
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.menuBtn}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Good {getGreeting()} 👋</Text>
            <Text style={s.name}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("OwnerProfile")}>
            <Avatar
              name={profile?.fullName ?? "O"}
              url={profile?.avatarUrl}
              size={42}
            />
          </TouchableOpacity>
        </View>

        {/* ── Gym filter ────────────────────────────────────────── */}
        {(data?.gyms?.length ?? 0) > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.md }}
          >
            {[{ id: "", name: "All Gyms" }, ...(data?.gyms ?? [])].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[s.gymChip, gymId === g.id && s.gymChipActive]}
              >
                <Text
                  style={[s.gymChipTxt, gymId === g.id && s.gymChipTxtActive]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Range tabs ────────────────────────────────────────── */}
        <View style={s.rangeTabs}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[s.rangeTab, range === r.key && s.rangeTabActive]}
            >
              <Text
                style={[s.rangeTabTxt, range === r.key && s.rangeTabTxtActive]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Expiry alerts ──────────────────────────────────────── */}
        {!isLoading && (
          <View style={{ gap: Spacing.sm }}>
            <ExpiryAlert
              names={data?.expiringToday}
              count={data?.expiringToday?.length ?? 0}
              days={0}
            />
            <ExpiryAlert count={data?.expiringMembers3 ?? 0} days={3} />
            <ExpiryAlert count={data?.expiringMembers ?? 0} days={7} />
          </View>
        )}

        {/* ── TODAY stats ────────────────────────────────────────── */}
        <Text style={s.sectionCap}>TODAY</Text>
        {isLoading ? (
          <SkelRow />
        ) : (
          <View style={s.statsGrid}>
            <StatCard
              icon="lightning-bolt-outline"
              label="Today's Revenue"
              value={fmt(data?.todayRevenue ?? 0)}
              color={Colors.primary}
              bg={Colors.primaryFaded}
            />
            <StatCard
              icon="calendar-check-outline"
              label="Check-ins Today"
              value={data?.todayAttendance ?? 0}
              color={Colors.success}
              bg={Colors.successFaded}
            />
            <StatCard
              icon="account-plus-outline"
              label="New Members"
              value={data?.todayNewMembers ?? 0}
              color="#3b82f6"
              bg="#3b82f620"
            />
            <StatCard
              icon="receipt-outline"
              label="Today Expenses"
              value={fmt(data?.todayExpenses ?? 0)}
              color={Colors.error}
              bg={Colors.errorFaded}
            />
          </View>
        )}

        {/* ── RANGE stats ────────────────────────────────────────── */}
        <Text style={s.sectionCap}>{rangeLabel.toUpperCase()}</Text>
        {isLoading ? (
          <SkelRow n={3} />
        ) : (
          <View style={s.statsGrid}>
            <StatCard
              icon="account-group-outline"
              label="Active Members"
              value={data?.totalMembers ?? 0}
              sub={`${data?.activeGyms ?? 0} gyms`}
            />
            <StatCard
              icon="account-plus-outline"
              label="New Joinings"
              value={data?.rangeNewMembers ?? 0}
              color="#3b82f6"
              bg="#3b82f620"
            />
            <StatCard
              icon="credit-card-outline"
              label="Membership Rev"
              value={fmt(data?.rangeRevenue ?? 0)}
              color={Colors.primary}
              bg={Colors.primaryFaded}
            />
            <StatCard
              icon="shopping-outline"
              label="Supplement Rev"
              value={fmt(data?.rangeSupplementRevenue ?? 0)}
              color={Colors.success}
              bg={Colors.successFaded}
            />
            <StatCard
              icon="trending-down"
              label="Total Expenses"
              value={fmt(data?.rangeExpenses ?? 0)}
              color={Colors.error}
              bg={Colors.errorFaded}
            />
            <StatCard
              icon="trending-up"
              label="Net Revenue"
              value={fmt(data?.netRevenue ?? 0)}
              color={
                (data?.netRevenue ?? 0) >= 0 ? Colors.success : Colors.error
              }
              bg={
                (data?.netRevenue ?? 0) >= 0
                  ? Colors.successFaded
                  : Colors.errorFaded
              }
            />
          </View>
        )}

        {/* ── Chart ─────────────────────────────────────────────── */}
        {!isLoading && (data?.dailyRevenue?.length ?? 0) > 0 && (
          <Card style={{ marginTop: Spacing.md }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>{rangeLabel}</Text>
              <Text style={s.cardSub}>Revenue breakdown</Text>
            </View>
            <RevenueChart data={data!} />
          </Card>
        )}

        {/* ── Low Stock Alerts ───────────────────────────────────── */}
        {!isLoading && (data?.lowStockAlerts?.length ?? 0) > 0 && (
          <Card style={{ marginTop: Spacing.md }}>
            <View style={s.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                <Icon name="alert-circle-outline" size={16} color={Colors.warning} />
                <Text style={s.cardTitle}>Low Stock Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("OwnerSupplements")}>
                <Text style={s.seeAll}>Manage</Text>
              </TouchableOpacity>
            </View>
            {[...(data!.lowStockAlerts ?? [])]
              .sort((a, b) => a.stockQty - b.stockQty)
              .map((item) => (
                <StockAlertItem
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate("OwnerSupplements")}
                />
              ))}
          </Card>
        )}

        {/* ── Quick actions ──────────────────────────────────────── */}
        <Text style={[s.sectionCap, { marginTop: Spacing.lg }]}>
          QUICK ACTIONS
        </Text>
        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map((q) => (
            <QuickAction
              key={q.screen}
              icon={q.icon}
              label={q.label}
              color={q.color}
              bg={q.bg}
              onPress={() => navigation.navigate(q.screen)}
            />
          ))}
        </View>

        {/* ── Recent Members + Today's Check-ins ─────────────────── */}
        <View style={s.twoCol}>
          {/* Recent Members */}
          <Card style={{ flex: 1 }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Recent Members</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerMembers")}
              >
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={{ gap: Spacing.sm }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </View>
            ) : (data?.recentMembers?.length ?? 0) === 0 ? (
              <View style={s.emptyCard}>
                <Icon
                  name="account-group-outline"
                  size={24}
                  color={Colors.textMuted}
                />
                <Text style={s.emptyCardTxt}>No members yet</Text>
              </View>
            ) : (
              <View style={{ gap: 2 }}>
                {data!.recentMembers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={s.listRow}
                    onPress={() =>
                      navigation.navigate("OwnerMemberDetail", {
                        memberId: m.id,
                      })
                    }
                  >
                    <Avatar
                      name={m.profile.fullName}
                      url={m.profile.avatarUrl}
                      size={32}
                    />
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <Text style={s.listName} numberOfLines={1}>
                        {m.profile.fullName}
                      </Text>
                      <Text style={s.listSub}>
                        {m.gym.name} · {timeAgo(m.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.statusBadge,
                        {
                          backgroundColor:
                            m.status === "ACTIVE"
                              ? Colors.successFaded
                              : Colors.surfaceRaised,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.statusTxt,
                          {
                            color:
                              m.status === "ACTIVE"
                                ? Colors.success
                                : Colors.textMuted,
                          },
                        ]}
                      >
                        {m.status === "ACTIVE" ? "Active" : m.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          {/* Today's Check-ins */}
          <Card style={{ flex: 1 }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Check-ins</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Attendance")}
              >
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={{ gap: Spacing.sm }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </View>
            ) : (data?.todayCheckins?.length ?? 0) === 0 ? (
              <View style={s.emptyCard}>
                <Icon
                  name="calendar-check-outline"
                  size={24}
                  color={Colors.textMuted}
                />
                <Text style={s.emptyCardTxt}>No check-ins today</Text>
              </View>
            ) : (
              <>
                <Text style={s.bigCount}>{data!.todayAttendance}</Text>
                <View style={{ gap: 2 }}>
                  {data!.todayCheckins.slice(0, 5).map((c) => (
                    <View key={c.id} style={s.listRow}>
                      <Avatar
                        name={c.member.profile.fullName}
                        url={c.member.profile.avatarUrl}
                        size={32}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <Text style={s.listName} numberOfLines={1}>
                          {c.member.profile.fullName}
                        </Text>
                        <Text style={s.listSub}>
                          {new Date(c.checkInTime).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.onlineDot,
                          {
                            backgroundColor: c.checkOutTime
                              ? Colors.border
                              : Colors.success,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>
        </View>

        {/* ── Recent Expenses ────────────────────────────────────── */}
        {(data?.recentExpenses?.length ?? 0) > 0 && (
          <Card style={{ marginTop: Spacing.md }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Recent Expenses</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerExpenses")}
              >
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {data!.recentExpenses.map((e) => (
              <View key={e.id} style={s.listRow}>
                <View style={s.expIcon}>
                  <Icon name="receipt-outline" size={16} color={Colors.error} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={s.listName} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={s.listSub}>
                    {e.gym.name} · {e.category} ·{" "}
                    {new Date(e.expenseDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
                <Text style={s.expAmt}>−{fmt(e.amount)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* ── Recent Supplement Sales ────────────────────────────── */}
        {(data?.recentSupplementSales?.length ?? 0) > 0 && (
          <Card style={{ marginTop: Spacing.md }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Supplement Sales</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerSupplements")}
              >
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={s.suppGrid}>
              {data!.recentSupplementSales.map((sale) => (
                <View key={sale.id} style={s.suppCard}>
                  <View style={s.suppIcon}>
                    <Icon
                      name="shopping-outline"
                      size={14}
                      color={Colors.success}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.suppName} numberOfLines={1}>
                      {sale.supplement.name}
                    </Text>
                    <Text style={s.suppSub} numberOfLines={1}>
                      {sale.member?.profile.fullName ??
                        sale.memberName ??
                        "Walk-in"}{" "}
                      · {sale.qty}×
                    </Text>
                  </View>
                  <Text style={s.suppAmt}>
                    ₹{Number(sale.totalAmount).toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { color: Colors.textMuted, fontSize: Typography.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  // Gym filter
  gymChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gymChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  gymChipTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  gymChipTxtActive: { color: Colors.primary, fontWeight: "700" },
  // Range tabs
  rangeTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 3,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  rangeTabActive: { backgroundColor: Colors.primary },
  rangeTabTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  rangeTabTxtActive: { color: "#fff", fontWeight: "800" },
  // Alerts
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  alertTxt: { fontSize: Typography.xs, fontWeight: "600", flex: 1 },
  // Section caps
  sectionCap: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // Stats grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  // Card
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  cardSub: { color: Colors.textMuted, fontSize: Typography.xs },
  seeAll: { color: Colors.primary, fontSize: Typography.xs },
  // Quick actions
  quickGrid: { flexDirection: "row", gap: Spacing.sm },
  // Two-column section
  twoCol: { flexDirection: "column", gap: Spacing.md },
  // List rows
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "60",
  },
  listName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  listSub: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusTxt: { fontSize: 10, fontWeight: "700" },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  bigCount: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyCardTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  // Expenses
  expIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  expAmt: { color: Colors.error, fontSize: Typography.xs, fontWeight: "700" },
  // Supplements
  suppGrid: { gap: Spacing.sm },
  suppCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
  },
  suppIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: Colors.successFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  suppName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  suppSub: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  suppAmt: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
    flexShrink: 0,
  },
});
