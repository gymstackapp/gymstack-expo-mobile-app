// // mobile/src/screens/member/GymsScreen.tsx
// // Shows all gyms the member has ever joined, sorted by start date desc.
// import { memberDashboardApi } from "@/api/endpoints";
// import { Badge, Button, Card, EmptyState, Header, SkeletonGroup } from "@/components";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useNavigation } from "@react-navigation/native";
// import { useQuery } from "@tanstack/react-query";
// import React from "react";
// import {
//     FlatList,
//     RefreshControl,
//     StyleSheet,
//     Text,
//     View
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// function formatDate(d: string | null | undefined) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }

// function daysRemaining(endDate: string | null | undefined): number | null {
//   if (!endDate) return null;
//   const diff = new Date(endDate).getTime() - Date.now();
//   return Math.ceil(diff / 86_400_000);
// }

// function StatusBadge({
//   status,
//   endDate,
// }: {
//   status: string;
//   endDate?: string | null;
// }) {
//   const days = daysRemaining(endDate);
//   if (status === "ACTIVE") {
//     if (days !== null && days <= 7 && days >= 0) {
//       return <Badge label={`Expires in ${days}d`} variant="warning" />;
//     }
//     if (days !== null && days < 0) {
//       return <Badge label="Expired" variant="error" />;
//     }
//     return <Badge label="Active" variant="success" />;
//   }
//   if (status === "EXPIRED") return <Badge label="Expired" variant="error" />;
//   if (status === "CANCELLED")
//     return <Badge label="Cancelled" variant="error" />;
//   return <Badge label={status} variant="default" />;
// }

// export function MemberGymsScreen() {
//   const navigation = useNavigation<any>();

//   // We reuse the dashboard API which already returns memberships[]
//   const { data, isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["memberDashboard"],
//     queryFn: memberDashboardApi.get,
//     staleTime: 60_000,
//   });

//   // Sort memberships by startDate desc (most recent first)
//   const memberships: any[] = [...(data?.memberships ?? [])].sort(
//     (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
//   );

//   return (
//     <SafeAreaView style={s.safe} edges={["top"]}>
//       <View style={s.headerWrap}>
//         <Header
//           title="My Gyms"
//           back
//           subtitle={
//             memberships.length > 0
//               ? `${memberships.length} membership${memberships.length > 1 ? "s" : ""}`
//               : undefined
//           }
//         />
//       </View>

//       {isLoading ? (
//         <View style={{ padding: Spacing.lg }}>
//           <SkeletonGroup variant="listRow" count={4} />
//         </View>
//       ) : memberships.length === 0 ? (
//         <EmptyState
//           icon="office-building-outline"
//           title="No gym memberships yet"
//           subtitle="Discover gyms near you and join to get started"
//           action={
//             <Button
//               label="Discover Gyms"
//               onPress={() => navigation.navigate("Discover")}
//             />
//           }
//         />
//       ) : (
//         <FlatList
//           data={memberships}
//           keyExtractor={(m) => m.id}
//           contentContainerStyle={{
//             padding: Spacing.lg,
//             paddingBottom: 40,
//             gap: Spacing.md,
//           }}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefetching}
//               onRefresh={refetch}
//               tintColor={Colors.primary}
//               colors={[Colors.primary]}
//             />
//           }
//           renderItem={({ item: m }) => {
//             const days = daysRemaining(m.endDate);
//             const isActive =
//               m.status === "ACTIVE" && (days === null || days >= 0);

//             return (
//               <Card>
//                 {/* Gym header */}
//                 <View style={s.gymHeader}>
//                   <View
//                     style={[
//                       s.gymIconWrap,
//                       {
//                         backgroundColor: isActive
//                           ? Colors.primaryFaded
//                           : Colors.surfaceRaised,
//                       },
//                     ]}
//                   >
//                     <Icon
//                       name="office-building-outline"
//                       size={22}
//                       color={isActive ? Colors.primary : Colors.textMuted}
//                     />
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.gymName}>{m.gym?.name ?? "Gym"}</Text>
//                     {m.gym?.city && (
//                       <View style={s.cityRow}>
//                         <Icon
//                           name="map-marker-outline"
//                           size={12}
//                           color={Colors.textMuted}
//                         />
//                         <Text style={s.cityText}>{m.gym.city}</Text>
//                       </View>
//                     )}
//                   </View>
//                   <StatusBadge status={m.status} endDate={m.endDate} />
//                 </View>

