// // mobile/src/screens/owner/ReportsScreen.tsx
// import { gymsApi, reportsApi } from "@/api/endpoints";
// import {
//   Card,
//   Header,
//   PlanGate,
//   SectionHeader,
//   Skeleton,
//   StatCard,
// } from "@/components";
// import { useSubscription } from "@/hooks/useSubsciption";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
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

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
//   if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// const RANGES = [
//   { key: "this_month", label: "Month" },
//   { key: "last_3_months", label: "3 Mon" },
//   { key: "last_6_months", label: "6 Mon" },
//   { key: "last_year", label: "Year" },
//   { key: "all", label: "All" },
// ];

// function MiniBar({ data }: { data: { month: string; revenue: number }[] }) {
//   if (!data?.length) return null;
//   const max = Math.max(...data.map((d) => d.revenue), 1);
//   return (
//     <View
//       style={{
//         flexDirection: "row",
//         alignItems: "flex-end",
//         height: 48,
//         gap: 3,
//       }}
//     >
//       {data.map((d, i) => {
//         const h = Math.max((d.revenue / max) * 40, 2);
//         return (
//           <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
//             <View
//               style={{
//                 width: "100%",
//                 height: h,
//                 backgroundColor: Colors.primary,
//                 borderRadius: 2,
//                 opacity: 0.8,
//               }}
//             />
//             <Text
//               style={{ color: Colors.textMuted, fontSize: 8 }}
//               numberOfLines={1}
//             >
//               {d.month}
//             </Text>
//           </View>
//         );
//       })}
//     </View>
//   );
// }

// function ReportsContent() {
//   const [range, setRange] = useState("last_6_months");
//   const [gymId, setGymId] = useState("");

//   const { data: gyms = [] } = useQuery({
//     queryKey: ["ownerGyms"],
//     queryFn: gymsApi.list,
//     staleTime: 5 * 60_000,
//   });
//   const { data, isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerReports", range, gymId],
//     queryFn: () => reportsApi.get({ range, gymId: gymId || undefined }),
//     staleTime: 2 * 60_000,
//   });

//   const s = data?.summary;

//   return (
//     <ScrollView
//       contentContainerStyle={{
//         padding: Spacing.lg,
//         paddingBottom: 40,
//         gap: Spacing.lg,
//       }}
//       showsVerticalScrollIndicator={false}
//       refreshControl={
//         <RefreshControl
//           refreshing={isRefetching}
//           onRefresh={refetch}
//           tintColor={Colors.primary}
//           colors={[Colors.primary]}
//         />
//       }
//     >
//       {/* Range selector */}
//       <View style={rs.rangeRow}>
//         {RANGES.map((r) => (
//           <TouchableOpacity
//             key={r.key}
//             onPress={() => setRange(r.key)}
//             style={[rs.rangePill, range === r.key && rs.rangePillA]}
//           >
//             <Text style={[rs.rangeText, range === r.key && rs.rangeTextA]}>
//               {r.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Gym filter */}
//       {gyms.length > 1 && (
//         <View style={rs.gymRow}>
//           {[{ id: "", name: "All Gyms" }, ...(gyms as any[])].map((g: any) => (
//             <TouchableOpacity
//               key={g.id}
//               onPress={() => setGymId(g.id)}
//               style={[rs.gymPill, gymId === g.id && rs.gymPillA]}
//             >
//               <Text
//                 style={[rs.gymText, gymId === g.id && rs.gymTextA]}
//                 numberOfLines={1}
//               >
//                 {g.name}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}

