// mobile/src/screens/owner/DashboardScreen.tsx
import { ownerDashboardApi } from "@/api/endpoints";
import { Avatar, Card, RangePicker, Skeleton, StatCard } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
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
  expiredMembers: number;
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
    category?: string | null;
    stockQty: number;
    lowStockAt: number;
    gymId: string;
    gym?: { name: string } | null;
  }[];
}

// ── Constants ──────────────────────────────────────────────────────────────────
// const RANGES = [
//   { key: "today", label: "Today" },
//   { key: "this_week", label: "Week" },
//   { key: "this_month", label: "Month" },
//   { key: "last_3_months", label: "3 Mo" },
//   { key: "last_year", label: "Year" },
// ];
const RANGES = [
  { key: "today", label: "Today" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "last_90_days", label: "This Quarter (90 days)" },
  { key: "financial_year", label: "Financial Year (Apr-Mar)" },
  { key: "custom", label: "Custom Range" },
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
  const navigation = useNavigation();
  if (!count) return null;
  const color =
    days < 1 ? Colors.error : days <= 3 ? Colors.warning : Colors.info;
  const bg =
    days < 1
      ? Colors.errorFaded
      : days <= 3
        ? Colors.warningFaded
        : Colors.infoFaded;
  const message =
    days < 0
      ? `${count} expired memberships`
      : days === 0
        ? `Last day: ${names?.join(", ") ?? count + " memberships"}`
        : `${count} expiring in ${days} day${days !== 1 ? "s" : ""}`;
  return (
    <TouchableOpacity
      style={[s.alert, { backgroundColor: bg, borderColor: color + "40" }]}
      onPress={() => (navigation as any).navigate("Members")}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <Icon name="alert-circle-outline" size={16} color={color} />
          <Text style={[s.alertTxt, { color }]}>{message}</Text>
        </View>
      </View>
      <View>
        <Icon name="arrow-right" size={16} color={color} />
      </View>
    </TouchableOpacity>
  );
}

// ── Quick action button ────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[qa.btn, { backgroundColor: Colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[qa.iconWrap, { backgroundColor: Colors.surface }]}>
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
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
    height: 90,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 13,
  },
});

// ── Low stock alert item ───────────────────────────────────────────────────────

