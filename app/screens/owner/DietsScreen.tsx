// mobile/src/screens/owner/DietsScreen.tsx
// Owner diet plans — list + create/edit via modal.
// planData structure: Record<"Day__HH:MM AM/PM", MealItem[]>
// Mirrors the web owner diets page: time slots per day, copy-day, template
// picker, macros, member assignment, Free-for-All toggle.

import { dietsApi, gymsApi, membersApi } from "@/api/endpoints";
import {
  Card,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { DietPlan, Gym } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type Day = (typeof DAYS)[number];

const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTES = ["00", "15", "30", "45"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface MealItem {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

type PlanData = Record<string, MealItem[]>;

interface FormState {
  gymId: string;
  memberId: string;
  freeForAll: boolean;
  isTemplate: boolean;
  title: string;
  description: string;
  goal: string;
  caloriesTarget: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

interface Template {
  id: string;
  title: string;
  goal: string | null;
  description: string | null;
  planData: PlanData;
  caloriesTarget?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  createdBy: { fullName: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === "AM" && h === 12) h = 0;
  if (p === "PM" && h !== 12) h += 12;
  return h * 60 + min;
}

function getSlotsForDay(planData: PlanData, day: string): string[] {
  const prefix = `${day}__`;
  return Object.keys(planData)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length))
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

function dayItemCount(planData: PlanData, day: string): number {
  return getSlotsForDay(planData, day).reduce(
    (s, t) => s + (planData[`${day}__${t}`]?.length ?? 0),
    0,
  );
}

function emptyMeal(): MealItem {
  return {
    name: "",
    quantity: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  };
}

function blankForm(defaultGymId = ""): FormState {
  return {
    gymId: defaultGymId,
    memberId: "",
    freeForAll: false,
    isTemplate: false,
    title: "",
    description: "",
    goal: "",
    caloriesTarget: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  };
}

// ── MacroChip ─────────────────────────────────────────────────────────────────

function MacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={[
        mc.chip,
        { backgroundColor: color + "20", borderColor: color + "40" },
      ]}
    >
      <Text style={[mc.val, { color }]}>{value}</Text>
      <Text style={mc.lbl}>{label}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 52,
  },
  val: { fontSize: Typography.xs, fontWeight: "700" },
  lbl: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
});

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={tg.row} onPress={onToggle} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={tg.label}>{label}</Text>
        {sub ? <Text style={tg.sub}>{sub}</Text> : null}
      </View>
      <View style={[tg.track, value && tg.trackOn]}>
        <View style={[tg.thumb, value && tg.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}
const tg = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  sub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: "center",
  },
  trackOn: { backgroundColor: Colors.primary },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  thumbOn: { alignSelf: "flex-end" },
});

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sl.label}>{label}</Text>;
}
const sl = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
});

// ── FieldInput ────────────────────────────────────────────────────────────────

function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <TextInput
      style={[fi.input, multiline && fi.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType={keyboardType ?? "default"}
      multiline={multiline}
      numberOfLines={multiline ? 2 : 1}
      textAlignVertical={multiline ? "top" : "center"}
    />
  );
}
const fi = StyleSheet.create({
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  multiline: { minHeight: 72, paddingTop: 12 },
});

// ── Time Picker Bottom Sheet ───────────────────────────────────────────────────

