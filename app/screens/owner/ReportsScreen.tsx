// app/screens/owner/ReportsScreen.tsx
// Full feature parity with web reports page:
//   – 9 summary stat cards (members, new, membership/supplement/locker rev,
//     total revenue, expenses, net revenue, attendance)
//   – Stacked bar chart: membership + supplement + locker revenue per bucket
//   – Line chart: new member growth
//   – Line chart: attendance check-ins
//   – Line chart: locker revenue (shown only when data exists)
//   – [Premium] Dual line chart: Revenue vs Expenses
//   – [Premium] Expense trend chart + net revenue card with margin %
//   – Upgrade prompt for Basic plan
//   – Custom date range via RangePicker
import { gymsApi, reportsApi } from "@/api/endpoints";
import { Card, Header, PlanGate, RangePicker, Skeleton } from "@/components";
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

const MEM_COLOR   = Colors.primary;   // orange — membership
const SUPP_COLOR  = "#22c55e";        // green  — supplements
const LOCKER_COLOR = "#60a5fa";       // blue   — lockers
const LINE_COLOR  = Colors.primary;   // member growth
const ATTEND_COLOR = "#a78bfa";       // violet — attendance
const EXPENSE_COLOR = Colors.error;   // red    — expenses

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueBucket {
  label: string;
  total: number;
  membershipRev: number;
  supplementRev: number;
  lockerRev: number;
}

interface CountBucket  { label: string; count: number }
interface AmountBucket { label: string; amount: number }

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
  lockerRevenue: number;
  totalAttendance: number;
  totalExpenses: number;
  netRevenue: number;
}

interface ReportData {
  revenueSeries: RevenueBucket[];
  memberGrowthSeries: CountBucket[];
  attendanceSeries: CountBucket[];
  expenseSeries: AmountBucket[];
  lockerRevenueSeries: AmountBucket[];
  topGyms: GymReport[];
  summary: ReportSummary;
  range: string;
  isPremium: boolean;
  dateRange?: { start: string; end: string };
}

// ── Range options ─────────────────────────────────────────────────────────────

