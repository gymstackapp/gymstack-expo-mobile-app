// // mobile/src/screens/owner/ReportsScreen.tsx
// import React, { useState } from "react"
// import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import { reportsApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, PlanGate, StatCard, Skeleton, SectionHeader } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
//   if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
//   return `₹${n.toLocaleString("en-IN")}`
// }

// const RANGES = [
//   { key: "this_month",    label: "Month" },
//   { key: "last_3_months", label: "3 Mon" },
//   { key: "last_6_months", label: "6 Mon" },
//   { key: "last_year",     label: "Year" },
//   { key: "all",           label: "All" },
// ]

// function MiniBar({ data }: { data: { month: string; revenue: number }[] }) {
//   if (!data?.length) return null
//   const max = Math.max(...data.map(d => d.revenue), 1)
//   return (
//     <View style={{ flexDirection: "row", alignItems: "flex-end", height: 48, gap: 3 }}>
//       {data.map((d, i) => {
//         const h = Math.max((d.revenue / max) * 40, 2)
//         return (
//           <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
//             <View style={{ width: "100%", height: h, backgroundColor: Colors.primary, borderRadius: 2, opacity: 0.8 }} />
//             <Text style={{ color: Colors.textMuted, fontSize: 8 }} numberOfLines={1}>{d.month}</Text>
//           </View>
//         )
//       })}
//     </View>
//   )
// }

// function ReportsContent() {
//   const [range,  setRange]  = useState("last_6_months")
//   const [gymId,  setGymId]  = useState("")

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })
//   const { data, isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerReports", range, gymId],
//     queryFn:  () => reportsApi.get({ range, gymId: gymId || undefined }),
//     staleTime: 2 * 60_000,
//   })

//   // const s = data?.summary

//   return (
//     <ScrollView
//       contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg }}
//       showsVerticalScrollIndicator={false}
//       refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//     >
//       {/* Range selector */}
//       <View style={rs.rangeRow}>
//         {RANGES.map(r => (
//           <TouchableOpacity key={r.key} onPress={() => setRange(r.key)} style={[rs.rangePill, range === r.key && rs.rangePillA]}>
//             <Text style={[rs.rangeText, range === r.key && rs.rangeTextA]}>{r.label}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Gym filter */}
//       {/* {gyms.length > 1 && (
//         <View style={rs.gymRow}>
//           {[{ id: "", name: "All Gyms" }, ...(gyms as any[])].map((g: any) => (
//             <TouchableOpacity key={g.id} onPress={() => setGymId(g.id)} style={[rs.gymPill, gymId === g.id && rs.gymPillA]}>
//               <Text style={[rs.gymText, gymId === g.id && rs.gymTextA]} numberOfLines={1}>{g.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )} */}

//       {/* Summary stats */}
//       {isLoading ? (
//         <>
//           <View style={rs.statsGrid}>
//             {[...Array(4)].map((_, i) => <Skeleton key={i} height={90} style={{ flex: 1 }} />)}
//           </View>
//           <Skeleton height={120} />
//         </>
//       ) : (
//         <>
//           {/* <View style={rs.statsGrid}>
//             <StatCard icon="trending-up"          label="Total Revenue"   value={fmt(s?.totalRevenue ?? 0)}       color={Colors.primary}  bg={Colors.primaryFaded} />
//             <StatCard icon="credit-card-outline"  label="Membership Rev"  value={fmt(s?.membershipRevenue ?? 0)}  color={Colors.info}     bg={Colors.infoFaded} />
//             <StatCard icon="account-group-outline" label="Active Members"  value={s?.totalMembers ?? 0}            color={Colors.success}  bg={Colors.successFaded} />
//             <StatCard icon="account-plus-outline" label="New Members"     value={s?.newMembers ?? 0}               color={Colors.purple}   bg={Colors.purpleFaded} />
//           </View>
//           <View style={rs.statsGrid}>
//             <StatCard icon="shopping-outline"     label="Supplement Rev"  value={fmt(s?.supplementRevenue ?? 0)}  color={Colors.warning}  bg={Colors.warningFaded} />
//             <StatCard icon="calendar-check-outline" label="Attendance"    value={s?.totalAttendance ?? 0}          color={Colors.textSecondary} bg={Colors.surfaceRaised} />
//           </View> */}
//           <Text>Data</Text>

//           {/* Revenue chart */}
//           {/* {data?.revenue?.length > 0 && (
//             <Card>
//               <SectionHeader title="Revenue" />
//               <MiniBar data={data.revenue} />
//             </Card>
//           )} */}

//           {/* Per-gym table */}
//           {/* {data?.topGyms?.length > 0 && (
//             <View>
//               <SectionHeader title="By Gym" />
//               {data.topGyms.map((g: any) => (
//                 <Card key={g.name} style={{ marginBottom: Spacing.sm }}>
//                   <Text style={rs.gymName}>{g.name}</Text>
//                   <View style={rs.gymStatsRow}>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Revenue</Text>
//                       <Text style={[rs.gymStatValue, { color: Colors.primary }]}>{fmt(g.revenue)}</Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Members</Text>
//                       <Text style={rs.gymStatValue}>{g.members}</Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>New</Text>
//                       <Text style={[rs.gymStatValue, { color: Colors.success }]}>+{g.newMembers}</Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Check-ins</Text>
//                       <Text style={rs.gymStatValue}>{g.attendance}</Text>
//                     </View>
//                   </View>
//                 </Card>
//               ))}
//             </View>
//           )} */}
//         </>
//       )}
//     </ScrollView>
//   )
// }

// export function OwnerReportsScreen() {
//   const { hasFullReports } = useSubscription()
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
//         <Header title="Reports" subtitle="Analytics overview" back />
//       </View>
//       <PlanGate allowed={hasFullReports} featureLabel="Full Reports & Analytics">
//         <ReportsContent />
//       </PlanGate>
//     </SafeAreaView>
//   )
// }

// const rs = StyleSheet.create({
//   rangeRow:    { flexDirection: "row", backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, padding: 4 },
//   rangePill:   { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: Radius.md },
//   rangePillA:  { backgroundColor: Colors.primary },
//   rangeText:   { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500" },
//   rangeTextA:  { color: "#fff", fontWeight: "700" },
//   gymRow:      { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
//   gymPill:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border },
//   gymPillA:    { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
//   gymText:     { color: Colors.textMuted, fontSize: Typography.xs },
//   gymTextA:    { color: Colors.primary, fontWeight: "700" },
//   statsGrid:   { flexDirection: "row", gap: Spacing.sm },
//   gymName:     { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700", marginBottom: Spacing.sm },
//   gymStatsRow: { flexDirection: "row", gap: Spacing.sm },
//   gymStat:     { flex: 1, alignItems: "center" },
//   gymStatLabel:{ color: Colors.textMuted, fontSize: 10 },
//   gymStatValue:{ color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700", marginTop: 2 },
// })

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ReportsScreen = () => {
  return (
    <View>
      <Text>ReportsScreen</Text>
    </View>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({});