//       {/* Summary stats */}
//       {isLoading ? (
//         <>
//           <View style={rs.statsGrid}>
//             {[...Array(4)].map((_, i) => (
//               <Skeleton key={i} height={90} style={{ flex: 1 }} />
//             ))}
//           </View>
//           <Skeleton height={120} />
//         </>
//       ) : (
//         <>
//           <View style={rs.statsGrid}>
//             <StatCard
//               icon="trending-up"
//               label="Total Revenue"
//               value={fmt(s?.totalRevenue ?? 0)}
//               color={Colors.primary}
//               bg={Colors.primaryFaded}
//             />
//             <StatCard
//               icon="credit-card-outline"
//               label="Membership Rev"
//               value={fmt(s?.membershipRevenue ?? 0)}
//               color={Colors.info}
//               bg={Colors.infoFaded}
//             />
//             <StatCard
//               icon="account-group-outline"
//               label="Active Members"
//               value={s?.totalMembers ?? 0}
//               color={Colors.success}
//               bg={Colors.successFaded}
//             />
//             <StatCard
//               icon="account-plus-outline"
//               label="New Members"
//               value={s?.newMembers ?? 0}
//               color={Colors.purple}
//               bg={Colors.purpleFaded}
//             />
//           </View>
//           <View style={rs.statsGrid}>
//             <StatCard
//               icon="shopping-outline"
//               label="Supplement Rev"
//               value={fmt(s?.supplementRevenue ?? 0)}
//               color={Colors.warning}
//               bg={Colors.warningFaded}
//             />
//             <StatCard
//               icon="calendar-check-outline"
//               label="Attendance"
//               value={s?.totalAttendance ?? 0}
//               color={Colors.textSecondary}
//               bg={Colors.surfaceRaised}
//             />
//           </View>
//           <Text>Data</Text>

//           {/* Revenue chart */}
//           {data?.revenue?.length > 0 && (
//             <Card>
//               <SectionHeader title="Revenue" />
//               <MiniBar data={data.revenue} />
//             </Card>
//           )}

//           {/* Per-gym table */}
//           {data?.topGyms?.length > 0 && (
//             <View>
//               <SectionHeader title="By Gym" />
//               {data.topGyms.map((g: any) => (
//                 <Card key={g.name} style={{ marginBottom: Spacing.sm }}>
//                   <Text style={rs.gymName}>{g.name}</Text>
//                   <View style={rs.gymStatsRow}>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Revenue</Text>
//                       <Text
//                         style={[rs.gymStatValue, { color: Colors.primary }]}
//                       >
//                         {fmt(g.revenue)}
//                       </Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Members</Text>
//                       <Text style={rs.gymStatValue}>{g.members}</Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>New</Text>
//                       <Text
//                         style={[rs.gymStatValue, { color: Colors.success }]}
//                       >
//                         +{g.newMembers}
//                       </Text>
//                     </View>
//                     <View style={rs.gymStat}>
//                       <Text style={rs.gymStatLabel}>Check-ins</Text>
//                       <Text style={rs.gymStatValue}>{g.attendance}</Text>
//                     </View>
//                   </View>
//                 </Card>
//               ))}
//             </View>
//           )}
//         </>
//       )}
//     </ScrollView>
//   );
// }

// export default function OwnerReportsScreen() {
//   const { hasFullReports } = useSubscription();
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
//         <Header title="Reports" subtitle="Analytics overview" menu />
//       </View>
//       <PlanGate
//         allowed={hasFullReports}
//         featureLabel="Full Reports & Analytics"
//       >
//         <ReportsContent />
//       </PlanGate>
//     </SafeAreaView>
//   );
// }

// const rs = StyleSheet.create({
//   rangeRow: {
//     flexDirection: "row",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     padding: 4,
//   },
//   rangePill: {
//     flex: 1,
//     paddingVertical: 8,
//     alignItems: "center",
//     borderRadius: Radius.md,
//   },
//   rangePillA: { backgroundColor: Colors.primary },
//   rangeText: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: "500",
//   },
//   rangeTextA: { color: "#fff", fontWeight: "700" },
//   gymRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
//   gymPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: Radius.full,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   gymPillA: {
//     backgroundColor: Colors.primaryFaded,
//     borderColor: Colors.primary,
//   },
//   gymText: { color: Colors.textMuted, fontSize: Typography.xs },
//   gymTextA: { color: Colors.primary, fontWeight: "700" },
//   statsGrid: { flexDirection: "row", gap: Spacing.sm },
//   gymName: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//     marginBottom: Spacing.sm,
//   },
//   gymStatsRow: { flexDirection: "row", gap: Spacing.sm },
//   gymStat: { flex: 1, alignItems: "center" },
//   gymStatLabel: { color: Colors.textMuted, fontSize: 10 },
//   gymStatValue: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "700",
//     marginTop: 2,
//   },
// });