const RANGES = [
  { key: "today",          label: "Today"                     },
  { key: "last_7_days",    label: "Last 7 Days"               },
  { key: "last_30_days",   label: "Last 30 Days"              },
  { key: "last_90_days",   label: "This Quarter (90 days)"    },
  { key: "financial_year", label: "Financial Year (Apr–Mar)"  },
  { key: "custom",         label: "Custom Range"              },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n?.toLocaleString("en-IN")}`;
}

// ── Chart config ──────────────────────────────────────────────────────────────

const CHART_W  = SW - Spacing.lg * 4;
const Y_AXIS_W = 52;
const BAR_AREA = CHART_W - Y_AXIS_W;

const CHART_THEME = {
  backgroundColor:  "transparent" as const,
  rulesColor:       Colors.border,
  yAxisTextStyle:   { color: Colors.textMuted, fontSize: 9 },
  yAxisThickness:   0,
  xAxisThickness:   0,
  noOfSections:     4,
};

function fmtY(v: string): string {
  const n = Number(v);
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

// ── Stacked bar chart (membership + supplement + lockers) ─────────────────────

function StackedBarChart({ data }: { data: RevenueBucket[] }) {
  if (!data?.length) return null;

  const n        = data.length;
  const barW     = n <= 7 ? 24 : n <= 14 ? 18 : n <= 31 ? 12 : n <= 90 ? 8 : 6;
  const spacing  = n <= 7 ? 20 : n <= 14 ? 14 : n <= 31 ? 10 : n <= 90 ? 6 : 4;
  const contentW = Math.max(BAR_AREA, Y_AXIS_W + 4 + n * (barW + spacing));

  // Clone each item + stacks so the library can freely mutate them (isActiveClone fix)
  const stackData = data.map((d) => ({
    stacks: [
      { value: d.membershipRev || 0, color: MEM_COLOR },
      { value: d.supplementRev || 0, color: SUPP_COLOR, marginBottom: 1 },
      { value: d.lockerRev     || 0, color: LOCKER_COLOR, marginBottom: 1 },
    ],
    label: d.label,
    labelTextStyle: { color: Colors.textMuted, fontSize: 8 },
  }));

  const totalMem  = data.reduce((s, d) => s + d.membershipRev, 0);
  const totalSupp = data.reduce((s, d) => s + d.supplementRev, 0);
  const totalLock = data.reduce((s, d) => s + d.lockerRev, 0);

  return (
    <View>
      {/* Legend */}
      <View style={ch.legend}>
        {([
          [MEM_COLOR,    "Membership"],
          [SUPP_COLOR,   "Supplements"],
          [LOCKER_COLOR, "Lockers"],
        ] as const).map(([color, label]) => (
          <View key={label} style={ch.legendItem}>
            <View style={[ch.legendDot, { backgroundColor: color }]} />
            <Text style={ch.legendTxt}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={ch.chartScroll}
      >
        <GiftedBar
          stackData={stackData}
          width={contentW}
          height={140}
          barWidth={barW}
          spacing={spacing}
          initialSpacing={spacing / 2}
          formatYLabel={fmtY}
          {...CHART_THEME}
        />
      </ScrollView>

      {/* Summary totals */}
      <View style={ch.chartSummary}>
        <Text style={ch.summaryTxt}>
          Membership:{" "}
          <Text style={{ color: MEM_COLOR, fontWeight: "700" }}>{fmt(totalMem)}</Text>
        </Text>
        <Text style={ch.summaryTxt}>
          Supplements:{" "}
          <Text style={{ color: SUPP_COLOR, fontWeight: "700" }}>{fmt(totalSupp)}</Text>
        </Text>
        {totalLock > 0 && (
          <Text style={ch.summaryTxt}>
            Lockers:{" "}
            <Text style={{ color: LOCKER_COLOR, fontWeight: "700" }}>{fmt(totalLock)}</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Single area line chart (members, attendance, locker revenue) ──────────────

function AreaLineChart({
  data,
  valueKey,
  color,
  emptyMsg = "No data for this period",
  formatY = fmtY,
}: {
  data: any[];
  valueKey: string;
  color: string;
  emptyMsg?: string;
  formatY?: (v: string) => string;
}) {
  if (!data?.length || data.every((d) => (d[valueKey] ?? 0) === 0)) {
    return (
      <View style={ch.emptyChart}>
        <Text style={ch.emptyChartTxt}>{emptyMsg}</Text>
      </View>
    );
  }

  // Fresh objects per item so the library can add isActiveClone without throwing
  const chartData = data.map((d) => ({
    value: d[valueKey] ?? 0,
    label: String(d.label ?? ""),
    labelTextStyle: { color: Colors.textMuted, fontSize: 8 },
  }));

  const n        = chartData.length;
  const ptGap    = n <= 7 ? 40 : n <= 14 ? 30 : n <= 31 ? 20 : n <= 90 ? 12 : 8;
  const contentW = Math.max(BAR_AREA, Y_AXIS_W + 4 + n * ptGap);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      style={ch.chartScroll}
    >
      <GiftedLine
        data={chartData}
        areaChart
        curved
        width={contentW}
        height={120}
        spacing={ptGap}
        color={color}
        thickness={2}
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.3}
        endOpacity={0.02}
        dataPointsColor={color}
        dataPointsRadius={4}
        formatYLabel={formatY}
        {...CHART_THEME}
      />
    </ScrollView>
  );
}


// ── Stat item card ────────────────────────────────────────────────────────────

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
    <View style={[si.wrap, { borderColor: Colors.border }]}>
      <View style={[si.iconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <Text style={[si.value, { color }]}>{value}</Text>
      <Text style={si.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ── Gym breakdown card ────────────────────────────────────────────────────────

function GymCard({ g }: { g: GymReport }) {
  const net = g.netRevenue ?? g.totalRevenue - (g.expenses ?? 0);
  return (
    <Card style={gc.card}>
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
          <Text style={[gc.cellVal, { color: Colors.success }]}>+{g.newMembers}</Text>
          <Text style={gc.cellLbl}>New</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: ATTEND_COLOR }]}>{g.attendance}</Text>
          <Text style={gc.cellLbl}>Check-ins</Text>
        </View>
      </View>

      <View style={gc.divider} />

      {/* Row 2: revenue breakdown */}
      <View style={gc.row}>
        <View style={gc.cell}>
          <Text style={[gc.cellVal, { color: Colors.primary }]}>{fmt(g.membershipRev)}</Text>
          <Text style={gc.cellLbl}>Membership</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: SUPP_COLOR }]}>{fmt(g.supplementRev)}</Text>
          <Text style={gc.cellLbl}>Supplements</Text>
        </View>
        <View style={[gc.cell, gc.cellBorder]}>
          <Text style={[gc.cellVal, { color: Colors.textPrimary }]}>{fmt(g.totalRevenue)}</Text>
          <Text style={gc.cellLbl}>Total Rev</Text>
        </View>
      </View>

      {/* Row 3: locker (only if non-zero) */}
      {(g.lockerRev ?? 0) > 0 && (
        <View style={[gc.row, { marginTop: Spacing.xs }]}>
          <View style={gc.cell}>
            <Text style={[gc.cellVal, { color: LOCKER_COLOR }]}>{fmt(g.lockerRev ?? 0)}</Text>
            <Text style={gc.cellLbl}>Lockers</Text>
          </View>
          <View style={gc.cell} />
          <View style={gc.cell} />
        </View>
      )}

      {/* Row 4: expenses + net */}
      {(g.expenses > 0 || net !== g.totalRevenue) && (
        <View style={[gc.row, { marginTop: Spacing.xs }]}>
          <View style={gc.cell}>
            <Text style={[gc.cellVal, { color: Colors.error }]}>−{fmt(g.expenses ?? 0)}</Text>
            <Text style={gc.cellLbl}>Expenses</Text>
          </View>
          <View style={[gc.cell, gc.cellBorder]}>
            <Text style={[gc.cellVal, { color: net >= 0 ? Colors.success : Colors.error }]}>
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

// ── Reports content ───────────────────────────────────────────────────────────

function ReportsContent() {
  const { hasFullReports } = useSubscription();
  const [range,   setRange]   = useState("last_30_days");
  const [customS, setCustomS] = useState("");
  const [customE, setCustomE] = useState("");
  const [gymId,   setGymId]   = useState("");

  const { data: gyms = [] } = useQuery<any[]>({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list as () => Promise<any[]>,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery<ReportData>({
    queryKey: ["ownerReports", range, gymId, customS, customE],
    queryFn: () =>
      reportsApi.get({
        range,
        gymId: gymId || undefined,
        ...(range === "custom" && customS && customE
          ? { customStart: customS, customEnd: customE }
          : {}),
      }) as Promise<ReportData>,
    staleTime: 2 * 60_000,
  });

  const s            = data?.summary;
  const isPremium    = data?.isPremium ?? hasFullReports;
  const rangeLabel   = RANGES.find((r) => r.key === range)?.label ?? "Last 30 Days";
  const hasLocker    = (s?.lockerRevenue ?? 0) > 0 ||
    (data?.lockerRevenueSeries ?? []).some((b) => b.amount > 0);

  const STATS = [
    {
      icon: "account-group-outline",
      label: "Active Members",
      value: s?.totalMembers ?? 0,
      fmtFn: (n: number) => String(n),
      color: LOCKER_COLOR,
      bg: LOCKER_COLOR + "20",
    },
    {
      icon: "account-plus-outline",
      label: "New Members",
      value: s?.newMembers ?? 0,
      fmtFn: (n: number) => String(n),
      color: Colors.success,
      bg: Colors.successFaded,
    },
    {
      icon: "credit-card-outline",
      label: "Membership Rev",
      value: s?.membershipRevenue ?? 0,
      fmtFn: fmt,
      color: Colors.primary,
      bg: Colors.primaryFaded,
    },
    {
      icon: "shopping-outline",
      label: "Supplement Rev",
      value: s?.supplementRevenue ?? 0,
      fmtFn: fmt,
      color: SUPP_COLOR,
      bg: SUPP_COLOR + "20",
    },
    {
      icon: "lock-outline",
      label: "Locker Revenue",
      value: s?.lockerRevenue ?? 0,
      fmtFn: fmt,
      color: LOCKER_COLOR,
      bg: LOCKER_COLOR + "20",
    },
    {
      icon: "trending-up",
      label: "Total Revenue",
      value: s?.totalRevenue ?? 0,
      fmtFn: fmt,
      color: Colors.textPrimary,
      bg: Colors.surfaceRaised,
    },
    {
      icon: "receipt-outline",
      label: "Total Expenses",
      value: s?.totalExpenses ?? 0,
      fmtFn: fmt,
      color: Colors.error,
      bg: Colors.errorFaded,
    },
    {
      icon: "chart-line",
      label: "Net Revenue",
      value: s?.netRevenue ?? 0,
      fmtFn: fmt,
      color: (s?.netRevenue ?? 0) >= 0 ? Colors.success : Colors.error,
      bg:    (s?.netRevenue ?? 0) >= 0 ? Colors.successFaded : Colors.errorFaded,
    },
    {
      icon: "calendar-check-outline",
      label: "Attendance",
      value: s?.totalAttendance ?? 0,
      fmtFn: (n: number) => String(n),
      color: ATTEND_COLOR,
      bg:    ATTEND_COLOR + "20",
    },
  ];

  const dateHint = data?.dateRange
    ? `${new Date(data.dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — ${new Date(data.dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "";

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
      {/* ── Range picker ─────────────────────────────────────────── */}
      <RangePicker
        options={RANGES}
        value={range}
        customStart={customS}
        customEnd={customE}
        onChange={(r, cs, ce) => {
          setRange(r);
          if (r === "custom") {
            setCustomS(cs ?? "");
            setCustomE(ce ?? "");
          } else {
            setCustomS("");
            setCustomE("");
          }
        }}
      />

      {/* ── Gym filter ───────────────────────────────────────────── */}
      {gyms.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: Spacing.xs, paddingBottom: 2 }}>
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

      {/* Date hint */}
      {dateHint ? (
        <Text style={s2.dateRange}>{dateHint}</Text>
      ) : null}

      {/* ── Stats grid (9 cards, 2-per-row) ─────────────────────── */}
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
                value={st.fmtFn(st.value as number)}
                color={st.color}
                bg={st.bg}
              />
            </View>
          ))}
        </View>
      )}

      {/* ── Revenue stacked bar chart ────────────────────────────── */}
      <Card>
        <View style={s2.cardHeader}>
          <Text style={s2.cardTitle}>Revenue Breakdown</Text>
          <Text style={s2.cardSub}>{rangeLabel}</Text>
        </View>
        {isLoading ? (
          <Skeleton height={96} />
        ) : (data?.revenueSeries?.length ?? 0) === 0 ? (
          <View style={ch.emptyChart}>
            <Icon name="chart-bar" size={24} color={Colors.textMuted} />
            <Text style={ch.emptyChartTxt}>No data for this period</Text>
          </View>
        ) : (
          <StackedBarChart data={data?.revenueSeries ?? []} />
        )}
      </Card>

      {/* ── Member growth line chart ─────────────────────────────── */}
      <Card>
        <View style={s2.cardHeader}>
          <Text style={s2.cardTitle}>New Member Growth</Text>
          <Text style={s2.cardSub}>{rangeLabel}</Text>
        </View>
        {isLoading ? (
          <Skeleton height={80} />
        ) : (
          <AreaLineChart
            data={data?.memberGrowthSeries ?? []}
            valueKey="count"
            color={LINE_COLOR}
            emptyMsg="No new members in this period"
            formatY={(v) => String(Math.round(Number(v)))}
          />
        )}
        {data && !isLoading && (
          <View style={s2.chartFooter}>
            <Text style={s2.chartFooterTxt}>
              Total:{" "}
              <Text style={{ color: LINE_COLOR, fontWeight: "700" }}>
                {(data.memberGrowthSeries ?? []).reduce((acc, d) => acc + d.count, 0)}{" "}
                new members
              </Text>
            </Text>
          </View>
        )}
      </Card>

      {/* ── Attendance chart ─────────────────────────────────────── */}
      <Card>
        <View style={s2.cardHeader}>
          <Text style={s2.cardTitle}>Attendance</Text>
          <Text style={s2.cardSub}>Check-ins · {rangeLabel}</Text>
        </View>
        {isLoading ? (
          <Skeleton height={80} />
        ) : (
          <AreaLineChart
            data={data?.attendanceSeries ?? []}
            valueKey="count"
            color={ATTEND_COLOR}
            emptyMsg="No check-ins in this period"
            formatY={(v) => String(Math.round(Number(v)))}
          />
        )}
        {data && !isLoading && (
          <View style={s2.chartFooter}>
            <Text style={s2.chartFooterTxt}>
              Total:{" "}
              <Text style={{ color: ATTEND_COLOR, fontWeight: "700" }}>
                {(data.attendanceSeries ?? []).reduce((acc, d) => acc + d.count, 0)}{" "}
                check-ins
              </Text>
            </Text>
          </View>
        )}
      </Card>

      {/* ── Locker revenue chart (only when data exists) ─────────── */}
      {(hasLocker || isLoading) && (
        <Card style={s2.lockerCard}>
          <View style={s2.cardHeader}>
            <View style={s2.cardTitleRow}>
              <View style={s2.lockerIcon}>
                <Icon name="lock-outline" size={14} color={LOCKER_COLOR} />
              </View>
              <View>
                <Text style={s2.cardTitle}>Locker Revenue</Text>
                <Text style={s2.cardSub}>Fee collected · {rangeLabel}</Text>
              </View>
            </View>
            {(s?.lockerRevenue ?? 0) > 0 ? (
              <Text style={[s2.cardBigVal, { color: LOCKER_COLOR }]}>
                {fmt(s!.lockerRevenue)}
              </Text>
            ) : null}
          </View>
          {isLoading ? (
            <Skeleton height={80} />
          ) : (
            <AreaLineChart
              data={data?.lockerRevenueSeries ?? []}
              valueKey="amount"
              color={LOCKER_COLOR}
              emptyMsg="No locker fees in this period"
            />
          )}
        </Card>
      )}

      {/* ── [Premium] Revenue vs Expenses + Expense trend ────────── */}
      {isPremium && (
        <>
          {/* Revenue vs Expenses — two separate charts avoids data2 mutation bug */}
          <Card style={s2.premiumCard}>
            <View style={s2.cardHeader}>
              <View>
                <Text style={s2.cardTitle}>Revenue vs Expenses</Text>
                <Text style={s2.cardSub}>{rangeLabel}</Text>
              </View>
            </View>
            {isLoading ? (
              <Skeleton height={96} />
            ) : (
              <>
                {/* Revenue line */}
                <View style={ch.legendItem}>
                  <View style={[ch.legendDash, { backgroundColor: MEM_COLOR }]} />
                  <Text style={ch.legendTxt}>Revenue</Text>
                </View>
                <AreaLineChart
                  data={(data?.revenueSeries ?? []).map((d) => ({
                    label: d.label,
                    amount: d.total,
                  }))}
                  valueKey="amount"
                  color={MEM_COLOR}
                  emptyMsg="No revenue data"
                />
                {/* Expenses line */}
                <View style={[ch.legendItem, { marginTop: Spacing.md }]}>
                  <View style={[ch.legendDash, { backgroundColor: EXPENSE_COLOR }]} />
                  <Text style={ch.legendTxt}>Expenses</Text>
                </View>
                <AreaLineChart
                  data={data?.expenseSeries ?? []}
                  valueKey="amount"
                  color={EXPENSE_COLOR}
                  emptyMsg="No expense data"
                />
              </>
            )}
            {data && !isLoading && (
              <View style={s2.chartFooter}>
                <Text style={s2.chartFooterTxt}>
                  Revenue:{" "}
                  <Text style={{ color: MEM_COLOR, fontWeight: "700" }}>
                    {fmt(s?.totalRevenue ?? 0)}
                  </Text>
                  {"  "}Expenses:{" "}
                  <Text style={{ color: EXPENSE_COLOR, fontWeight: "700" }}>
                    {fmt(s?.totalExpenses ?? 0)}
                  </Text>
                </Text>
              </View>
            )}
          </Card>

          {/* Expense trend */}
          <Card style={s2.premiumCard}>
            <View style={s2.cardHeader}>
              <View>
                <Text style={s2.cardTitle}>Expense Trend</Text>
                <Text style={s2.cardSub}>{rangeLabel}</Text>
              </View>
              {data && !isLoading ? (
                <Text style={[s2.cardBigVal, { color: EXPENSE_COLOR }]}>
                  {fmt(s?.totalExpenses ?? 0)}
                </Text>
              ) : null}
            </View>
            {isLoading ? (
              <Skeleton height={80} />
            ) : (
              <AreaLineChart
                data={data?.expenseSeries ?? []}
                valueKey="amount"
                color={EXPENSE_COLOR}
                emptyMsg="No expenses in this period"
              />
            )}
          </Card>

          {/* Net revenue summary card */}
          {data && !isLoading && (
            <View
              style={[
                s2.netCard,
                (s?.netRevenue ?? 0) >= 0 ? s2.netCardPos : s2.netCardNeg,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s2.netLabel}>Net Revenue</Text>
                <Text
                  style={[
                    s2.netValue,
                    {
                      color:
                        (s?.netRevenue ?? 0) >= 0
                          ? Colors.success
                          : Colors.error,
                    },
                  ]}
                >
                  {fmt(s?.netRevenue ?? 0)}
                </Text>
                <Text style={s2.netSub}>{rangeLabel}</Text>
              </View>
              <View
                style={[
                  s2.netIcon,
                  (s?.netRevenue ?? 0) >= 0 ? s2.netIconPos : s2.netIconNeg,
                ]}
              >
                <Icon
                  name={(s?.netRevenue ?? 0) >= 0 ? "trending-up" : "trending-down"}
                  size={24}
                  color={(s?.netRevenue ?? 0) >= 0 ? Colors.success : Colors.error}
                />
              </View>
              {s && s.totalRevenue > 0 && (
                <View style={s2.netMarginRow}>
                  <Text style={s2.netMarginTxt}>
                    Profit margin:{" "}
                    <Text
                      style={{
                        fontWeight: "700",
                        color:
                          s.netRevenue / s.totalRevenue >= 0
                            ? Colors.success
                            : Colors.error,
                      }}
                    >
                      {((s.netRevenue / s.totalRevenue) * 100).toFixed(1)}%
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* ── Per-gym breakdown ────────────────────────────────────── */}
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

      {/* ── Upgrade prompt (Basic plan only) ────────────────────── */}
      {!isPremium && data && (
        <View style={s2.upgradeCard}>
          <View style={s2.upgradeIcon}>
            <Icon name="lightning-bolt" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s2.upgradeTitle}>Unlock Premium Reports</Text>
            <Text style={s2.upgradeSub}>
              Upgrade to Pro or Enterprise for expense charts, Revenue vs Expenses
              comparison, and detailed multi-gym analytics.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Root screen ───────────────────────────────────────────────────────────────

export default function OwnerReportsScreen() {
  const { hasFullReports } = useSubscription();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
        <Header title="Reports" subtitle="Analytics & performance" menu />
      </View>
      <PlanGate allowed={hasFullReports} featureLabel="Full Reports & Analytics">
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
  legendDot:  { width: 8, height: 8, borderRadius: 2 },
  legendDash: { width: 16, height: 3, borderRadius: 2 },
  legendTxt:  { color: Colors.textMuted, fontSize: 10 },
  chartSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  emptyChart: { paddingVertical: Spacing.xl, alignItems: "center", gap: Spacing.sm },
  emptyChartTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  chartScroll: { marginHorizontal: -Spacing.lg },
});

const si = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    backgroundColor: Colors.surface,
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
  name:    { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700", flex: 1 },
  row:     { flexDirection: "row" },
  cell:    { flex: 1, alignItems: "center", paddingVertical: Spacing.xs },
  cellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  cellVal: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "800" },
  cellLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});

const s2 = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },

  gymChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gymChipActive:    { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  gymChipTxt:       { color: Colors.textMuted, fontSize: Typography.xs },
  gymChipTxtActive: { color: Colors.primary, fontWeight: "700" },

  dateRange: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: "right" },

  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  statsGrid:    { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  statCell:     { width: "47.5%" },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  cardTitle:    { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700" },
  cardSub:      { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  cardBigVal:   { fontSize: Typography.lg, fontWeight: "800" },

  chartFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chartFooterTxt: { color: Colors.textMuted, fontSize: Typography.xs },

  lockerCard: { borderColor: LOCKER_COLOR + "25" },
  lockerIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: LOCKER_COLOR + "20",
    alignItems: "center",
    justifyContent: "center",
  },

  premiumCard: { borderColor: Colors.primary + "20" },

  // Net revenue card
  netCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  netCardPos: { backgroundColor: Colors.success + "08", borderColor: Colors.success + "20" },
  netCardNeg: { backgroundColor: Colors.error + "08",   borderColor: Colors.error + "20"   },
  netLabel:  { color: Colors.textMuted, fontSize: Typography.xs, textTransform: "uppercase", letterSpacing: 0.5 },
  netValue:  { fontSize: Typography.xxl, fontWeight: "800", marginTop: 3 },
  netSub:    { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 3 },
  netIcon:   {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  netIconPos: { backgroundColor: Colors.success + "20" },
  netIconNeg: { backgroundColor: Colors.error   + "20" },
  netMarginRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  netMarginTxt: { color: Colors.textMuted, fontSize: Typography.xs },

  // Upgrade prompt
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary + "25",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  upgradeTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700" },
  upgradeSub:   { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 3, lineHeight: 16 },
});
