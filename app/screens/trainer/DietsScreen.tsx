// app/screens/trainer/DietsScreen.tsx
// Trainer diet plan builder.
// Plans list → Create/edit plan → Days tab → per-day time slots → food items.
// planData format: { "Monday__08:00 AM": [{ name, qty, calories, protein, carbs, fat }] }

import { trainerDietsApi } from "@/api/endpoints";
import { Button, Card, EmptyState, Header, Input, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FlatList,
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

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
type Day = typeof DAYS[number];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"] as const;

// ── Types ──────────────────────────────────────────────────────────────────────

interface FoodItem {
  name: string;
  qty: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slotKey(day: Day, hour: string, minute: string, period: string) {
  return `${day}__${hour}:${minute} ${period}`;
}

function slotLabel(day: Day, key: string) {
  return key.replace(`${day}__`, "");
}

function fmtMacro(v: string, unit: string) {
  const n = parseFloat(v);
  return isNaN(n) ? null : `${n}${unit}`;
}

// ── Time picker ────────────────────────────────────────────────────────────────

function TimePicker({
  hour,
  minute,
  period,
  onChange,
}: {
  hour: string;
  minute: string;
  period: string;
  onChange: (h: string, m: string, p: string) => void;
}) {
  return (
    <View style={tp.row}>
      {/* Hour */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tp.scroll}>
        {HOURS.map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => onChange(h, minute, period)}
            style={[tp.pill, hour === h && tp.pillActive]}
          >
            <Text style={[tp.pillTxt, hour === h && tp.pillActiveTxt]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={tp.sep}>:</Text>
      {/* Minute */}
      <View style={tp.minuteRow}>
        {MINUTES.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => onChange(hour, m, period)}
            style={[tp.pill, minute === m && tp.pillActive]}
          >
            <Text style={[tp.pillTxt, minute === m && tp.pillActiveTxt]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* AM/PM */}
      <View style={tp.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => onChange(hour, minute, p)}
            style={[tp.pill, period === p && tp.pillActive]}
          >
            <Text style={[tp.pillTxt, period === p && tp.pillActiveTxt]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  scroll: { flexGrow: 0, maxWidth: 180 },
  minuteRow: { flexDirection: "row", gap: Spacing.xs },
  periodRow: { flexDirection: "row", gap: Spacing.xs },
  sep: { color: Colors.textMuted, fontSize: Typography.lg, fontWeight: "700" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  pillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  pillTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  pillActiveTxt: { color: Colors.primary, fontWeight: "700" },
});

// ── Food item row in builder ───────────────────────────────────────────────────

function FoodItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: FoodItem;
  onChange: (field: keyof FoodItem, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={fi.wrap}>
      <View style={fi.headerRow}>
        <Input
          label="Food / Item"
          value={item.name}
          onChangeText={(v) => onChange("name", v)}
          placeholder="e.g. Oats"
          style={fi.nameInput}
        />
        <TouchableOpacity style={fi.removeBtn} onPress={onRemove}>
          <Icon name="close-circle-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <View style={fi.macroRow}>
        <View style={fi.macroField}>
          <Input
            label="Qty"
            value={item.qty}
            onChangeText={(v) => onChange("qty", v)}
            placeholder="e.g. 100g"
          />
        </View>
        <View style={fi.macroField}>
          <Input
            label="Cal"
            value={item.calories}
            onChangeText={(v) => onChange("calories", v)}
            keyboardType="numeric"
            placeholder="kcal"
          />
        </View>
        <View style={fi.macroField}>
          <Input
            label="P (g)"
            value={item.protein}
            onChangeText={(v) => onChange("protein", v)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={fi.macroField}>
          <Input
            label="C (g)"
            value={item.carbs}
            onChangeText={(v) => onChange("carbs", v)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={fi.macroField}>
          <Input
            label="F (g)"
            value={item.fat}
            onChangeText={(v) => onChange("fat", v)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  nameInput: { flex: 1 },
  removeBtn: { paddingTop: 24, flexShrink: 0 },
  macroRow: { flexDirection: "row", gap: Spacing.xs },
  macroField: { flex: 1 },
});

// ── Plan builder modal ─────────────────────────────────────────────────────────

function blank(): FoodItem {
  return { name: "", qty: "", calories: "", protein: "", carbs: "", fat: "" };
}

function PlanBuilderModal({
  visible,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, planData: Record<string, FoodItem[]>) => void;
  isSaving: boolean;
}) {
  const [planName, setPlanName] = useState("");
  const [activeDay, setActiveDay] = useState<Day>("Monday");

  // planData: { "Monday__08:00 AM": FoodItem[] }
  const [planData, setPlanData] = useState<Record<string, FoodItem[]>>({});

  // Slot being edited
  const [slotHour, setSlotHour] = useState("08");
  const [slotMinute, setSlotMinute] = useState("00");
  const [slotPeriod, setSlotPeriod] = useState("AM");

  function addSlot() {
    const key = slotKey(activeDay, slotHour, slotMinute, slotPeriod);
    if (planData[key]) {
      Toast.show({ type: "error", text1: "Slot already exists" });
      return;
    }
    setPlanData((d) => ({ ...d, [key]: [blank()] }));
  }

  function addFoodItem(key: string) {
    setPlanData((d) => ({ ...d, [key]: [...(d[key] ?? []), blank()] }));
  }

  function updateFoodItem(key: string, idx: number, field: keyof FoodItem, value: string) {
    setPlanData((d) => {
      const items = [...(d[key] ?? [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...d, [key]: items };
    });
  }

  function removeFoodItem(key: string, idx: number) {
    setPlanData((d) => {
      const items = (d[key] ?? []).filter((_, i) => i !== idx);
      if (items.length === 0) {
        const next = { ...d };
        delete next[key];
        return next;
      }
      return { ...d, [key]: items };
    });
  }

  const daySlots = Object.keys(planData)
    .filter((k) => k.startsWith(`${activeDay}__`))
    .sort();

  const totalSlots = Object.keys(planData).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* Modal header */}
        <View style={pb.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={pb.modalTitle}>New Diet Plan</Text>
          <TouchableOpacity
            onPress={() => {
              if (!planName.trim()) {
                Toast.show({ type: "error", text1: "Plan name is required" });
                return;
              }
              onSave(planName.trim(), planData);
            }}
            disabled={isSaving}
          >
            <Text
              style={[pb.saveBtn, isSaving && { opacity: 0.5 }]}
            >
              {isSaving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg }}
        >
          {/* Plan name */}
          <Input
            label="Plan Name *"
            value={planName}
            onChangeText={setPlanName}
            placeholder="e.g. Weight Loss Plan"
            leftIcon="food-apple-outline"
          />

          {/* Summary */}
          {totalSlots > 0 && (
            <Text style={pb.slotSummary}>
              {totalSlots} meal slot{totalSlots !== 1 ? "s" : ""} across the week
            </Text>
          )}

          {/* Day tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.xs }}
          >
            {DAYS.map((day) => {
              const cnt = Object.keys(planData).filter((k) =>
                k.startsWith(`${day}__`)
              ).length;
              const active = day === activeDay;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setActiveDay(day)}
                  style={[pb.dayTab, active && pb.dayTabActive]}
                >
                  <Text style={[pb.dayTabTxt, active && pb.dayTabTxtActive]}>
                    {day.slice(0, 3)}
                  </Text>
                  {cnt > 0 && (
                    <View style={[pb.dayBadge, active && { backgroundColor: Colors.primary }]}>
                      <Text style={pb.dayBadgeTxt}>{cnt}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time slot adder */}
          <Card>
            <Text style={pb.sectionLabel}>Add time slot for {activeDay}</Text>
            <TimePicker
              hour={slotHour}
              minute={slotMinute}
              period={slotPeriod}
              onChange={(h, m, p) => {
                setSlotHour(h);
                setSlotMinute(m);
                setSlotPeriod(p);
              }}
            />
            <TouchableOpacity style={pb.addSlotBtn} onPress={addSlot}>
              <Icon name="plus" size={14} color={Colors.primary} />
              <Text style={pb.addSlotTxt}>
                Add {slotHour}:{slotMinute} {slotPeriod}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Existing slots for this day */}
          {daySlots.length === 0 ? (
            <Text style={pb.emptyDay}>No meal slots for {activeDay} yet.</Text>
          ) : (
            daySlots.map((key) => {
              const label = slotLabel(activeDay, key);
              const items = planData[key] ?? [];
              const slotCals = items.reduce(
                (s, it) => s + (parseFloat(it.calories) || 0),
                0
              );
              return (
                <View key={key}>
                  {/* Slot header */}
                  <View style={pb.slotHeader}>
                    <Icon name="clock-outline" size={14} color={Colors.primary} />
                    <Text style={pb.slotLabelTxt}>{label}</Text>
                    {slotCals > 0 && (
                      <Text style={pb.slotCals}>{slotCals} kcal</Text>
                    )}
                    <TouchableOpacity
                      style={{ marginLeft: "auto" }}
                      onPress={() => {
                        const next = { ...planData };
                        delete next[key];
                        setPlanData(next);
                      }}
                    >
                      <Icon name="trash-can-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Food items */}
                  <View style={{ gap: Spacing.sm }}>
                    {items.map((item, idx) => (
                      <FoodItemRow
                        key={idx}
                        item={item}
                        onChange={(field, value) =>
                          updateFoodItem(key, idx, field, value)
                        }
                        onRemove={() => removeFoodItem(key, idx)}
                      />
                    ))}
                    <TouchableOpacity
                      style={pb.addFoodBtn}
                      onPress={() => addFoodItem(key)}
                    >
                      <Icon name="plus" size={13} color={Colors.textMuted} />
                      <Text style={pb.addFoodTxt}>Add food item</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const pb = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  saveBtn: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  slotSummary: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
  },
  dayTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  dayTabActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  dayTabTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  dayTabTxtActive: { color: Colors.primary },
  dayBadge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dayBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  addSlotTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  emptyDay: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  slotLabelTxt: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    flex: 1,
  },
  slotCals: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  addFoodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  addFoodTxt: { color: Colors.textMuted, fontSize: Typography.xs },
});

// ── Plan list card ─────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: any }) {
  const totalSlots = Object.keys(plan.planData ?? {}).length;
  return (
    <Card style={pl.card}>
      <View style={pl.row}>
        <View style={pl.iconWrap}>
          <Icon name="food-apple-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pl.name}>{plan.name}</Text>
          <Text style={pl.sub}>
            {totalSlots} meal slot{totalSlots !== 1 ? "s" : ""}
            {plan.member?.fullName ? ` · Assigned to ${plan.member.fullName}` : ""}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
    </Card>
  );
}

const pl = StyleSheet.create({
  card: { gap: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  sub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function DietsScreen() {
  const qc = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["trainerDiets"],
    queryFn: () => trainerDietsApi.list() as Promise<any[]>,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; planData: Record<string, any[]> }) =>
      trainerDietsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerDiets"] });
      setShowBuilder(false);
      Toast.show({ type: "success", text1: "Diet plan created!" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to create plan" }),
  });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerWrap}>
        <Header
          menu
          title="Diet Plans"
          right={
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setShowBuilder(true)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={4} itemHeight={72} gap={Spacing.md} />
        </View>
      ) : (plans as any[]).length === 0 ? (
        <EmptyState
          icon="food-apple-outline"
          title="No diet plans yet"
          subtitle="Create a plan with per-meal time slots and macros"
          action={
            <TouchableOpacity
              style={s.emptyAction}
              onPress={() => setShowBuilder(true)}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={s.emptyActionTxt}>Create Plan</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={plans as any[]}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => <PlanCard plan={item} />}
        />
      )}

      <PlanBuilderModal
        visible={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={(name, planData) => createMutation.mutate({ name, planData })}
        isSaving={createMutation.isPending}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyActionTxt: { color: "#fff", fontWeight: "700", fontSize: Typography.sm },
});