function StockAlertItem({
  item,
  onPress,
  multiGym,
}: {
  item: NonNullable<DashboardData["lowStockAlerts"]>[0];
  onPress: () => void;
  multiGym?: boolean;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isOut = item.stockQty === 0;
  const isCritical = !isOut && item.stockQty <= Math.floor(item.lowStockAt / 2);

  useEffect(() => {
    if (!isOut && !isCritical) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isOut, isCritical]);

  const color = isOut
    ? Colors.error
    : isCritical
      ? Colors.warning
      : Colors.yellow;
  const bg = isOut
    ? Colors.errorFaded
    : isCritical
      ? Colors.warningFaded
      : Colors.yellowFaded;
  const label = isOut ? "Out of Stock" : `${item.stockQty} left`;

  const stockPct =
    item.lowStockAt > 0
      ? Math.min((item.stockQty / item.lowStockAt) * 100, 100)
      : 0;

  const meta = [item.category, multiGym && item.gym?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      style={[ls.row, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {(isOut || isCritical) && (
        <Animated.View
          style={[ls.pulse, { backgroundColor: color, opacity: pulse }]}
        />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={ls.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.brand ? (
            <Text style={ls.brand} numberOfLines={1}>
              · {item.brand}
            </Text>
          ) : null}
        </View>
        {meta ? (
          <Text style={ls.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {/* Stock progress bar */}
        <View style={ls.barTrack}>
          <View
            style={[
              ls.barFill,
              {
                width: item.stockQty === 0 ? 3 : (`${stockPct}%` as any),
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={ls.units}>
          {item.stockQty} / {item.lowStockAt} units
        </Text>
      </View>
      <View style={[ls.badge, { backgroundColor: bg }]}>
        <Text style={[ls.badgeTxt, { color }]}>{label}</Text>
      </View>
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
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  brand: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  qty: {
    fontSize: Typography.xs,
    fontWeight: "700",
    flexShrink: 0,
    minWidth: 44,
    textAlign: "right",
  },
  meta: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  barTrack: {
    height: 4,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  barFill: { height: "100%", borderRadius: 2, minWidth: 3 },
  units: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
});

// ── Subscription badge ───────────────────────────────────────────────────────
function SubscriptionBadge() {
  const navigation = useNavigation<any>();
  const { subscription } = useSubscription();

  if (!subscription) return null;

  const { planSlug, isExpired } = subscription;
  const planName =
    planSlug === "free"
      ? "Free"
      : planSlug.charAt(0).toUpperCase() + planSlug.slice(1);
  const isEnterprise = planSlug === "enterprise";

  if (isEnterprise && !isExpired) return null; // Don't show for enterprise users

  return (
    <TouchableOpacity
      style={sb.container}
      onPress={() => navigation.navigate("OwnerSubscriptions")}
      activeOpacity={0.8}
    >
      <View style={sb.content}>
        <View style={sb.iconContainer}>
          {isExpired ? (
            <Icon name="lightning-bolt" size={20} color="#a855f7" />
          ) : (
            <Icon name="crown" size={20} color="#a855f7" />
          )}
        </View>
        <View style={sb.textContainer}>
          <Text style={sb.title}>
            Current Plan: {planName} {isExpired && "(Expired)"}
          </Text>
          <Text style={sb.subtitle}>
            Upgrade to Enterprise for unlimited gyms, advanced analytics, and
            premium features
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color="#a855f7" />
      </View>
    </TouchableOpacity>
  );
}

const sb = StyleSheet.create({
  container: {
    backgroundColor: "rgba(168, 85, 247, 0.1)", // purple-500/10
    borderColor: "rgba(168, 85, 247, 0.2)", // purple-500/20
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(168, 85, 247, 0.2)", // purple-500/20
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    lineHeight: 14,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const [range, setRange] = useState("last_30_days");
  const [gymId, setGymId] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["ownerDashboard", range, gymId, customStart, customEnd],
    queryFn: () =>
      ownerDashboardApi.get({
        range,
        gymId: gymId || undefined,
        ...(range === "custom" && customStart && customEnd
          ? { customStart, customEnd }
          : {}),
      }) as Promise<DashboardData>,
    staleTime: 2 * 60_000,
  });

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";
  const rangeLabel =
    RANGES.find((r) => r.key === range)?.label ?? "Last 30 Days";

  const QUICK_ACTIONS = [
    {
      icon: "account-plus-outline",
      label: "Add Member",
      color: "#60a5fa",
      // bg: "#3b82f6",
      screen: "Members",
      params: { screen: "OwnerAddMember" } as any,
    },
    {
      icon: "account-plus-outline",
      label: "Add Trainer",
      color: "#facc15",
      bg: "#eab308",
      screen: "OwnerTrainers",
    },
    {
      icon: "calendar-check-outline",
      label: "Attendance",
      color: "#34d399",
      // bg: "#10b981",
      screen: "OwnerAttendance",
    },
    {
      icon: "currency-rupee",
      label: "Expenses",
      color: Colors.error,
      screen: "OwnerExpenses",
    },
    {
      icon: "shopping-outline",
      label: "Supplements",
      color: "#4ade80",
      // bg: "#22c55e",
      screen: "OwnerSupplements",
    },
    // {
    //   icon: "clipboard-list-outline",
    //   label: "Workouts",
    //   color: "#c084fc",
    //   bg: "#8b5cf6",
    //   screen: "OwnerWorkouts",
    // },
    {
      icon: "chart-bar",
      label: "Reports",
      color: "#fb923c",
      // bg: "#f97316",
      screen: "OwnerReports",
    },
    // {
    //   icon: "gift-outline",
    //   label: "Refer & Earn",
    //   color: "#facc15",
    //   bg: "#eab308",
    //   screen: "OwnerReferral",
    // },
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
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
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

        {/* ── Range picker ──────────────────────────────────────── */}
        <View style={{ marginBottom: Spacing.md, flex: 1, width: "100%" }}>
          <RangePicker
            options={RANGES}
            value={range}
            customStart={customStart}
            customEnd={customEnd}
            onChange={(r, cs, ce) => {
              setRange(r);
              setCustomStart(cs ?? "");
              setCustomEnd(ce ?? "");
            }}
          />
        </View>

        {/* ── Subscription badge ────────────────────────────────────────────── */}
        <SubscriptionBadge />

        {/* ── Expiry alerts ──────────────────────────────────────── */}
        {!isLoading && (
          <View style={{ gap: Spacing.sm }}>
            <ExpiryAlert count={data?.expiredMembers ?? 0} days={-1} />
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
              sub="Membership + Supplements"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="calendar-check-outline"
              label="Check-ins Today"
              value={data?.todayAttendance ?? 0}
              color={Colors.success}
              bg={Colors.successFaded}
              sub="Members in gym today"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="account-plus-outline"
              label="New Members"
              value={data?.todayNewMembers ?? 0}
              color="#3b82f6"
              bg="#3b82f620"
              sub="Joined Today"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="trending-down"
              label="Today Expenses"
              value={fmt(data?.todayExpenses ?? 0)}
              color={Colors.error}
              bg={Colors.errorFaded}
              sub="Operation Costs"
              style={{ flex: 1 }}
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
              sub={`Across ${data?.activeGyms ?? 0} ${data?.activeGyms && data?.activeGyms > 1 ? "gyms" : "gym"}`}
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
              sub={rangeLabel.toUpperCase()}
            />
            <StatCard
              icon="shopping-outline"
              label="Supplement Rev"
              value={fmt(data?.rangeSupplementRevenue ?? 0)}
              color={Colors.success}
              bg={Colors.successFaded}
              sub={rangeLabel.toUpperCase()}
            />
            <StatCard
              icon="trending-down"
              label="Total Expenses"
              value={fmt(data?.rangeExpenses ?? 0)}
              color={Colors.error}
              bg={Colors.errorFaded}
              sub={rangeLabel.toUpperCase()}
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
              sub="Revenue - Expenses"
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                }}
              >
                <Icon
                  name="alert-circle-outline"
                  size={16}
                  color={Colors.warning}
                />
                <Text style={s.cardTitle}>Low Stock Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerSupplements")}
              >
                <Text style={s.seeAll}>Manage</Text>
              </TouchableOpacity>
            </View>
            {[...(data!.lowStockAlerts ?? [])]
              .sort((a, b) => a.stockQty - b.stockQty)
              .map((item) => (
                <StockAlertItem
                  key={item.id}
                  item={item}
                  multiGym={(data?.gyms?.length ?? 0) > 1}
                  onPress={() => navigation.navigate("OwnerSupplements")}
                />
              ))}
          </Card>
        )}

        {/* ── Quick actions ──────────────────────────────────────── */}
        <Text style={[s.sectionCap, { marginTop: Spacing.lg }]}>
          QUICK ACTIONS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: Spacing.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
          }}
        >
          {QUICK_ACTIONS.map((q) => (
            <QuickAction
              key={q.screen}
              icon={q.icon}
              label={q.label}
              color={q.color}
              onPress={() => navigation.navigate(q.screen as any, q.params)}
            />
          ))}
        </ScrollView>

        {/* ── Recent Members + Today's Check-ins ─────────────────── */}
        <View style={s.twoCol}>
          {/* Recent Members */}
          <Card style={{ flex: 1 }}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Recent Members</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Members", {
                    screen: "OwnerAddMember",
                  } as any)
                }
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
              <Text style={s.cardTitle}>Today's Check-ins</Text>
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
              <Text style={s.cardTitle}>Recent Supplement Sales</Text>
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
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
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
  quickGrid: { flex: 1, gap: Spacing.md },
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
