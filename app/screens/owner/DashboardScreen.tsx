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
// import { useNavigation } from "@react-navigation/native";
// import { useQuery } from "@tanstack/react-query";
// import React, { useState } from "react";
// import {
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

// function SparkLine({ data }: { data: { date: string; revenue: number }[] }) {
//   if (!data?.length) return null;
//   const max = Math.max(...data.map((d) => d.revenue), 1);
//   const W = 200;
//   const H = 40;
//   const pts = data.map((d, i) => ({
//     x: (i / (data.length - 1)) * W,
//     y: H - (d.revenue / max) * H,
//   }));
//   const path = pts
//     .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
//     .join(" ");
//   const fill = `${path} L${W},${H} L0,${H} Z`;

//   return (
//     <View style={{ height: H, overflow: "hidden" }}>
//       {/* Simple SVG-like representation using View bars */}
//       <View
//         style={{
//           flexDirection: "row",
//           alignItems: "flex-end",
//           height: H,
//           gap: 3,
//         }}
//       >
//         {data.map((d, i) => {
//           const barH = max > 0 ? (d.revenue / max) * H : 2;
//           return (
//             <View
//               key={i}
//               style={{
//                 flex: 1,
//                 height: Math.max(barH, 2),
//                 backgroundColor: Colors.primary,
//                 borderRadius: 2,
//                 opacity: 0.7,
//               }}
//             />
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
//     useQuery<DashboardResponse>({
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
//           <View>
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
//             </View>
//             <SparkLine data={data?.dailyRevenue ?? []} />
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