function TimePickerSheet({
  visible,
  onSelect,
  onClose,
  existingSlots,
  dayLabel,
}: {
  visible: boolean;
  onSelect: (time: string) => void;
  onClose: () => void;
  existingSlots: string[];
  dayLabel: string;
}) {
  const [h, setH] = useState("08");
  const [min, setMin] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (visible) {
      setH("08");
      setMin("00");
      setPeriod("AM");
    }
  }, [visible]);

  const currentTime = `${h}:${min} ${period}`;
  const alreadyExists = existingSlots.includes(currentTime);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={tps.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={tps.sheet} activeOpacity={1}>
          <View style={tps.handle} />
          <Text style={tps.title}>Add Meal Time — {dayLabel}</Text>
          <Text style={tps.subtitle}>Select the time for this meal slot</Text>

          {/* Pickers row */}
          <View style={tps.pickersRow}>
            {/* Hour */}
            <View style={tps.pickerWrap}>
              <Text style={tps.pickerLabel}>Hour</Text>
              <ScrollView
                style={tps.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((hh) => (
                  <TouchableOpacity
                    key={hh}
                    style={[tps.pickerItem, h === hh && tps.pickerItemActive]}
                    onPress={() => setH(hh)}
                  >
                    <Text
                      style={[tps.pickerText, h === hh && tps.pickerTextActive]}
                    >
                      {hh}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={tps.colon}>:</Text>

            {/* Minute */}
            <View style={tps.pickerWrap}>
              <Text style={tps.pickerLabel}>Min</Text>
              <View style={tps.pickerScroll}>
                {MINUTES.map((mm) => (
                  <TouchableOpacity
                    key={mm}
                    style={[tps.pickerItem, min === mm && tps.pickerItemActive]}
                    onPress={() => setMin(mm)}
                  >
                    <Text
                      style={[
                        tps.pickerText,
                        min === mm && tps.pickerTextActive,
                      ]}
                    >
                      {mm}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AM / PM */}
            <View style={tps.pickerWrap}>
              <Text style={tps.pickerLabel}>Period</Text>
              <View style={tps.pickerScroll}>
                {(["AM", "PM"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      tps.pickerItem,
                      period === p && tps.pickerItemActive,
                    ]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text
                      style={[
                        tps.pickerText,
                        period === p && tps.pickerTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={tps.preview}>
            <Icon name="clock-outline" size={16} color={Colors.primary} />
            <Text style={tps.previewTime}>{currentTime}</Text>
            {alreadyExists && (
              <Text style={tps.existsWarn}> · Already exists</Text>
            )}
          </View>

          {/* Actions */}
          <View style={tps.actions}>
            <TouchableOpacity style={tps.cancelBtn} onPress={onClose}>
              <Text style={tps.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tps.addBtn, alreadyExists && tps.addBtnDisabled]}
              onPress={() => {
                if (!alreadyExists) {
                  onSelect(currentTime);
                  onClose();
                }
              }}
              disabled={alreadyExists}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={tps.addTxt}>Add Slot</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const tps = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.lg,
  },
  pickersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pickerWrap: { flex: 1, alignItems: "center" },
  pickerLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  pickerScroll: { width: "100%", flex: 1 },
  colon: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
    marginTop: 28,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "60",
  },
  pickerText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  pickerTextActive: { color: Colors.primary, fontWeight: "800" },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewTime: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  existsWarn: { color: Colors.error, fontSize: Typography.xs },
  actions: { flexDirection: "row", gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelTxt: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  addBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  addBtnDisabled: { opacity: 0.4 },
  addTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});

// ── Copy Day Modal ────────────────────────────────────────────────────────────

function CopyDayModal({
  visible,
  sourceDay,
  onCopy,
  onClose,
}: {
  visible: boolean;
  sourceDay: Day;
  onCopy: (targets: Day[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Day[]>([]);
  const otherDays = DAYS.filter((d) => d !== sourceDay);

  useEffect(() => {
    if (visible) setSelected([]);
  }, [visible]);

  const toggle = (d: Day) =>
    setSelected((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const toggleAll = () =>
    setSelected((prev) =>
      prev.length === otherDays.length ? [] : [...otherDays],
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={cdm.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={cdm.sheet} activeOpacity={1}>
          <View style={cdm.handle} />
          <View style={cdm.headerRow}>
            <Text style={cdm.title}>
              Copy <Text style={{ color: Colors.primary }}>{sourceDay}</Text>'s
              Meals
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={cdm.subtitle}>Select which days to copy meals to</Text>

          {/* Select all */}
          <TouchableOpacity style={cdm.row} onPress={toggleAll}>
            <View
              style={[
                cdm.check,
                selected.length === otherDays.length && cdm.checkActive,
              ]}
            >
              {selected.length === otherDays.length && (
                <Icon name="check" size={12} color="#fff" />
              )}
            </View>
            <Text style={cdm.rowText}>Select all days</Text>
          </TouchableOpacity>

          <View style={cdm.divider} />

          {otherDays.map((day) => (
            <TouchableOpacity
              key={day}
              style={cdm.row}
              onPress={() => toggle(day)}
            >
              <View
                style={[cdm.check, selected.includes(day) && cdm.checkActive]}
              >
                {selected.includes(day) && (
                  <Icon name="check" size={12} color="#fff" />
                )}
              </View>
              <Text style={cdm.rowText}>{day}</Text>
            </TouchableOpacity>
          ))}

          <View style={cdm.actions}>
            <TouchableOpacity style={cdm.cancelBtn} onPress={onClose}>
              <Text style={cdm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cdm.copyBtn, selected.length === 0 && cdm.copyBtnOff]}
              onPress={() => {
                if (selected.length > 0) {
                  onCopy(selected);
                  onClose();
                }
              }}
              disabled={selected.length === 0}
            >
              <Icon name="content-copy" size={16} color="#fff" />
              <Text style={cdm.copyTxt}>
                Copy {selected.length > 0 ? `(${selected.length})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const cdm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rowText: { color: Colors.textPrimary, fontSize: Typography.sm },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelTxt: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  copyBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  copyBtnOff: { opacity: 0.4 },
  copyTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});

// ── Template Picker Modal ─────────────────────────────────────────────────────

function TemplatePicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (t: Template) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSearch("");
    // Fetch diet plans marked as templates
    dietsApi
      .list({})
      .then((data: any) => {
        const plans: any[] = Array.isArray(data) ? data : [];
        setTemplates(
          plans
            .filter((p) => p.isTemplate)
            .map((p) => ({
              id: p.id,
              title: p.title ?? "Untitled",
              goal: p.goal ?? null,
              description: p.description ?? null,
              planData: p.planData ?? {},
              caloriesTarget: p.caloriesTarget ?? null,
              proteinG: p.proteinG ?? null,
              carbsG: p.carbsG ?? null,
              fatG: p.fatG ?? null,
              createdBy: { fullName: p.creator?.fullName ?? "—" },
            })),
        );
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.goal ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* Header */}
        <View style={tmp.header}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <Icon
              name="star-four-points-outline"
              size={18}
              color={Colors.purple}
            />
            <Text style={tmp.title}>Diet Plan Templates</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={tmp.closeBtn}>
            <Icon name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={tmp.searchRow}>
          <Icon name="magnify" size={16} color={Colors.textMuted} />
          <TextInput
            style={tmp.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search templates..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* List */}
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ gap: Spacing.sm }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 72,
                    backgroundColor: Colors.surfaceRaised,
                    borderRadius: Radius.lg,
                  }}
                />
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 48,
                gap: Spacing.sm,
              }}
            >
              <Icon
                name="clipboard-outline"
                size={32}
                color={Colors.textMuted}
              />
              <Text
                style={{ color: Colors.textMuted, fontSize: Typography.sm }}
              >
                No templates found
              </Text>
              <Text
                style={{ color: Colors.textMuted, fontSize: Typography.xs }}
              >
                Mark plans as "Save as Template" to see them here
              </Text>
            </View>
          ) : (
            filtered.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={tmp.item}
                onPress={() => {
                  onSelect(t);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={tmp.itemTitle}>{t.title}</Text>
                  {t.goal ? (
                    <Text style={tmp.itemGoal}>🎯 {t.goal}</Text>
                  ) : null}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      marginTop: 3,
                    }}
                  >
                    <Text style={tmp.itemMeta}>by {t.createdBy.fullName}</Text>
                    {t.caloriesTarget ? (
                      <Text style={[tmp.itemMeta, { color: Colors.primary }]}>
                        🔥 {t.caloriesTarget} kcal
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Icon name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const tmp = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  itemGoal: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  itemMeta: { color: Colors.textMuted, fontSize: Typography.xs },
});

// ── Food Item Row ─────────────────────────────────────────────────────────────

function FoodItemRow({
  index,
  item,
  onUpdate,
  onRemove,
}: {
  index: number;
  item: MealItem;
  onUpdate: (field: keyof MealItem, val: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={fir.container}>
      {/* Name row */}
      <View style={fir.nameRow}>
        <View style={fir.indexBadge}>
          <Text style={fir.indexText}>{index + 1}</Text>
        </View>
        <TextInput
          style={fir.nameInput}
          value={item.name}
          onChangeText={(v) => onUpdate("name", v)}
          placeholder="Food name (e.g. Chicken Breast)"
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Macro fields */}
      <View style={fir.fieldsRow}>
        {(
          [
            "quantity",
            "calories",
            "protein",
            "carbs",
            "fat",
          ] as (keyof MealItem)[]
        ).map((f) => (
          <View key={f} style={{ flex: 1 }}>
            <Text style={fir.fieldLabel}>{f === "quantity" ? "Qty" : f}</Text>
            <TextInput
              style={fir.fieldInput}
              value={item[f]}
              onChangeText={(v) => onUpdate(f, v)}
              placeholder={
                f === "quantity" ? "100g" : f === "calories" ? "165" : "30g"
              }
              placeholderTextColor={Colors.textMuted}
              keyboardType={f === "quantity" ? "default" : "decimal-pad"}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const fir = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexText: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  fieldsRow: { flexDirection: "row", gap: 4 },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "capitalize",
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    textAlign: "center",
  },
});

// ── Diet Form Modal ───────────────────────────────────────────────────────────

interface DietFormModalProps {
  visible: boolean;
  editPlan?: DietPlan | null;
  gyms: Gym[];
  onClose: () => void;
  onSaved: () => void;
}

function DietFormModal({
  visible,
  editPlan,
  gyms,
  onClose,
  onSaved,
}: DietFormModalProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(blankForm());
  const [planData, setPlanData] = useState<PlanData>({});
  const [activeDay, setActiveDay] = useState<Day>("Monday");
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCopyDay, setShowCopyDay] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const setF = (k: keyof FormState, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Init form when modal opens
  useEffect(() => {
    if (!visible) return;
    if (editPlan) {
      setForm({
        gymId: (editPlan as any).gymId ?? gyms[0]?.id ?? "",
        memberId:
          (editPlan as any).assignedToMemberId ??
          editPlan.assignedMember?.id ??
          "",
        freeForAll: editPlan.isGlobal,
        isTemplate: editPlan.isTemplate,
        title: editPlan.title ?? "",
        description: editPlan.description ?? "",
        goal: editPlan.goal ?? "",
        caloriesTarget: String(editPlan.caloriesTarget ?? ""),
        proteinG: String(editPlan.proteinG ?? ""),
        carbsG: String(editPlan.carbsG ?? ""),
        fatG: String(editPlan.fatG ?? ""),
      });
      setPlanData((editPlan as any).planData ?? {});
    } else {
      setForm(blankForm(gyms[0]?.id ?? ""));
      setPlanData({});
    }
    setActiveDay("Monday");
  }, [visible, editPlan, gyms]);

  // Load members when gym / freeForAll changes
  useEffect(() => {
    if (!form.gymId || form.freeForAll) {
      setMembers([]);
      return;
    }
    membersApi
      .list({ gymId: form.gymId, status: "ACTIVE" })
      .then((d: any) => setMembers(d?.members ?? []))
      .catch(() => {});
  }, [form.gymId, form.freeForAll]);

  // Derived
  const slots = getSlotsForDay(planData, activeDay);
  const totalMeals = Object.values(planData).reduce(
    (s, arr) => s + arr.length,
    0,
  );

  // Plan data operations
  const addSlot = (time: string) => {
    const key = `${activeDay}__${time}`;
    if (!planData[key]) setPlanData((p) => ({ ...p, [key]: [] }));
  };

  const removeSlot = (time: string) => {
    setPlanData((p) => {
      const next = { ...p };
      delete next[`${activeDay}__${time}`];
      return next;
    });
  };

  const addMealItem = (time: string) => {
    const key = `${activeDay}__${time}`;
    setPlanData((p) => ({ ...p, [key]: [...(p[key] ?? []), emptyMeal()] }));
  };

  const removeMealItem = (time: string, idx: number) => {
    const key = `${activeDay}__${time}`;
    setPlanData((p) => ({
      ...p,
      [key]: p[key].filter((_: any, i: number) => i !== idx),
    }));
  };

  const updateMealItem = (
    time: string,
    idx: number,
    field: keyof MealItem,
    val: string,
  ) => {
    const key = `${activeDay}__${time}`;
    setPlanData((p) => {
      const arr = [...(p[key] ?? [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...p, [key]: arr };
    });
  };

  const copyDayMeals = (targetDays: Day[]) => {
    const sourceDaySlots = getSlotsForDay(planData, activeDay);
    if (sourceDaySlots.length === 0) return;
    setPlanData((prev) => {
      const next = { ...prev };
      for (const targetDay of targetDays) {
        // Remove existing slots for target day
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${targetDay}__`)) delete next[k];
        });
        // Copy source day slots
        for (const slot of sourceDaySlots) {
          next[`${targetDay}__${slot}`] = (
            prev[`${activeDay}__${slot}`] ?? []
          ).map((item) => ({ ...item }));
        }
      }
      return next;
    });
    const label =
      targetDays.length === 1 ? targetDays[0] : `${targetDays.length} days`;
    Toast.show({
      type: "success",
      text1: `Copied ${activeDay}'s meals to ${label}`,
    });
  };

  const applyTemplate = (t: Template) => {
    setPlanData(t.planData ?? {});
    setForm((prev) => ({
      ...prev,
      title: prev.title || t.title || "",
      goal: prev.goal || t.goal || "",
      description: prev.description || t.description || "",
      caloriesTarget: prev.caloriesTarget || String(t.caloriesTarget ?? ""),
      proteinG: prev.proteinG || String(t.proteinG ?? ""),
      carbsG: prev.carbsG || String(t.carbsG ?? ""),
      fatG: prev.fatG || String(t.fatG ?? ""),
    }));
    Toast.show({
      type: "success",
      text1: `Template "${t.title}" applied!`,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: "error", text1: "Plan title is required" });
      return;
    }
    if (!form.gymId) {
      Toast.show({ type: "error", text1: "Please select a gym" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        gymId: form.gymId,
        title: form.title.trim(),
        description: form.description || null,
        goal: form.goal || null,
        caloriesTarget: form.caloriesTarget
          ? Number(form.caloriesTarget)
          : null,
        proteinG: form.proteinG ? Number(form.proteinG) : null,
        carbsG: form.carbsG ? Number(form.carbsG) : null,
        fatG: form.fatG ? Number(form.fatG) : null,
        isGlobal: form.freeForAll,
        isTemplate: form.isTemplate,
        assignedToMemberId:
          !form.freeForAll && form.memberId ? form.memberId : null,
        planData,
      };
      if (editPlan) {
        await dietsApi.update(editPlan.id, payload);
      } else {
        await dietsApi.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["ownerDiets"] });
      Toast.show({
        type: "success",
        text1: editPlan ? "Plan updated!" : "Diet plan created!",
      });
      onSaved();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.message ?? "Failed to save plan",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={dfm.header}>
              <View style={{ flex: 1 }}>
                <Text style={dfm.headerTitle}>
                  {editPlan ? "Edit Diet Plan" : "New Diet Plan"}
                </Text>
                <Text style={dfm.headerSub}>
                  {totalMeals} food item{totalMeals !== 1 ? "s" : ""} across all
                  days
                </Text>
              </View>
              <TouchableOpacity
                style={dfm.templateBtn}
                onPress={() => setShowTemplates(true)}
              >
                <Icon
                  name="star-four-points-outline"
                  size={13}
                  color={Colors.purple}
                />
                <Text style={dfm.templateBtnTxt}>Templates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dfm.closeBtn} onPress={onClose}>
                <Icon name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={dfm.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Toggles ─────────────────────────────────────────── */}
              <Card>
                <Toggle
                  label="Free for All Members"
                  sub="Visible to all gym members"
                  value={form.freeForAll}
                  onToggle={() => setF("freeForAll", !form.freeForAll)}
                />
                <View style={dfm.divider} />
                <Toggle
                  label="Save as Template"
                  sub="Reuse this plan in the future"
                  value={form.isTemplate}
                  onToggle={() => setF("isTemplate", !form.isTemplate)}
                />
              </Card>

              {/* ── Gym + Member ─────────────────────────────────────── */}
              <Card>
                <SectionLabel label="GYM *" />
                <View style={dfm.pillRow}>
                  {gyms.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[dfm.pill, form.gymId === g.id && dfm.pillActive]}
                      onPress={() => setF("gymId", g.id)}
                    >
                      <Text
                        style={[
                          dfm.pillTxt,
                          form.gymId === g.id && dfm.pillTxtActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!form.freeForAll && (
                  <>
                    <SectionLabel label="ASSIGN TO MEMBER (optional)" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={[dfm.pillRow, { flexWrap: "nowrap" }]}>
                        <TouchableOpacity
                          style={[dfm.pill, !form.memberId && dfm.pillActive]}
                          onPress={() => setF("memberId", "")}
                        >
                          <Text
                            style={[
                              dfm.pillTxt,
                              !form.memberId && dfm.pillTxtActive,
                            ]}
                          >
                            Unassigned
                          </Text>
                        </TouchableOpacity>
                        {members.map((m: any) => (
                          <TouchableOpacity
                            key={m.id}
                            style={[
                              dfm.pill,
                              form.memberId === m.id && dfm.pillActive,
                            ]}
                            onPress={() =>
                              setF(
                                "memberId",
                                form.memberId === m.id ? "" : m.id,
                              )
                            }
                          >
                            <Text
                              style={[
                                dfm.pillTxt,
                                form.memberId === m.id && dfm.pillTxtActive,
                              ]}
                              numberOfLines={1}
                            >
                              {m.profile?.fullName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}
              </Card>

              {/* ── Plan Details ─────────────────────────────────────── */}
              <Card>
                <SectionLabel label="PLAN TITLE *" />
                <FieldInput
                  value={form.title}
                  onChangeText={(v) => setF("title", v)}
                  placeholder="e.g. High-Protein Bulk Plan"
                />
                <SectionLabel label="GOAL" />
                <FieldInput
                  value={form.goal}
                  onChangeText={(v) => setF("goal", v)}
                  placeholder="e.g. Muscle gain"
                />
              </Card>

              {/* ── Macro Targets ────────────────────────────────────── */}
              <Card>
                <SectionLabel label="MACRO TARGETS" />
                <View style={dfm.macroRow}>
                  {(
                    [
                      {
                        key: "caloriesTarget",
                        label: "Kcal",
                        placeholder: "2200",
                      },
                      {
                        key: "proteinG",
                        label: "Protein g",
                        placeholder: "180",
                      },
                      { key: "carbsG", label: "Carbs g", placeholder: "250" },
                      { key: "fatG", label: "Fat g", placeholder: "70" },
                    ] as const
                  ).map(({ key, label, placeholder }) => (
                    <View key={key} style={{ flex: 1 }}>
                      <Text style={dfm.macroLabel}>{label}</Text>
                      <TextInput
                        style={dfm.macroInput}
                        value={(form as any)[key]}
                        onChangeText={(v) => setF(key, v)}
                        placeholder={placeholder}
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                </View>
              </Card>

              {/* ── Meal Planner ─────────────────────────────────────── */}
              <Card>
                <View style={dfm.plannerHeader}>
                  <Text style={dfm.plannerTitle}>Meal Planner</Text>
                  <Text style={dfm.plannerSub}>{activeDay}</Text>
                </View>

                {/* Day tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: Spacing.md }}
                >
                  <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                    {DAYS.map((day) => {
                      const count = dayItemCount(planData, day);
                      const slotCount = getSlotsForDay(planData, day).length;
                      const active = activeDay === day;
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[dfm.dayTab, active && dfm.dayTabActive]}
                          onPress={() => setActiveDay(day)}
                        >
                          <Text
                            style={[
                              dfm.dayTabTxt,
                              active && dfm.dayTabTxtActive,
                            ]}
                          >
                            {day.slice(0, 3)}
                          </Text>
                          {slotCount > 0 ? (
                            <Text
                              style={[
                                dfm.dayTabCount,
                                active && { color: "#fff" },
                              ]}
                            >
                              {slotCount}🕐{count > 0 ? ` (${count})` : ""}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Slot action buttons */}
                <View style={dfm.slotActionsRow}>
                  {slots.length > 0 ? (
                    <TouchableOpacity
                      style={dfm.copyDayBtn}
                      onPress={() => setShowCopyDay(true)}
                    >
                      <Icon
                        name="content-copy"
                        size={13}
                        color={Colors.textMuted}
                      />
                      <Text style={dfm.copyDayTxt}>Copy to days</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={dfm.addSlotBtn}
                    onPress={() => setShowTimeModal(true)}
                  >
                    <Icon name="plus" size={13} color={Colors.primary} />
                    <Text style={dfm.addSlotTxt}>Add Meal Time</Text>
                  </TouchableOpacity>
                </View>

                {/* Time slots */}
                {slots.length === 0 ? (
                  <View style={dfm.emptySlots}>
                    <Icon
                      name="clock-outline"
                      size={28}
                      color={Colors.textMuted}
                    />
                    <Text style={dfm.emptySlotsTitle}>
                      No meal times for {activeDay}
                    </Text>
                    <Text style={dfm.emptySlotsHint}>
                      Tap "Add Meal Time" to add a slot
                    </Text>
                  </View>
                ) : (
                  slots.map((time) => {
                    const key = `${activeDay}__${time}`;
                    const items = planData[key] ?? [];
                    return (
                      <View key={time} style={dfm.slotCard}>
                        {/* Slot header */}
                        <View style={dfm.slotHeader}>
                          <View style={dfm.slotHeaderLeft}>
                            <Icon
                              name="clock-outline"
                              size={14}
                              color={Colors.primary}
                            />
                            <Text style={dfm.slotTime}>{time}</Text>
                            <Text style={dfm.slotCount}>
                              · {items.length} item
                              {items.length !== 1 ? "s" : ""}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() =>
                              showAlert(
                                "Remove Slot",
                                `Remove the ${time} slot and all its food items?`,
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Remove",
                                    style: "destructive",
                                    onPress: () => removeSlot(time),
                                  },
                                ],
                              )
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon
                              name="trash-can-outline"
                              size={15}
                              color={Colors.error}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Food items */}
                        <View style={{ padding: Spacing.md }}>
                          {items.length === 0 ? (
                            <View style={dfm.emptyItems}>
                              <Icon
                                name="food-outline"
                                size={20}
                                color={Colors.textMuted}
                              />
                              <Text style={dfm.emptyItemsTxt}>
                                No food items added
                              </Text>
                            </View>
                          ) : (
                            items.map((item, idx) => (
                              <FoodItemRow
                                key={idx}
                                index={idx}
                                item={item}
                                onUpdate={(f, v) =>
                                  updateMealItem(time, idx, f, v)
                                }
                                onRemove={() => removeMealItem(time, idx)}
                              />
                            ))
                          )}
                          <TouchableOpacity
                            style={dfm.addItemBtn}
                            onPress={() => addMealItem(time)}
                          >
                            <Icon
                              name="plus"
                              size={14}
                              color={Colors.success}
                            />
                            <Text style={dfm.addItemTxt}>Add Food Item</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </Card>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* ── Action Bar ──────────────────────────────────────────── */}
            <View style={dfm.actionBar}>
              <TouchableOpacity style={dfm.cancelBtn} onPress={onClose}>
                <Text style={dfm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dfm.saveBtn, saving && dfm.saveBtnOff]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={16} color="#fff" />
                    <Text style={dfm.saveTxt}>
                      {editPlan ? "Update Plan" : "Create Plan"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Time picker bottom sheet */}
      <TimePickerSheet
        visible={showTimeModal}
        onSelect={addSlot}
        onClose={() => setShowTimeModal(false)}
        existingSlots={slots}
        dayLabel={activeDay}
      />

      {/* Copy day modal */}
      <CopyDayModal
        visible={showCopyDay}
        sourceDay={activeDay}
        onCopy={copyDayMeals}
        onClose={() => setShowCopyDay(false)}
      />

      {/* Template picker */}
      <TemplatePicker
        visible={showTemplates}
        onSelect={applyTemplate}
        onClose={() => setShowTemplates(false)}
      />
    </>
  );
}

const dfm = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  headerSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.purpleFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.purple + "40",
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  templateBtnTxt: {
    color: Colors.purple,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  pillTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTxtActive: { color: Colors.primary, fontWeight: "700" },
  macroRow: { flexDirection: "row", gap: Spacing.xs },
  macroLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
    marginBottom: 4,
  },
  macroInput: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    textAlign: "center",
  },
  plannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  plannerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "800",
  },
  plannerSub: { color: Colors.textMuted, fontSize: Typography.xs },
  dayTab: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
    minWidth: 44,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  dayTabTxtActive: { color: "#fff" },
  dayTabCount: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  slotActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  copyDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  copyDayTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  addSlotTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  emptySlots: {
    alignItems: "center",
    paddingVertical: 32,
    gap: Spacing.sm,
  },
  emptySlotsTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  emptySlotsHint: { color: Colors.textMuted, fontSize: Typography.xs },
  slotCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  slotHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  slotTime: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  slotCount: { color: Colors.textMuted, fontSize: Typography.xs },
  emptyItems: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  emptyItemsTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.success + "60",
    borderRadius: Radius.lg,
    paddingVertical: 10,
  },
  addItemTxt: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  actionBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelTxt: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  saveBtnOff: { opacity: 0.5 },
  saveTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OwnerDietsScreen() {
  const qc = useQueryClient();
  const { hasDietPlans } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<DietPlan[]>({
    queryKey: ["ownerDiets", gymId],
    queryFn: () =>
      dietsApi.list({ gymId: gymId || undefined }) as Promise<DietPlan[]>,
    enabled: hasDietPlans,
    staleTime: 60_000,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => dietsApi.update(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerDiets"] });
      Toast.show({ type: "success", text1: "Plan archived" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (plan: DietPlan) =>
      dietsApi.create({
        gymId: (plan as any).gymId ?? (plan.gym as any)?.id,
        title: `${plan.title} (Copy)`,
        goal: plan.goal ?? null,
        description: plan.description ?? null,
        caloriesTarget: plan.caloriesTarget,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatG: plan.fatG,
        isGlobal: plan.isGlobal,
        isTemplate: plan.isTemplate,
        planData: (plan as any).planData ?? {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerDiets"] });
      Toast.show({ type: "success", text1: "Plan duplicated!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmArchive = (plan: DietPlan) => {
    showAlert("Archive Plan", `Archive "${plan.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => archiveMutation.mutate(plan.id),
      },
    ]);
  };

  const filteredPlans = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.goal ?? "").toLowerCase().includes(q),
    );
  }, [plans, searchQ]);

  const openCreate = () => {
    setEditingPlan(null);
    setFormVisible(true);
  };

  const openEdit = (plan: DietPlan) => {
    setEditingPlan(plan);
    setFormVisible(true);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Header
          title="Diet Plans"
          menu
          right={
            hasDietPlans ? (
              <TouchableOpacity style={s.addBtn} onPress={openCreate}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Search */}
        <View style={s.searchRow}>
          <Icon
            name="magnify"
            size={18}
            color={Colors.textMuted}
            style={s.searchIcon}
          />
          <TextInput
            style={s.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search diet plans..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Gym filter */}
        {gyms.length > 1 && (
          <View style={s.filterRow}>
            {[{ id: "", name: "All" } as Gym, ...gyms].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[s.pill, gymId === g.id && s.pillActive]}
              >
                <Text style={[s.pillTxt, gymId === g.id && s.pillTxtActive]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PlanGate allowed={hasDietPlans} featureLabel="Diet Plans">
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup
              variant="card"
              count={3}
              itemHeight={140}
              gap={Spacing.md}
            />
          </View>
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            icon="food-apple-outline"
            title={searchQ ? "No plans match your search" : "No diet plans"}
            subtitle={
              searchQ
                ? "Try a different keyword"
                : "Create nutrition plans for your members"
            }
            action={
              !searchQ ? (
                <TouchableOpacity style={s.emptyAction} onPress={openCreate}>
                  <Icon name="plus" size={16} color="#fff" />
                  <Text style={s.emptyActionTxt}>Create First Plan</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
        ) : (
          <FlatList<DietPlan>
            data={filteredPlans}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.md }} />
            )}
            renderItem={({ item: p }) => {
              const allSlots = Object.keys((p as any).planData ?? {});
              const totalItems = Object.values(
                (p as any).planData ?? {},
              ).reduce((sum: number, arr: any) => sum + arr.length, 0);
              const daysWithData = [
                ...new Set(allSlots.map((k) => k.split("__")[0])),
              ].length;
              const isArchiving =
                archiveMutation.isPending &&
                (archiveMutation.variables as string) === p.id;

              return (
                <View style={isArchiving ? { opacity: 0.5 } : undefined}>
                  <Card>
                    {/* Badges row */}
                    <View style={s.badgesRow}>
                      <View style={s.badgesLeft}>
                        {p.isGlobal ? (
                          <View style={[s.badge, s.badgePurple]}>
                            <Text
                              style={[s.badgeTxt, { color: Colors.purple }]}
                            >
                              All Members
                            </Text>
                          </View>
                        ) : null}
                        {p.isTemplate ? (
                          <View style={[s.badge, s.badgeInfo]}>
                            <Text style={[s.badgeTxt, { color: Colors.info }]}>
                              Template
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {p.caloriesTarget ? (
                        <View style={[s.badge, s.badgeCalories]}>
                          <Icon name="fire" size={10} color={Colors.primary} />
                          <Text style={[s.badgeTxt, { color: Colors.primary }]}>
                            {p.caloriesTarget} kcal
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Title + goal */}
                    <Text style={s.planTitle} numberOfLines={1}>
                      {p.title ?? "Diet Plan"}
                    </Text>
                    {p.goal ? (
                      <Text style={s.planGoal}>🎯 {p.goal}</Text>
                    ) : null}

                    {/* Macros */}
                    {p.proteinG || p.carbsG || p.fatG ? (
                      <View style={s.macroRow}>
                        {p.proteinG ? (
                          <MacroChip
                            label="Protein"
                            value={`${p.proteinG}g`}
                            color={Colors.info}
                          />
                        ) : null}
                        {p.carbsG ? (
                          <MacroChip
                            label="Carbs"
                            value={`${p.carbsG}g`}
                            color={Colors.warning}
                          />
                        ) : null}
                        {p.fatG ? (
                          <MacroChip
                            label="Fat"
                            value={`${p.fatG}g`}
                            color={Colors.error}
                          />
                        ) : null}
                      </View>
                    ) : null}

                    {/* Stats */}
                    <View style={s.statsRow}>
                      <Text style={s.planMeta}>{p.gym?.name}</Text>
                      {totalItems > 0 ? (
                        <Text style={s.planMeta}>
                          {totalItems} item{totalItems !== 1 ? "s" : ""}
                        </Text>
                      ) : null}
                      {daysWithData > 0 ? (
                        <Text style={s.planMeta}>
                          {daysWithData} day{daysWithData !== 1 ? "s" : ""}
                        </Text>
                      ) : null}
                      {p.assignedMember ? (
                        <View style={s.assignedRow}>
                          <Icon
                            name="account-outline"
                            size={11}
                            color={Colors.success}
                          />
                          <Text style={[s.planMeta, { color: Colors.success }]}>
                            {p.assignedMember.profile?.fullName}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Actions */}
                    <View style={s.actionsRow}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => openEdit(p)}
                      >
                        <Icon
                          name="pencil-outline"
                          size={14}
                          color={Colors.success}
                        />
                        <Text style={[s.actionTxt, { color: Colors.success }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => duplicateMutation.mutate(p)}
                        disabled={duplicateMutation.isPending}
                      >
                        <Icon
                          name="content-copy"
                          size={14}
                          color={Colors.textMuted}
                        />
                        <Text style={s.actionTxt}>Duplicate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => confirmArchive(p)}
                        disabled={isArchiving}
                      >
                        {isArchiving ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.error}
                          />
                        ) : (
                          <Icon
                            name="archive-outline"
                            size={14}
                            color={Colors.error}
                          />
                        )}
                        <Text style={[s.actionTxt, { color: Colors.error }]}>
                          Archive
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              );
            }}
          />
        )}
      </PlanGate>

      {/* Create / Edit modal */}
      <DietFormModal
        visible={formVisible}
        editPlan={editingPlan}
        gyms={gyms}
        onClose={() => {
          setFormVisible(false);
          setEditingPlan(null);
        }}
        onSaved={() => {
          setFormVisible(false);
          setEditingPlan(null);
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    height: 40,
  },
  filterRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  pillTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTxtActive: { color: Colors.primary, fontWeight: "700" },
  list: { padding: Spacing.lg, paddingBottom: 32 },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  badgesLeft: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgePurple: {
    backgroundColor: Colors.purpleFaded,
    borderColor: Colors.purple + "30",
  },
  badgeInfo: {
    backgroundColor: Colors.infoFaded,
    borderColor: Colors.info + "40",
  },
  badgeCalories: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary + "40",
  },
  badgeTxt: { fontSize: 10, fontWeight: "600" },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: 3,
  },
  planGoal: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.sm,
  },
  macroRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  actionTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyActionTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.sm,
  },
});