// mobile/src/screens/owner/ReportsScreen.tsx
// Full feature parity with web reports page:
//   - 8 summary stat cards (members, new, membership rev, supplement rev,
//     total revenue, expenses, net revenue, attendance)
//   - Stacked bar chart: membership + supplement revenue per bucket
//   - Line chart: new member growth per bucket
//   - Per-gym breakdown cards (members, new, attendance, membership rev,
//     supplement rev, total, expenses, net revenue)
import { gymsApi, reportsApi } from "@/api/endpoints";
import { Card, Header, PlanGate, Skeleton } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarChart as GiftedBar,
  LineChart as GiftedLine,
} from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

// ── Chart colors (match web) ──────────────────────────────────────────────────
const MEM_COLOR = Colors.primary; // orange-amber
const SUPP_COLOR = "#22c55e"; // green
const LINE_COLOR = Colors.primary; // member growth line
const LOCKER_COLOR = "hsl(217 91% 60%)"; // purple-blue

// ── Types ─────────────────────────────────────────────────────────────────────
interface RevenueBucket {
  label: string;
  total: number;
  membershipRev: number;
  supplementRev: number;
  lockerRev: number;
}

interface GrowthBucket {
  label: string;
  count: number;
}

interface GymReport {
  name: string;
  activeMembers: number;
  newMembers: number;
  attendance: number;
  membershipRev: number;
  supplementRev: number;
  lockerRev: number;
  totalRevenue: number;
  expenses: number;
  netRevenue: number;
}

interface ReportSummary {
  totalMembers: number;
  newMembers: number;
  totalRevenue: number;
  membershipRevenue: number;
  supplementRevenue: number;
  totalAttendance: number;
  totalExpenses: number;
  netRevenue: number;
}

interface ReportData {
  revenueSeries: RevenueBucket[];
  memberGrowthSeries: GrowthBucket[];
  topGyms: GymReport[];
  summary: ReportSummary;
  range: string;
  dateRange?: { start: string; end: string };
}