//         {/* ── Recent check-ins ───────────────────────────────── */}
//         {(data?.todayCheckins?.length ?? 0) > 0 && (
//           <View style={{ marginTop: Spacing.lg }}>
//             <Text style={styles.sectionTitle}>Today's Check-ins</Text>
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
import type {
  DashboardCheckin,
  DashboardRecentMember,
  DashboardResponse,
} from "@/types/api";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Extend DashboardResponse locally with new expense fields
type ExtendedDashboard = DashboardResponse & {
  rangeExpenses: number;
  todayExpenses: number;
  netRevenue: number;
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    expenseDate: string;
    gym: { name: string };
  }[];
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "Week" },
  { key: "this_month", label: "Month" },
  { key: "last_3_months", label: "3 Mon" },
  { key: "last_year", label: "Year" },
];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function SparkLine({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const W = 200;
  const H = 40;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.revenue / max) * H,
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const fill = `${path} L${W},${H} L0,${H} Z`;

  return (
    <View style={{ height: H, overflow: "hidden" }}>
      {/* Simple SVG-like representation using View bars */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: H,
          gap: 3,
        }}
      >
        {data.map((d, i) => {
          const barH = max > 0 ? (d.revenue / max) * H : 2;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(barH, 2),
                backgroundColor: Colors.primary,
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

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
    <View
      style={[styles.alert, { backgroundColor: bg, borderColor: color + "40" }]}
    >
      <Icon name="alert-circle-outline" size={16} color={color} />
      <Text style={[styles.alertText, { color }]}>
        {days === 0
          ? `Last day: ${names?.join(", ") ?? count + " memberships"}`
          : `${count} expiring in ${days} day${days !== 1 ? "s" : ""}`}
      </Text>
    </View>
  );
}

export default function OwnerDashboardScreen() {
  const navigation = useNavigation();
  const { profile } = useAuthStore();
  const [range, setRange] = useState("this_month");
  const [gymId, setGymId] = useState("");

  const { data, isLoading, refetch, isRefetching } =
    useQuery<ExtendedDashboard>({
      queryKey: ["ownerDashboard", range, gymId],
      queryFn: () =>
        ownerDashboardApi.get({ range, gymId: gymId || undefined }),
      staleTime: 2 * 60 * 1000,
    });

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.menuBtn}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("Profile")}
          >
            <Avatar
              name={profile?.fullName ?? "O"}
              url={profile?.avatarUrl}
              size={42}
            />
          </TouchableOpacity>
        </View>

        {/* ── Gym filter ─────────────────────────────────────── */}
        {(data?.gyms?.length ?? 0) > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gymFilter}
          >
            {[{ id: "", name: "All Gyms" }, ...(data?.gyms ?? [])].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[styles.gymChip, gymId === g.id && styles.gymChipActive]}
              >
                <Text
                  style={[
                    styles.gymChipText,
                    gymId === g.id && styles.gymChipTextActive,
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Range tabs ─────────────────────────────────────── */}
        <View style={styles.rangeTabs}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[
                styles.rangeTab,
                range === r.key && styles.rangeTabActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeTabText,
                  range === r.key && styles.rangeTabTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Expiry alerts ──────────────────────────────────── */}
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

        {/* ── Revenue card ───────────────────────────────────── */}
        {isLoading ? (
          <Skeleton height={140} style={{ marginTop: Spacing.lg }} />
        ) : (
          <Card style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {fmt(data?.totalRevenue ?? 0)}
            </Text>
            <View style={styles.revenueSplit}>
              <View>
                <Text style={styles.revenueSplitLabel}>Memberships</Text>
                <Text
                  style={[styles.revenueSplitValue, { color: Colors.primary }]}
                >
                  {fmt(data?.rangeRevenue ?? 0)}
                </Text>
              </View>
              <View>
                <Text style={styles.revenueSplitLabel}>Supplements</Text>
                <Text
                  style={[styles.revenueSplitValue, { color: Colors.success }]}
                >
                  {fmt(data?.rangeSupplementRevenue ?? 0)}
                </Text>
              </View>
            </View>
            <SparkLine data={data?.dailyRevenue ?? []} />
          </Card>
        )}

        {/* ── Stats grid ─────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.statsGrid}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={90} style={{ flex: 1 }} />
            ))}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon="account-group-outline"
              label="Members"
              value={data?.totalMembers ?? 0}
            />
            <StatCard
              icon="dumbbell"
              label="Active Gyms"
              value={data?.activeGyms ?? 0}
              color={Colors.info}
              bg={Colors.infoFaded}
            />
            <StatCard
              icon="calendar-check-outline"
              label="Check-ins"
              value={data?.todayAttendance ?? 0}
              color={Colors.success}
              bg={Colors.successFaded}
            />
            <StatCard
              icon="account-plus-outline"
              label="New Today"
              value={data?.todayNewMembers ?? 0}
              color={Colors.purple}
              bg={Colors.purpleFaded}
            />
          </View>
        )}

        {/* ── Recent Expenses ────────────────────────────────── */}
        {(data?.recentExpenses?.length ?? 0) > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("OwnerExpenses")}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {data!.recentExpenses.map(
              (e: ExtendedDashboard["recentExpenses"][0]) => (
                <View key={e.id} style={styles.listRow}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: Radius.md,
                      backgroundColor: Colors.errorFaded,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name="receipt-outline"
                      size={16}
                      color={Colors.error}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.listName} numberOfLines={1}>
                      {e.title}
                    </Text>
                    <Text style={styles.listSub}>
                      {new Date(e.expenseDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: Colors.error,
                      fontSize: Typography.sm,
                      fontWeight: "700",
                    }}
                  >
                    −{fmt(e.amount)}
                  </Text>
                </View>
              ),
            )}
          </View>
        )}

        {/* ── Recent check-ins ───────────────────────────────── */}
        {(data?.todayCheckins?.length ?? 0) > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={styles.sectionTitle}>Today's Check-ins</Text>
            {data!.todayCheckins.slice(0, 5).map((c: DashboardCheckin) => (
              <View key={c.id} style={styles.listRow}>
                <Avatar
                  name={c.member?.profile?.fullName ?? "?"}
                  url={c.member?.profile?.avatarUrl}
                  size={36}
                />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.listName}>
                    {c.member?.profile?.fullName}
                  </Text>
                  <Text style={styles.listSub}>
                    {new Date(c.checkInTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Recent members ─────────────────────────────────── */}
        {(data?.recentMembers?.length ?? 0) > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Recent Members</Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("Members")}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {data!.recentMembers.slice(0, 4).map((m: DashboardRecentMember) => (
              <TouchableOpacity
                key={m.id}
                style={styles.listRow}
                onPress={() =>
                  (navigation as any).navigate("OwnerMemberDetail", {
                    memberId: m.id,
                  })
                }
              >
                <Avatar
                  name={m.profile?.fullName ?? "?"}
                  url={m.profile?.avatarUrl}
                  size={36}
                />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.listName}>{m.profile?.fullName}</Text>
                  <Text style={styles.listSub}>{m.gym?.name}</Text>
                </View>
                <Icon name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  greeting: { color: Colors.textMuted, fontSize: Typography.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
  },
  gymFilter: { marginBottom: Spacing.md },
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
  gymChipText: { color: Colors.textMuted, fontSize: Typography.xs },
  gymChipTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  rangeTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  rangeTabActive: { backgroundColor: Colors.primary },
  rangeTabText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  rangeTabTextActive: { color: "#fff", fontWeight: Typography.bold },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  alertText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    flex: 1,
  },
  revenueCard: { marginTop: Spacing.lg },
  revenueLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: 4,
  },
  revenueValue: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  revenueSplit: {
    flexDirection: "row",
    gap: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  revenueSplitLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  revenueSplitValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  listSub: { color: Colors.textMuted, fontSize: Typography.xs },
  activeBadge: {
    backgroundColor: Colors.successFaded,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  seeAll: { color: Colors.primary, fontSize: Typography.sm },
});