//                 {/* Plan */}
//                 {m.membershipPlan && (
//                   <View style={s.planRow}>
//                     <Icon name="tag-outline" size={14} color={Colors.primary} />
//                     <Text style={s.planName}>{m.membershipPlan.name}</Text>
//                     {m.membershipPlan.price && (
//                       <Text style={s.planPrice}>
//                         ₹
//                         {Number(m.membershipPlan.price).toLocaleString("en-IN")}
//                       </Text>
//                     )}
//                   </View>
//                 )}

//                 {/* Dates */}
//                 <View style={s.datesRow}>
//                   <View style={s.dateItem}>
//                     <Icon
//                       name="calendar-start"
//                       size={13}
//                       color={Colors.textMuted}
//                     />
//                     <View>
//                       <Text style={s.dateLabel}>Joined</Text>
//                       <Text style={s.dateValue}>{formatDate(m.startDate)}</Text>
//                     </View>
//                   </View>
//                   <View style={s.dateDivider} />
//                   <View style={s.dateItem}>
//                     <Icon
//                       name="calendar-end"
//                       size={13}
//                       color={Colors.textMuted}
//                     />
//                     <View>
//                       <Text style={s.dateLabel}>
//                         {m.endDate ? "Expires" : "Duration"}
//                       </Text>
//                       <Text
//                         style={[
//                           s.dateValue,
//                           days !== null &&
//                             days <= 7 &&
//                             days >= 0 && { color: Colors.warning },
//                           days !== null && days < 0 && { color: Colors.error },
//                         ]}
//                       >
//                         {m.endDate ? formatDate(m.endDate) : "Lifetime"}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Trainer */}
//                 {m.assignedTrainer && (
//                   <View style={s.trainerRow}>
//                     <Icon
//                       name="account-tie-outline"
//                       size={13}
//                       color={Colors.textMuted}
//                     />
//                     <Text style={s.trainerText}>
//                       Trainer:{" "}
//                       {m.assignedTrainer.profile?.fullName ?? "Assigned"}
//                     </Text>
//                   </View>
//                 )}

//                 {/* Stats row */}
//                 <View style={s.statsRow}>
//                   {[
//                     {
//                       icon: "calendar-check-outline",
//                       val: m.totalCheckins ?? 0,
//                       lbl: "Check-ins",
//                     },
//                     {
//                       icon: "fire",
//                       val: `${m.currentStreak ?? 0}d`,
//                       lbl: "Streak",
//                     },
//                     {
//                       icon: "trophy-outline",
//                       val: `${m.longestStreak ?? 0}d`,
//                       lbl: "Best",
//                     },
//                   ].map((st) => (
//                     <View key={st.lbl} style={s.statItem}>
//                       <Icon name={st.icon} size={13} color={Colors.primary} />
//                       <Text style={s.statVal}>{st.val}</Text>
//                       <Text style={s.statLbl}>{st.lbl}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </Card>
//             );
//           }}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
//   gymHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: Spacing.md,
//     marginBottom: Spacing.md,
//   },
//   gymIconWrap: {
//     width: 46,
//     height: 46,
//     borderRadius: Radius.lg,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   gymName: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//   },
//   cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
//   cityText: { color: Colors.textMuted, fontSize: Typography.xs },
//   planRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.xs,
//     backgroundColor: Colors.primaryFaded,
//     borderRadius: Radius.lg,
//     paddingHorizontal: Spacing.sm,
//     paddingVertical: 6,
//     marginBottom: Spacing.md,
//   },
//   planName: {
//     flex: 1,
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "600",
//   },
//   planPrice: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "800",
//   },
//   datesRow: {
//     flexDirection: "row",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     padding: Spacing.md,
//     marginBottom: Spacing.sm,
//   },
//   dateItem: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: Spacing.xs,
//   },
//   dateDivider: {
//     width: 1,
//     backgroundColor: Colors.border,
//     marginHorizontal: Spacing.sm,
//   },
//   dateLabel: { color: Colors.textMuted, fontSize: 10 },
//   dateValue: {
//     color: Colors.textPrimary,
//     fontSize: Typography.xs,
//     fontWeight: "700",
//     marginTop: 1,
//   },
//   trainerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.xs,
//     marginBottom: Spacing.sm,
//   },
//   trainerText: { color: Colors.textMuted, fontSize: Typography.xs },
//   statsRow: {
//     flexDirection: "row",
//     borderTopWidth: 1,
//     borderTopColor: Colors.border,
//     paddingTop: Spacing.sm,
//     gap: Spacing.sm,
//   },
//   statItem: { flex: 1, alignItems: "center", gap: 2 },
//   statVal: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "800",
//   },
//   statLbl: { color: Colors.textMuted, fontSize: 10 },
// });