// ── Range config ──────────────────────────────────────────────────────────────
const RANGES = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "Week" },
  { key: "this_month", label: "Month" },
  { key: "last_quarter", label: "Qtr" },
  { key: "last_6_months", label: "6 Mo" },
  { key: "last_year", label: "Year" },
  { key: "all", label: "All" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n?.toLocaleString("en-IN")}`;
}

// ── Shared chart config ───────────────────────────────────────────────────────
const CHART_W = SW - Spacing.lg * 4; // card + scroll padding
const Y_AXIS_W = 52;
const BAR_AREA = CHART_W - Y_AXIS_W;

function getBarMetrics(count: number) {
  const perSlot = BAR_AREA / Math.max(count, 1);
  const barWidth = Math.max(6, Math.floor(perSlot * 0.65));
  const spacing = Math.max(2, Math.floor(perSlot * 0.35));
  return { barWidth, spacing };
}

const LABEL_STYLE = { color: Colors.textMuted, fontSize: 8 };

const CHART_THEME = {
  backgroundColor: "transparent" as const,
  rulesColor: Colors.border,
  yAxisTextStyle: { color: Colors.textMuted, fontSize: 9 },
  yAxisThickness: 0,
  xAxisThickness: 0,
  noOfSections: 4,
};

function fmtY(v: string): string {
  const n = Number(v);
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

// ── Stacked bar chart (membership + supplement + lockers) ─────────────────────
function StackedBarChart({ data }: { data: RevenueBucket[] }) {
  if (!data?.length) return null;

  const { barWidth, spacing } = getBarMetrics(data.length);

  const stackData = data.map((d) => ({
    stacks: [
      { value: d.membershipRev || 0, color: MEM_COLOR },
      { value: d.supplementRev || 0, color: SUPP_COLOR, marginBottom: 1 },
      { value: d.lockerRev || 0, color: LOCKER_COLOR, marginBottom: 1 },
    ],
    label: d.label,
    labelTextStyle: LABEL_STYLE,
  }));

  const totalMem = data.reduce((s, d) => s + d.membershipRev, 0);
  const totalSupp = data.reduce((s, d) => s + d.supplementRev, 0);
  const totalLock = data.reduce((s, d) => s + d.lockerRev, 0);

  return (
    <View>
      {/* Legend */}
      <View style={ch.legend}>
        {(
          [
            [MEM_COLOR, "Membership"],
            [SUPP_COLOR, "Supplements"],
            [LOCKER_COLOR, "Lockers"],
          ] as const
        ).map(([color, label]) => (
          <View key={label} style={ch.legendItem}>
            <View style={[ch.legendDot, { backgroundColor: color }]} />
            <Text style={ch.legendTxt}>{label}</Text>
          </View>
        ))}
      </View>

      <GiftedBar
        stackData={stackData}
        width={BAR_AREA}
        height={140}
        barWidth={barWidth}
        spacing={spacing}
        initialSpacing={spacing / 2}
        formatYLabel={fmtY}
        {...CHART_THEME}
      />

      {/* Summary */}
      <View style={ch.chartSummary}>
        <Text style={ch.chartSummaryTxt}>
          Membership:{" "}
          <Text style={{ color: MEM_COLOR, fontWeight: "700" }}>
            {fmt(totalMem)}
          </Text>
        </Text>
        <Text style={ch.chartSummaryTxt}>
          Supplements:{" "}
          <Text style={{ color: SUPP_COLOR, fontWeight: "700" }}>
            {fmt(totalSupp)}
          </Text>
        </Text>
        {totalLock > 0 && (
          <Text style={ch.chartSummaryTxt}>
            Lockers:{" "}
            <Text style={{ color: LOCKER_COLOR, fontWeight: "700" }}>
              {fmt(totalLock)}
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Line chart (member growth) ────────────────────────────────────────────────
function LineChart({ data }: { data: GrowthBucket[] }) {
  if (!data?.length || data.every((d) => d.count === 0)) {
    return (
      <View style={lc.empty}>
        <Text style={lc.emptyTxt}>No new members in this period</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    value: d.count,
    label: d.label,
    labelTextStyle: LABEL_STYLE,
  }));

  return (
    <GiftedLine
      data={chartData}
      areaChart
      curved
      width={BAR_AREA}
      height={130}
      color={LINE_COLOR}
      thickness={2}
      startFillColor={LINE_COLOR}
      endFillColor={LINE_COLOR}
      startOpacity={0.3}
      endOpacity={0.02}
      dataPointsColor={LINE_COLOR}
      dataPointsRadius={4}
      formatYLabel={(v) => String(Math.round(Number(v)))}
      {...CHART_THEME}
    />
  );
}

// ── Stat card row item ────────────────────────────────────────────────────────
function StatItem({
  icon,
  label,
  value,
  color = Colors.textPrimary,
  bg = Colors.surfaceRaised,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[si.wrap, { backgroundColor: bg + "30" }]}>
      <View style={[si.iconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <Text style={[si.value, { color }]}>{value}</Text>
      <Text style={si.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Gym breakdown card ────────────────────────────────────────────────────────
function GymCard({ g }: { g: GymReport }) {
  const net = g.netRevenue ?? g.totalRevenue - (g.expenses ?? 0);
  return (
    <Card style={gc.card}>
      {/* Gym name */}
      <View style={gc.header}>
        <View style={gc.iconWrap}>
          <Icon name="dumbbell" size={16} color={Colors.primary} />
        </View>
        <Text style={gc.name}>{g.name}</Text>
      </View>

      {/* Row 1: members, new, attendance */}
      <View style={gc.row}>
        <View style={gc.cell}>
          <Text style={gc.cellVal}>{g.activeMembers}</Text>
          <Text style={gc.cellLbl}>Active</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: Colors.success }]}>
            +{g.newMembers}
          </Text>
          <Text style={gc.cellLbl}>New</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: "#a78bfa" }]}>{g.attendance}</Text>
          <Text style={gc.cellLbl}>Check-ins</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={gc.divider} />

      {/* Row 2: revenue breakdown */}
      <View style={gc.row}>
        <View style={gc.cell}>
          <Text style={[gc.cellVal, { color: Colors.primary }]}>
            {fmt(g.membershipRev)}
          </Text>
          <Text style={gc.cellLbl}>Membership</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: SUPP_COLOR }]}>
            {fmt(g.supplementRev)}
          </Text>
          <Text style={gc.cellLbl}>Supplements</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: Colors.textPrimary }]}>
            {fmt(g.totalRevenue)}
          </Text>
          <Text style={gc.cellLbl}>Total Rev</Text>
        </View>
      </View>

      {/* Row 2b: locker revenue (only show if non-zero) */}
      {(g.lockerRev ?? 0) > 0 && (
        <View style={[gc.row, { marginTop: Spacing.xs }]}>
          <View style={gc.cell}>
            <Text style={[gc.cellVal, { color: LOCKER_COLOR }]}>
              {fmt(g.lockerRev ?? 0)}
            </Text>
            <Text style={gc.cellLbl}>Lockers</Text>
          </View>
          <View style={gc.cell} />
          <View style={gc.cell} />
        </View>
      )}

      {/* Row 3: expenses + net */}
      {(g.expenses > 0 || net !== g.totalRevenue) && (
        <View style={[gc.row, { marginTop: Spacing.xs }]}>
          <View style={gc.cell}>
            <Text style={[gc.cellVal, { color: Colors.error }]}>
              −{fmt(g.expenses ?? 0)}
            </Text>
            <Text style={gc.cellLbl}>Expenses</Text>
          </View>
          <View style={[gc.cell, gc.cellBorder]}>
            <Text
              style={[
                gc.cellVal,
                { color: net >= 0 ? Colors.success : Colors.error },
              ]}
            >
              {fmt(net)}
            </Text>
            <Text style={gc.cellLbl}>Net Revenue</Text>
          </View>
          <View style={gc.cell} />
        </View>
      )}
    </Card>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function ReportsContent() {
  const [range, setRange] = useState("this_month");
  const [gymId, setGymId] = useState("");

  const { data: gyms = [] } = useQuery<any[]>({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list as () => Promise<any[]>,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery<ReportData>({
    queryKey: ["ownerReports", range, gymId],
    queryFn: () =>
      reportsApi.get({
        range,
        gymId: gymId || undefined,
      }) as Promise<ReportData>,
    staleTime: 2 * 60_000,
  });

  const s = data?.summary;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? range;

  const STATS = [
    {
      icon: "account-group-outline",
      label: "Active Members",
      value: s?.totalMembers ?? 0,
      fmt: (n: number) => String(n),
      color: "#60a5fa",
      bg: "#3b82f620",
    },
    {
      icon: "account-plus-outline",
      label: "New Members",
      value: s?.newMembers ?? 0,
      fmt: (n: number) => String(n),
      color: Colors.success,
      bg: Colors.successFaded,
    },
    {
      icon: "credit-card-outline",
      label: "Membership Rev",
      value: s?.membershipRevenue ?? 0,
      fmt,
      color: Colors.primary,
      bg: Colors.primaryFaded,
    },
    {
      icon: "shopping-outline",
      label: "Supplement Rev",
      value: s?.supplementRevenue ?? 0,
      fmt,
      color: SUPP_COLOR,
      bg: SUPP_COLOR + "20",
    },
    {
      icon: "trending-up",
      label: "Total Revenue",
      value: s?.totalRevenue ?? 0,
      fmt,
      color: Colors.textPrimary,
      bg: Colors.surfaceRaised,
    },
    {
      icon: "receipt-outline",
      label: "Total Expenses",
      value: s?.totalExpenses ?? 0,
      fmt,
      color: Colors.error,
      bg: Colors.errorFaded,
    },
    {
      icon: "chart-line",
      label: "Net Revenue",
      value: s?.netRevenue ?? 0,
      fmt,
      color: (s?.netRevenue ?? 0) >= 0 ? Colors.success : Colors.error,
      bg: (s?.netRevenue ?? 0) >= 0 ? Colors.successFaded : Colors.errorFaded,
    },
    {
      icon: "calendar-check-outline",
      label: "Attendance",
      value: s?.totalAttendance ?? 0,
      fmt: (n: number) => String(n),
      color: "#a78bfa",
      bg: "#8b5cf620",
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={s2.scroll}
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
      {/* ── Range tabs ───────────────────────────────────────── */}
      <View style={s2.rangeTabs}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setRange(r.key)}
            style={[s2.rangeTab, range === r.key && s2.rangeTabActive]}
          >
            <Text
              style={[s2.rangeTabTxt, range === r.key && s2.rangeTabTxtActive]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Gym filter ───────────────────────────────────────── */}
      {gyms.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{ flexDirection: "row", gap: Spacing.xs, paddingBottom: 2 }}
          >
            {[{ id: "", name: "All Gyms" }, ...gyms].map((g: any) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[s2.gymChip, gymId === g.id && s2.gymChipActive]}
              >
                <Text
                  style={[s2.gymChipTxt, gymId === g.id && s2.gymChipTxtActive]}
                  numberOfLines={1}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Date range label ─────────────────────────────────── */}
      {data?.dateRange && (
        <Text style={s2.dateRange}>
          {new Date(data.dateRange.start).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          {" — "}
          {new Date(data.dateRange.end).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      )}

      {/* ── Stats grid (8 cards, 2 per row) ─────────────────── */}
      {isLoading ? (
        <View style={s2.skeletonGrid}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height={88} style={{ width: "47%" }} />
          ))}
        </View>
      ) : (
        <View style={s2.statsGrid}>
          {STATS.map((st) => (
            <View key={st.label} style={s2.statCell}>
              <StatItem
                icon={st.icon}
                label={st.label}
                value={st.fmt(st.value as number)}
                color={st.color}
                bg={st.bg}
              />
            </View>
          ))}
        </View>
      )}

      {/* ── Revenue stacked bar chart ────────────────────────── */}
      <Card>
        <View style={s2.cardHeader}>
          <Text style={s2.cardTitle}>Revenue Breakdown</Text>
          <Text style={s2.cardSub}>{rangeLabel}</Text>
        </View>
        {isLoading ? (
          <Skeleton height={96} />
        ) : (data?.revenueSeries?.length ?? 0) === 0 ? (
          <View style={s2.emptyChart}>
            <Icon name="chart-bar" size={24} color={Colors.textMuted} />
            <Text style={s2.emptyChartTxt}>No data for this period</Text>
          </View>
        ) : (
          <StackedBarChart data={data?.revenueSeries ?? []} />
        )}
      </Card>

      {/* ── Member growth line chart ─────────────────────────── */}
      <Card>
        <View style={s2.cardHeader}>
          <Text style={s2.cardTitle}>New Member Growth</Text>
          <Text style={s2.cardSub}>{rangeLabel}</Text>
        </View>
        {isLoading ? (
          <Skeleton height={80} />
        ) : (
          <LineChart data={data?.memberGrowthSeries ?? []} />
        )}
      </Card>

      {/* ── Per-gym breakdown ────────────────────────────────── */}
      {(data?.topGyms?.length ?? 0) > 0 && (
        <View style={{ gap: Spacing.sm }}>
          <View style={s2.cardHeader}>
            <Text style={s2.cardTitle}>Per-Gym Breakdown</Text>
            <Text style={s2.cardSub}>{rangeLabel}</Text>
          </View>
          {data!.topGyms.map((g, i) => (
            <GymCard key={i} g={g} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Root screen ───────────────────────────────────────────────────────────────
export default function OwnerReportsScreen() {
  const { hasFullReports } = useSubscription();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      edges={["top"]}
    >
      <View
        style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
      >
        <Header title="Reports" subtitle="Analytics & performance" menu />
      </View>
      <PlanGate
        allowed={hasFullReports}
        featureLabel="Full Reports & Analytics"
      >
        <ReportsContent />
      </PlanGate>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ch = StyleSheet.create({
  legend: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendTxt: { color: Colors.textMuted, fontSize: 10 },
  chartSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chartSummaryTxt: { color: Colors.textMuted, fontSize: Typography.xs },
});

const lc = StyleSheet.create({
  empty: { paddingVertical: Spacing.lg, alignItems: "center" },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.xs },
});

const si = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: Typography.lg, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 10 },
});

const gc = StyleSheet.create({
  card: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    flex: 1,
  },
  row: { flexDirection: "row" },
  cell: { flex: 1, alignItems: "center", paddingVertical: Spacing.xs },
  cellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  cellVal: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "800",
  },
  cellLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});

const s2 = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },
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
  // Gym filter
  gymChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gymChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  gymChipTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  gymChipTxtActive: { color: Colors.primary, fontWeight: "700" },
  // Date range label
  dateRange: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "right",
  },
  // Stats grid
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  statCell: { width: "47.5%" },
  // Card
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  cardSub: { color: Colors.textMuted, fontSize: Typography.xs },
  emptyChart: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyChartTxt: { color: Colors.textMuted, fontSize: Typography.sm },
});
