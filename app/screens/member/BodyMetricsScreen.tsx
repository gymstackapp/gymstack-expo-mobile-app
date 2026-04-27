// app/screens/member/BodyMetricsScreen.tsx
// Read-only view of body metrics logged by the trainer.
// Members can see their measurement history with trend indicators but cannot add entries.

import { memberBodyMetricsApi } from "@/api/endpoints";
import { Card, EmptyState, Header, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BodyMetric {
  id: string;
  date: string;
  recordedAt?: string;
  weight?: number | null;
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
  bmi?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  notes?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(v?: number | null, unit = "") {
  if (v == null) return "—";
  return `${v}${unit ? ` ${unit}` : ""}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Trend indicator ────────────────────────────────────────────────────────────

function Trend({
  current,
  previous,
  lowerIsBetter = false,
}: {
  current?: number | null;
  previous?: number | null;
  lowerIsBetter?: boolean;
}) {
  if (current == null || previous == null || current === previous) return null;
  const up = current > previous;
  const good = lowerIsBetter ? !up : up;
  const color = good ? Colors.success : Colors.error;
  const icon = up ? "trending-up" : "trending-down";
  const diff = Math.abs(current - previous).toFixed(1);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Icon name={icon} size={12} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{diff}</Text>
    </View>
  );
}

// ── Metric row ─────────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  unit,
  icon,
  current,
  previous,
  lowerIsBetter,
}: {
  label: string;
  value?: number | null;
  unit?: string;
  icon: string;
  current?: number | null;
  previous?: number | null;
  lowerIsBetter?: boolean;
}) {
  if (value == null) return null;
  return (
    <View style={mr.row}>
      <View style={mr.iconWrap}>
        <Icon name={icon} size={14} color={Colors.textMuted} />
      </View>
      <Text style={mr.label}>{label}</Text>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={mr.value}>{fmt(value, unit)}</Text>
        <Trend
          current={current}
          previous={previous}
          lowerIsBetter={lowerIsBetter}
        />
      </View>
    </View>
  );
}

const mr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MemberBodyMetricsScreen() {
  const {
    data: metrics = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<BodyMetric[]>({
    queryKey: ["memberBodyMetrics"],
    queryFn: () => memberBodyMetricsApi.list() as Promise<BodyMetric[]>,
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header title="Body Metrics" subtitle="Logged by your trainer" back />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={3} itemHeight={160} gap={Spacing.md} />
        </View>
      ) : metrics.length === 0 ? (
        <EmptyState
          icon="human-male-height"
          title="No measurements yet"
          subtitle="Your trainer hasn't logged any body measurements for you yet"
        />
      ) : (
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
          {/* Summary card — latest snapshot */}
          {metrics[0] && (
            <View style={s.summaryCard}>
              <View style={s.summaryHeader}>
                <Icon name="chart-line" size={18} color={Colors.primary} />
                <Text style={s.summaryTitle}>Latest Snapshot</Text>
                <Text style={s.summaryDate}>
                  {fmtDate(metrics[0].date ?? metrics[0].recordedAt ?? "")}
                </Text>
              </View>
              <View style={s.summaryGrid}>
                {metrics[0].weight != null && (
                  <View style={s.summaryCell}>
                    <Text style={[s.summaryCellVal, { color: Colors.primary }]}>
                      {metrics[0].weight} kg
                    </Text>
                    <Text style={s.summaryCellLbl}>Weight</Text>
                  </View>
                )}
                {metrics[0].bodyFatPercent != null && (
                  <View style={s.summaryCell}>
                    <Text style={[s.summaryCellVal, { color: Colors.warning }]}>
                      {metrics[0].bodyFatPercent}%
                    </Text>
                    <Text style={s.summaryCellLbl}>Body Fat</Text>
                  </View>
                )}
                {metrics[0].muscleMass != null && (
                  <View style={s.summaryCell}>
                    <Text style={[s.summaryCellVal, { color: Colors.success }]}>
                      {metrics[0].muscleMass} kg
                    </Text>
                    <Text style={s.summaryCellLbl}>Muscle</Text>
                  </View>
                )}
                {metrics[0].bmi != null && (
                  <View style={s.summaryCell}>
                    <Text style={[s.summaryCellVal, { color: Colors.info }]}>
                      {metrics[0].bmi}
                    </Text>
                    <Text style={s.summaryCellLbl}>BMI</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Timeline */}
          <Text style={s.sectionLabel}>HISTORY ({metrics.length} entries)</Text>

          {metrics.map((m, idx) => {
            const prev = metrics[idx + 1];
            const displayDate = m.date ?? m.recordedAt ?? "";
            return (
              <Card key={m.id} style={s.metricCard}>
                {/* Date header */}
                <View style={s.dateRow}>
                  <Icon
                    name="calendar-outline"
                    size={14}
                    color={Colors.textMuted}
                  />
                  <Text style={s.dateText}>{fmtDate(displayDate)}</Text>
                  {idx === 0 && (
                    <View style={s.latestBadge}>
                      <Text style={s.latestTxt}>Latest</Text>
                    </View>
                  )}
                </View>

                <View style={s.divider} />

                {/* Primary metrics */}
                <MetricRow
                  label="Weight"
                  value={m.weight}
                  unit="kg"
                  icon="scale-bathroom"
                  current={m.weight}
                  previous={prev?.weight}
                  lowerIsBetter={false}
                />
                <MetricRow
                  label="Body Fat"
                  value={m.bodyFatPercent}
                  unit="%"
                  icon="percent"
                  current={m.bodyFatPercent}
                  previous={prev?.bodyFatPercent}
                  lowerIsBetter={true}
                />
                <MetricRow
                  label="Muscle Mass"
                  value={m.muscleMass}
                  unit="kg"
                  icon="arm-flex-outline"
                  current={m.muscleMass}
                  previous={prev?.muscleMass}
                  lowerIsBetter={false}
                />
                <MetricRow
                  label="BMI"
                  value={m.bmi}
                  icon="calculator-variant-outline"
                />

                {/* Body measurements */}
                {(m.chestCm != null ||
                  m.waistCm != null ||
                  m.hipsCm != null) && (
                  <>
                    <View style={s.divider} />
                    <Text style={s.subHead}>MEASUREMENTS</Text>
                    <View style={s.measureRow}>
                      {m.chestCm != null && (
                        <View style={s.measureItem}>
                          <Text style={s.measureVal}>{m.chestCm}</Text>
                          <Text style={s.measureLabel}>Chest cm</Text>
                        </View>
                      )}
                      {m.waistCm != null && (
                        <View style={s.measureItem}>
                          <Text style={s.measureVal}>{m.waistCm}</Text>
                          <Text style={s.measureLabel}>Waist cm</Text>
                        </View>
                      )}
                      {m.hipsCm != null && (
                        <View style={s.measureItem}>
                          <Text style={s.measureVal}>{m.hipsCm}</Text>
                          <Text style={s.measureLabel}>Hips cm</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* Notes */}
                {m.notes ? (
                  <View style={s.notesWrap}>
                    <Icon
                      name="note-text-outline"
                      size={13}
                      color={Colors.textMuted}
                    />
                    <Text style={s.notesTxt}>{m.notes}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Summary card
  summaryCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  summaryDate: { color: Colors.textMuted, fontSize: Typography.xs },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  summaryCell: {
    flex: 1,
    minWidth: 70,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  summaryCellVal: { fontSize: Typography.base, fontWeight: "800" },
  summaryCellLbl: { color: Colors.textMuted, fontSize: 10 },
  // Metric card
  metricCard: { gap: 4 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  latestBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  latestTxt: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  subHead: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 2,
  },
  measureRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-start",
  },
  measureItem: { alignItems: "center", minWidth: 64 },
  measureVal: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  measureLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  notesWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: 4,
  },
  notesTxt: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    lineHeight: 16,
  },
});