// mobile/src/screens/member/GymsScreen.tsx
// Shows all gyms the member has ever joined, sorted by start date desc.
import { memberDashboardApi } from "@/api/endpoints";
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Header,
    SkeletonGroup,
} from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GymMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStreak: number | null;
  longestStreak: number | null;
  totalCheckins: number | null;
  gym: { id: string; name: string; city: string | null } | null;
  membershipPlan: {
    name: string;
    price: number;
    durationMonths: number;
  } | null;
  assignedTrainer: { profile: { fullName: string } } | null;
}

interface DashboardData {
  activeMembership: GymMembership | null;
  memberships: GymMembership[];
  streak: { current: number; longest: number; total: number };
  checkedInToday: boolean;
  milestones: any[];
  stats: Record<string, number | null>;
  recentAttendance: any[];
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function StatusBadge({
  status,
  endDate,
}: {
  status: string;
  endDate?: string | null;
}) {
  const days = daysRemaining(endDate);
  if (status === "ACTIVE") {
    if (days !== null && days <= 7 && days >= 0) {
      return <Badge label={`Expires in ${days}d`} variant="warning" />;
    }
    if (days !== null && days < 0) {
      return <Badge label="Expired" variant="error" />;
    }
    return <Badge label="Active" variant="success" />;
  }
  if (status === "EXPIRED") return <Badge label="Expired" variant="error" />;
  if (status === "CANCELLED")
    return <Badge label="Cancelled" variant="error" />;
  return <Badge label={status} variant="default" />;
}

export default function MemberGymsScreen() {
  const navigation = useNavigation<any>();

  // We reuse the dashboard API which already returns memberships[]
  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["memberDashboard"],
    queryFn: memberDashboardApi.get as () => Promise<DashboardData>,
    staleTime: 60_000,
  });

  // Sort memberships by startDate desc (most recent first)
  const memberships: GymMembership[] = [...(data?.memberships ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          title="My Gyms"
          back
          subtitle={
            memberships.length > 0
              ? `${memberships.length} membership${memberships.length > 1 ? "s" : ""}`
              : undefined
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="listRow" count={4} />
        </View>
      ) : memberships.length === 0 ? (
        <EmptyState
          icon="office-building-outline"
          title="No gym memberships yet"
          subtitle="Discover gyms near you and join to get started"
          action={
            <Button
              label="Discover Gyms"
              onPress={() => navigation.navigate("Discover")}
              variant="primary"
            />
          }
        />
      ) : (
        <FlatList
          data={memberships}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
            gap: Spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item: m }) => {
            const days = daysRemaining(m.endDate);
            const isActive =
              m.status === "ACTIVE" && (days === null || days >= 0);

            return (
              <Card>
                {/* Gym header */}
                <View style={s.gymHeader}>
                  <View
                    style={[
                      s.gymIconWrap,
                      {
                        backgroundColor: isActive
                          ? Colors.primaryFaded
                          : Colors.surfaceRaised,
                      },
                    ]}
                  >
                    <Icon
                      name="office-building-outline"
                      size={22}
                      color={isActive ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.gymName}>{m.gym?.name ?? "Gym"}</Text>
                    {m.gym?.city && (
                      <View style={s.cityRow}>
                        <Icon
                          name="map-marker-outline"
                          size={12}
                          color={Colors.textMuted}
                        />
                        <Text style={s.cityText}>{m.gym.city}</Text>
                      </View>
                    )}
                  </View>
                  <StatusBadge status={m.status} endDate={m.endDate} />
                </View>

                {/* Plan */}
                {m.membershipPlan && (
                  <View style={s.planRow}>
                    <Icon name="tag-outline" size={14} color={Colors.primary} />
                    <Text style={s.planName}>{m.membershipPlan.name}</Text>
                    {m.membershipPlan.price && (
                      <Text style={s.planPrice}>
                        ₹
                        {Number(m.membershipPlan.price).toLocaleString("en-IN")}
                      </Text>
                    )}
                  </View>
                )}

                {/* Dates */}
                <View style={s.datesRow}>
                  <View style={s.dateItem}>
                    <Icon
                      name="calendar-start"
                      size={13}
                      color={Colors.textMuted}
                    />
                    <View>
                      <Text style={s.dateLabel}>Joined</Text>
                      <Text style={s.dateValue}>{formatDate(m.startDate)}</Text>
                    </View>
                  </View>
                  <View style={s.dateDivider} />
                  <View style={s.dateItem}>
                    <Icon
                      name="calendar-end"
                      size={13}
                      color={Colors.textMuted}
                    />
                    <View>
                      <Text style={s.dateLabel}>
                        {m.endDate ? "Expires" : "Duration"}
                      </Text>
                      <Text
                        style={[
                          s.dateValue,
                          days !== null &&
                            days <= 7 &&
                            days >= 0 && { color: Colors.warning },
                          days !== null && days < 0 && { color: Colors.error },
                        ]}
                      >
                        {m.endDate ? formatDate(m.endDate) : "Lifetime"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Trainer */}
                {m.assignedTrainer && (
                  <View style={s.trainerRow}>
                    <Icon
                      name="account-tie-outline"
                      size={13}
                      color={Colors.textMuted}
                    />
                    <Text style={s.trainerText}>
                      Trainer:{" "}
                      {m.assignedTrainer.profile?.fullName ?? "Assigned"}
                    </Text>
                  </View>
                )}

                {/* Stats row */}
                <View style={s.statsRow}>
                  {[
                    {
                      icon: "calendar-check-outline",
                      val: m.totalCheckins ?? 0,
                      lbl: "Check-ins",
                    },
                    {
                      icon: "fire",
                      val: `${m.currentStreak ?? 0}d`,
                      lbl: "Streak",
                    },
                    {
                      icon: "trophy-outline",
                      val: `${m.longestStreak ?? 0}d`,
                      lbl: "Best",
                    },
                  ].map((st) => (
                    <View key={st.lbl} style={s.statItem}>
                      <Icon name={st.icon} size={13} color={Colors.primary} />
                      <Text style={s.statVal}>{st.val}</Text>
                      <Text style={s.statLbl}>{st.lbl}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  gymHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gymIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  cityText: { color: Colors.textMuted, fontSize: Typography.xs },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  planName: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  planPrice: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "800",
  },
  datesRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  dateDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  dateLabel: { color: Colors.textMuted, fontSize: 10 },
  dateValue: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "700",
    marginTop: 1,
  },
  trainerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  trainerText: { color: Colors.textMuted, fontSize: Typography.xs },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "800",
  },
  statLbl: { color: Colors.textMuted, fontSize: 10 },
});
