// app/screens/trainer/BodyMetricsScreen.tsx
// Accessed from TrainerMemberDetailScreen — shows a member's body metric history.
// Trainer can log new measurements via an "Add Measurement" form.
// Shows trend arrows (↑ ↓) on weight and body fat vs previous record.

import { trainerBodyMetricsApi } from "@/api/endpoints";
import { Button, Card, EmptyState, Header, Input, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BodyMetric {
  id: string;
  date: string;
  weight?: number | null;
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
  bmi?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  notes?: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(v?: number | null, unit = "") {
  if (v == null) return "—";
  return `${v}${unit}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
        <Text style={mr.value}>
          {fmt(value, unit ? ` ${unit}` : "")}
        </Text>
        <Trend current={current} previous={previous} lowerIsBetter={lowerIsBetter} />
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
  label: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function BodyMetricsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { memberId, memberName } = route.params ?? {};
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    bodyFatPercent: "",
    muscleMass: "",
    bmi: "",
    chestCm: "",
    waistCm: "",
    hipsCm: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: metrics = [], isLoading, refetch, isRefetching } = useQuery<BodyMetric[]>({
    queryKey: ["trainerBodyMetrics", memberId],
    queryFn: () =>
      trainerBodyMetricsApi.list(memberId) as Promise<BodyMetric[]>,
    enabled: !!memberId,
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = { date: form.date };
      if (form.weight) payload.weight = parseFloat(form.weight);
      if (form.bodyFatPercent) payload.bodyFatPercent = parseFloat(form.bodyFatPercent);
      if (form.muscleMass) payload.muscleMass = parseFloat(form.muscleMass);
      if (form.bmi) payload.bmi = parseFloat(form.bmi);
      if (form.chestCm) payload.chestCm = parseFloat(form.chestCm);
      if (form.waistCm) payload.waistCm = parseFloat(form.waistCm);
      if (form.hipsCm) payload.hipsCm = parseFloat(form.hipsCm);
      if (form.notes) payload.notes = form.notes;
      return trainerBodyMetricsApi.create(memberId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerBodyMetrics", memberId] });
      setShowAdd(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        weight: "",
        bodyFatPercent: "",
        muscleMass: "",
        bmi: "",
        chestCm: "",
        waistCm: "",
        hipsCm: "",
        notes: "",
      });
      Toast.show({ type: "success", text1: "Measurement logged!" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to save" }),
  });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerWrap}>
        <Header
          title={memberName ? `${memberName}'s Metrics` : "Body Metrics"}
          back
          right={
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setShowAdd(true)}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={s.addBtnTxt}>Add</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={3} itemHeight={140} gap={Spacing.md} />
        </View>
      ) : metrics.length === 0 ? (
        <EmptyState
          icon="human-male-height"
          title="No measurements yet"
          subtitle="Tap '+Add' to log this member's first body measurement"
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
          {metrics.map((m, idx) => {
            const prev = metrics[idx + 1]; // sorted desc — next is older
            return (
              <Card key={m.id} style={s.metricCard}>
                {/* Date header */}
                <View style={s.dateRow}>
                  <Icon name="calendar-outline" size={14} color={Colors.textMuted} />
                  <Text style={s.dateText}>{fmtDate(m.date)}</Text>
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

                {/* Measurements */}
                {(m.chestCm || m.waistCm || m.hipsCm) ? (
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
                ) : null}

                {m.notes ? (
                  <View style={s.notesWrap}>
                    <Icon name="note-text-outline" size={13} color={Colors.textMuted} />
                    <Text style={s.notesTxt}>{m.notes}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* Add Measurement Modal */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Measurement</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Date"
              value={form.date}
              onChangeText={(v) => set("date", v)}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-outline"
            />

            <Text style={s.groupLabel}>BODY COMPOSITION</Text>
            <Input
              label="Weight (kg)"
              value={form.weight}
              onChangeText={(v) => set("weight", v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 72.5"
              leftIcon="scale-bathroom"
            />
            <Input
              label="Body Fat %"
              value={form.bodyFatPercent}
              onChangeText={(v) => set("bodyFatPercent", v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 18.5"
              leftIcon="percent"
            />
            <Input
              label="Muscle Mass (kg)"
              value={form.muscleMass}
              onChangeText={(v) => set("muscleMass", v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 45.0"
              leftIcon="arm-flex-outline"
            />
            <Input
              label="BMI (optional)"
              value={form.bmi}
              onChangeText={(v) => set("bmi", v)}
              keyboardType="decimal-pad"
              placeholder="Auto-calculated or manual"
              leftIcon="calculator-variant-outline"
            />

            <Text style={s.groupLabel}>MEASUREMENTS (cm)</Text>
            <Input
              label="Chest"
              value={form.chestCm}
              onChangeText={(v) => set("chestCm", v)}
              keyboardType="decimal-pad"
              placeholder="cm"
              leftIcon="human-male"
            />
            <Input
              label="Waist"
              value={form.waistCm}
              onChangeText={(v) => set("waistCm", v)}
              keyboardType="decimal-pad"
              placeholder="cm"
              leftIcon="human-male"
            />
            <Input
              label="Hips"
              value={form.hipsCm}
              onChangeText={(v) => set("hipsCm", v)}
              keyboardType="decimal-pad"
              placeholder="cm"
              leftIcon="human-male"
            />

            <Input
              label="Notes"
              value={form.notes}
              onChangeText={(v) => set("notes", v)}
              placeholder="Any observations…"
              leftIcon="note-text-outline"
              multiline
              numberOfLines={2}
            />

            <Button
              label="Save Measurement"
              onPress={() => addMutation.mutate()}
              loading={addMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnTxt: { color: "#fff", fontSize: Typography.xs, fontWeight: "700" },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  metricCard: { gap: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
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
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  groupLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: Spacing.sm,
  },
});
