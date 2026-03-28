// mobile/src/screens/owner/AddDietPlanScreen.tsx
// Full-screen dedicated screen for creating / editing a diet plan.
// Mirrors the web diets page: day tabs, meal tabs, food items with macros,
// template picker, save-as-template, global/member assignment.
// Replaces the modal that was inside DietsScreen.

import { dietsApi, gymsApi, membersApi } from "@/api/endpoints";
import { Button, Card, Header, Input, Skeleton } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
    DietPlan,
    Gym,
    GymMemberListItem,
    MembersListResponse,
} from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface FoodItem {
  name: string;
  quantity: string; // "100g", "1 cup"
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

type MealItems = FoodItem[];
// planData structure mirrors web: { "Monday__Breakfast": FoodItem[], ... }
type PlanData = Record<string, MealItems>;

interface DietForm {
  gymId: string;
  title: string;
  goal: string;
  description: string;
  caloriesTarget: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  isGlobal: boolean;
  isTemplate: boolean;
  assignedToMemberId: string;
  planData: PlanData;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TIMES = [
  "Breakfast",
  "Mid-Morning",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Post-Workout",
];

const COMMON_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Lean Bulk",
  "Maintenance",
  "Fat Loss",
  "High Protein",
];

const emptyFood = (): FoodItem => ({
  name: "",
  quantity: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
});

function blankForm(defaultGymId = ""): DietForm {
  return {
    gymId: defaultGymId,
    title: "",
    goal: "",
    description: "",
    caloriesTarget: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    isGlobal: false,
    isTemplate: false,
    assignedToMemberId: "",
    planData: {},
  };
}

function mealKey(day: string, meal: string) {
  return `${day}__${meal}`;
}

// ── Food item row ─────────────────────────────────────────────────────────────

function FoodItemRow({
  index,
  item,
  onChange,
  onRemove,
}: {
  index: number;
  item: FoodItem;
  onChange: (field: keyof FoodItem, val: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View style={fi.container}>
      <TouchableOpacity
        style={fi.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={fi.indexBadge}>
          <Text style={fi.indexText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fi.name} numberOfLines={1}>
            {item.name || "New food item"}
          </Text>
          {item.calories ? (
            <Text style={fi.macroSummary}>
              {item.calories ? `${item.calories} kcal` : ""}
              {item.protein ? ` · P: ${item.protein}g` : ""}
              {item.carbs ? ` · C: ${item.carbs}g` : ""}
            </Text>
          ) : null}
        </View>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={15}
          color={Colors.textMuted}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={15} color={Colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={fi.body}>
          <Input
            label="Food Name *"
            value={item.name}
            onChangeText={(v) => onChange("name", v)}
            placeholder="e.g. Chicken Breast"
            leftIcon="food-drumstick-outline"
          />
          <View style={fi.row2}>
            <View style={{ flex: 1 }}>
              <Input
                label="Quantity"
                value={item.quantity}
                onChangeText={(v) => onChange("quantity", v)}
                placeholder="100g"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Calories"
                value={item.calories}
                onChangeText={(v) => onChange("calories", v)}
                keyboardType="numeric"
                placeholder="165"
              />
            </View>
          </View>
          <View style={fi.row3}>
            <View style={{ flex: 1 }}>
              <Input
                label="Protein (g)"
                value={item.protein}
                onChangeText={(v) => onChange("protein", v)}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Carbs (g)"
                value={item.carbs}
                onChangeText={(v) => onChange("carbs", v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Fat (g)"
                value={item.fat}
                onChangeText={(v) => onChange("fat", v)}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const fi = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.successFaded,
    borderWidth: 1,
    borderColor: Colors.success + "40",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexText: { color: Colors.success, fontSize: 11, fontWeight: "700" },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    flex: 1,
  },
  macroSummary: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  body: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  row2: { flexDirection: "row", gap: Spacing.sm },
  row3: { flexDirection: "row", gap: Spacing.sm },
});

// ── Macro summary bar ─────────────────────────────────────────────────────────

function MacroBar({
  caloriesTarget,
  proteinG,
  carbsG,
  fatG,
}: {
  caloriesTarget: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}) {
  const items = [
    {
      label: "Calories",
      value: caloriesTarget,
      unit: "kcal",
      color: Colors.primary,
    },
    { label: "Protein", value: proteinG, unit: "g", color: Colors.info },
    { label: "Carbs", value: carbsG, unit: "g", color: Colors.warning },
    { label: "Fat", value: fatG, unit: "g", color: Colors.error },
  ];
  if (!caloriesTarget && !proteinG && !carbsG && !fatG) return null;
  return (
    <View style={mb.container}>
      {items.map((item) =>
        item.value ? (
          <View
            key={item.label}
            style={[
              mb.badge,
              {
                backgroundColor: item.color + "20",
                borderColor: item.color + "40",
              },
            ]}
          >
            <Text style={[mb.value, { color: item.color }]}>
              {item.value}
              {item.unit}
            </Text>
            <Text style={mb.label}>{item.label}</Text>
          </View>
        ) : null,
      )}
    </View>
  );
}

const mb = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 64,
  },
  value: { fontSize: Typography.sm, fontWeight: "700" },
  label: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
});

// ── Totals calculator for active meal ────────────────────────────────────────

function MealTotals({ items }: { items: FoodItem[] }) {
  if (items.length === 0) return null;
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (parseFloat(item.calories) || 0),
      protein: acc.protein + (parseFloat(item.protein) || 0),
      carbs: acc.carbs + (parseFloat(item.carbs) || 0),
      fat: acc.fat + (parseFloat(item.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return (
    <View style={mt.container}>
      <Text style={mt.title}>Meal Totals</Text>
      <View style={mt.row}>
        <Text style={[mt.val, { color: Colors.primary }]}>
          {Math.round(totals.calories)}
        </Text>
        <Text style={mt.unit}>kcal</Text>
        <View style={mt.divider} />
        <Text style={[mt.val, { color: Colors.info }]}>
          {Math.round(totals.protein)}g
        </Text>
        <Text style={mt.unit}>protein</Text>
        <View style={mt.divider} />
        <Text style={[mt.val, { color: Colors.warning }]}>
          {Math.round(totals.carbs)}g
        </Text>
        <Text style={mt.unit}>carbs</Text>
        <View style={mt.divider} />
        <Text style={[mt.val, { color: Colors.error }]}>
          {Math.round(totals.fat)}g
        </Text>
        <Text style={mt.unit}>fat</Text>
      </View>
    </View>
  );
}

const mt = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginRight: Spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  val: { fontSize: Typography.sm, fontWeight: "700" },
  unit: { color: Colors.textMuted, fontSize: Typography.xs },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
});

// ── Template picker bottom sheet ─────────────────────────────────────────────

function TemplatePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (planData: PlanData, title: string, goal: string) => void;
}) {
  const [search, setSearch] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["dietTemplates"],
    queryFn: () =>
      fetch(
        `${process.env.API_BASE_URL ?? "http://192.168.1.10:3000"}/api/owner/plan-templates?type=DIET`,
      ).then((r) => r.json()),
    enabled: visible,
    staleTime: 5 * 60_000,
  });

  const filtered = (templates as any[]).filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.goal ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (!visible) return null;

  return (
    <View style={tp.overlay}>
      <TouchableOpacity
        style={tp.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={tp.sheet}>
        <View style={tp.handle} />
        <View style={tp.header}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <Icon name="lightning-bolt" size={16} color={Colors.purple} />
            <Text style={tp.headerTitle}>Use Template</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={tp.searchWrap}>
          <Icon name="magnify" size={16} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search templates..."
            placeholderTextColor={Colors.textMuted}
            style={tp.searchInput}
          />
        </View>
        <ScrollView
          style={{ maxHeight: 340 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={70} />
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: "center", padding: Spacing.xxxl }}>
              <Text
                style={{ color: Colors.textMuted, fontSize: Typography.sm }}
              >
                No templates found
              </Text>
            </View>
          ) : (
            <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
              {filtered.map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  style={tp.templateCard}
                  onPress={() => {
                    onSelect(t.planData ?? {}, t.title, t.goal ?? "");
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={tp.templateTitle}>{t.title}</Text>
                    {t.goal ? (
                      <Text style={tp.templateGoal}>🎯 {t.goal}</Text>
                    ) : null}
                    <Text style={tp.templateMeta}>
                      by {t.createdBy?.fullName ?? "—"} · {t.usageCount} uses
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  overlay: { position: "absolute", inset: 0, zIndex: 100 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    paddingVertical: 0,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  templateTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  templateGoal: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  templateMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AddDietPlanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();

  const planId = (route.params as any)?.planId as string | undefined;
  const isEditMode = !!planId;

  const [form, setForm] = useState<DietForm>(blankForm());
  const [activeDay, setActiveDay] = useState("Monday");
  const [activeMeal, setActiveMeal] = useState("Breakfast");
  const [members, setMembers] = useState<GymMemberListItem[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const set = (k: keyof DietForm, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Load gyms
  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!form.gymId && gyms.length > 0) set("gymId", gyms[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms]);

  // Load existing plan for edit
  const { data: allPlans = [] } = useQuery<DietPlan[]>({
    queryKey: ["ownerDiets", ""],
    queryFn: () => dietsApi.list({}) as Promise<DietPlan[]>,
    enabled: isEditMode,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isEditMode && allPlans.length > 0) {
      const plan = allPlans.find((p) => p.id === planId);
      if (plan) {
        setForm({
          gymId: (plan as any).gymId ?? gyms[0]?.id ?? "",
          title: plan.title ?? "",
          goal: plan.goal ?? "",
          description: plan.description ?? "",
          caloriesTarget:
            plan.caloriesTarget != null ? String(plan.caloriesTarget) : "",
          proteinG: plan.proteinG != null ? String(plan.proteinG) : "",
          carbsG: plan.carbsG != null ? String(plan.carbsG) : "",
          fatG: plan.fatG != null ? String(plan.fatG) : "",
          isGlobal: plan.isGlobal,
          isTemplate: plan.isTemplate,
          assignedToMemberId: plan.assignedMember?.id ?? "",
          planData: (plan as any).planData ?? {},
        });
      }
    }
  }, [isEditMode, allPlans, planId]);

  // Load members
  useEffect(() => {
    if (!form.gymId || form.isGlobal) {
      setMembers([]);
      return;
    }
    membersApi
      .list({ gymId: form.gymId, status: "ACTIVE" })
      .then((d: unknown) =>
        setMembers((d as MembersListResponse).members ?? []),
      )
      .catch(() => {});
  }, [form.gymId, form.isGlobal]);

  // ── Plan data helpers ─────────────────────────────────────────────────────

  const key = mealKey(activeDay, activeMeal);
  const currentItems = form.planData[key] ?? [];

  const setItems = (items: FoodItem[]) =>
    set("planData", { ...form.planData, [key]: items });

  const addItem = () => setItems([...currentItems, emptyFood()]);
  const removeItem = (i: number) =>
    setItems(currentItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof FoodItem, val: string) => {
    const updated = [...currentItems];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  // Total food items across whole plan
  const totalItems = Object.values(form.planData).reduce(
    (s, items) => s + items.length,
    0,
  );

  // Count per day (for badge)
  const dayCount = (day: string) =>
    MEAL_TIMES.reduce(
      (s, m) => s + (form.planData[mealKey(day, m)]?.length ?? 0),
      0,
    );

  // Meal count per meal (for badge)
  const mealCount = (meal: string) =>
    form.planData[mealKey(activeDay, meal)]?.length ?? 0;

  // ── Template ─────────────────────────────────────────────────────────────

  const applyTemplate = (planData: PlanData, title: string, goal: string) => {
    set("planData", planData);
    if (!form.title) set("title", title);
    if (!form.goal) set("goal", goal);
    Toast.show({
      type: "success",
      text1: `Template applied! ${totalItems} food items loaded`,
    });
  };

  // ── Save as template ──────────────────────────────────────────────────────

  const saveAsTemplate = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: "error", text1: "Add a plan title first" });
      return;
    }
    try {
      const res = await fetch(
        `${process.env.API_BASE_URL ?? "http://192.168.1.10:3000"}/api/owner/plan-templates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gymId: form.gymId || null,
            type: "DIET",
            title: form.title,
            goal: form.goal,
            planData: form.planData,
          }),
        },
      );
      if (res.ok)
        Toast.show({ type: "success", text1: "Saved as template! ⚡" });
      else Toast.show({ type: "error", text1: "Failed to save template" });
    } catch {
      Toast.show({ type: "error", text1: "Network error" });
    }
  };

  // ── Save mutation ─────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        gymId: form.gymId || gyms[0]?.id,
        title: form.title.trim(),
        goal: form.goal || null,
        description: form.description || null,
        caloriesTarget: form.caloriesTarget
          ? Number(form.caloriesTarget)
          : null,
        proteinG: form.proteinG ? Number(form.proteinG) : null,
        carbsG: form.carbsG ? Number(form.carbsG) : null,
        fatG: form.fatG ? Number(form.fatG) : null,
        isGlobal: form.isGlobal,
        isTemplate: form.isTemplate,
        assignedToMemberId:
          !form.isGlobal && form.assignedToMemberId
            ? form.assignedToMemberId
            : null,
        planData: form.planData,
      };
      return isEditMode
        ? dietsApi.update(planId!, payload)
        : dietsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerDiets"] });
      Toast.show({
        type: "success",
        text1: isEditMode ? "Plan updated! ✅" : "Diet plan created! 🥗",
      });
      navigation.goBack();
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      Toast.show({ type: "error", text1: "Plan title is required" });
      return;
    }
    saveMutation.mutate();
  };

  const handleDiscard = () => {
    showAlert("Discard Changes", "Discard this plan?", [
      { text: "Keep Editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={ds.safe}>
      <ScrollView
        contentContainerStyle={ds.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Header
          title={isEditMode ? "Edit Diet Plan" : "New Diet Plan"}
          back
          onBack={handleDiscard}
          right={
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <TouchableOpacity
                style={ds.templateBtn}
                onPress={() => setShowTemplates(true)}
              >
                <Icon name="lightning-bolt" size={14} color={Colors.purple} />
                <Text style={ds.templateBtnText}>Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={ds.saveBtn}
                onPress={handleSave}
                disabled={saveMutation.isPending}
              >
                <Text style={ds.saveBtnText}>
                  {saveMutation.isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Update"
                      : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* ── Section 1: Plan Details ───────────────────────── */}
        <Card style={ds.section}>
          <Text style={ds.sectionTitle}>Plan Details</Text>

          {gyms.length > 1 && (
            <View style={ds.fieldWrap}>
              <Text style={ds.fieldLabel}>Gym</Text>
              <View style={ds.chipRow}>
                {gyms.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => set("gymId", g.id)}
                    style={[ds.chip, form.gymId === g.id && ds.chipActive]}
                  >
                    <Text
                      style={[
                        ds.chipText,
                        form.gymId === g.id && ds.chipTextActive,
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Input
            label="Plan Title *"
            value={form.title}
            onChangeText={(v) => set("title", v)}
            placeholder="e.g. High-Protein Bulk Plan"
            leftIcon="food-apple-outline"
          />

          {/* Goal quick picks */}
          <View style={ds.fieldWrap}>
            <Text style={ds.fieldLabel}>Goal</Text>
            <View style={ds.chipRow}>
              {COMMON_GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => set("goal", form.goal === g ? "" : g)}
                  style={[ds.chip, form.goal === g && ds.chipActive]}
                >
                  <Text
                    style={[ds.chipText, form.goal === g && ds.chipTextActive]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              value={form.goal}
              onChangeText={(v) => set("goal", v)}
              placeholder="Or type a custom goal..."
              containerStyle={{ marginBottom: 0, marginTop: Spacing.xs }}
            />
          </View>

          {/* Macro targets */}
          <Text style={ds.fieldLabel}>Daily Macro Targets</Text>
          <MacroBar
            caloriesTarget={form.caloriesTarget}
            proteinG={form.proteinG}
            carbsG={form.carbsG}
            fatG={form.fatG}
          />
          <View style={ds.macroRow}>
            <View style={{ flex: 2 }}>
              <Input
                label="Calories (kcal)"
                value={form.caloriesTarget}
                onChangeText={(v) => set("caloriesTarget", v)}
                keyboardType="numeric"
                placeholder="2200"
              />
            </View>
          </View>
          <View style={ds.macroRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Protein (g)"
                value={form.proteinG}
                onChangeText={(v) => set("proteinG", v)}
                keyboardType="numeric"
                placeholder="180"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Carbs (g)"
                value={form.carbsG}
                onChangeText={(v) => set("carbsG", v)}
                keyboardType="numeric"
                placeholder="250"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Fat (g)"
                value={form.fatG}
                onChangeText={(v) => set("fatG", v)}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
          </View>
        </Card>

        {/* ── Section 2: Visibility & Assignment ───────────────── */}
        <Card style={ds.section}>
          <Text style={ds.sectionTitle}>Visibility & Assignment</Text>

          {/* Toggles */}
          {[
            {
              key: "isGlobal" as const,
              label: "Free for All Members",
              sub: "All gym members can see this plan",
            },
            {
              key: "isTemplate" as const,
              label: "Save as Template",
              sub: "Reuse this plan later for other members",
            },
          ].map(({ key, label, sub }) => (
            <TouchableOpacity
              key={key}
              style={ds.toggleRow}
              onPress={() => {
                set(key, !form[key]);
                if (key === "isGlobal" && !form.isGlobal)
                  set("assignedToMemberId", "");
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={ds.toggleLabel}>{label}</Text>
                <Text style={ds.toggleSub}>{sub}</Text>
              </View>
              <View style={[ds.toggle, form[key] && ds.toggleOn]}>
                <View style={[ds.toggleThumb, form[key] && ds.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Member assignment */}
          {!form.isGlobal && (
            <View style={ds.fieldWrap}>
              <Text style={ds.fieldLabel}>Assign to Member</Text>
              <View style={ds.chipRow}>
                <TouchableOpacity
                  onPress={() => set("assignedToMemberId", "")}
                  style={[ds.chip, !form.assignedToMemberId && ds.chipActive]}
                >
                  <Text
                    style={[
                      ds.chipText,
                      !form.assignedToMemberId && ds.chipTextActive,
                    ]}
                  >
                    Unassigned
                  </Text>
                </TouchableOpacity>
                {members.slice(0, 10).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() =>
                      set(
                        "assignedToMemberId",
                        form.assignedToMemberId === m.id ? "" : m.id,
                      )
                    }
                    style={[
                      ds.chip,
                      form.assignedToMemberId === m.id && ds.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        ds.chipText,
                        form.assignedToMemberId === m.id && ds.chipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {m.profile.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* ── Section 3: Meal Planner ─────────────────────────── */}
        <Card style={ds.section}>
          <View style={ds.plannerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={ds.sectionTitle}>Meal Planner</Text>
              <Text style={ds.plannerSub}>
                {totalItems} food item{totalItems !== 1 ? "s" : ""} planned ·{" "}
                {activeDay} · {activeMeal}
              </Text>
            </View>
            <TouchableOpacity
              style={ds.saveTemplateBtn}
              onPress={saveAsTemplate}
            >
              <Icon
                name="content-save-outline"
                size={13}
                color={Colors.textMuted}
              />
              <Text style={ds.saveTemplateBtnText}>Save Template</Text>
            </TouchableOpacity>
          </View>

          {/* Day selector */}
          <Text style={[ds.fieldLabel, { marginBottom: 6 }]}>Day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.sm }}
          >
            {DAYS.map((d) => {
              const count = dayCount(d);
              const active = activeDay === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setActiveDay(d)}
                  style={[ds.dayTab, active && ds.dayTabActive]}
                >
                  <Text style={[ds.dayTabText, active && ds.dayTabTextActive]}>
                    {d.slice(0, 3)}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        ds.dayBadge,
                        active && { backgroundColor: "rgba(255,255,255,0.3)" },
                      ]}
                    >
                      <Text
                        style={[ds.dayBadgeText, active && { color: "#fff" }]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Meal selector */}
          <Text style={[ds.fieldLabel, { marginBottom: 6 }]}>Meal</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.md }}
          >
            {MEAL_TIMES.map((m) => {
              const count = mealCount(m);
              const active = activeMeal === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setActiveMeal(m)}
                  style={[ds.mealTab, active && ds.mealTabActive]}
                >
                  <Text
                    style={[ds.mealTabText, active && ds.mealTabTextActive]}
                  >
                    {m}
                  </Text>
                  {count > 0 && (
                    <Text
                      style={[
                        ds.mealCount,
                        active && { color: Colors.primary },
                      ]}
                    >
                      {count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Meal totals */}
          <MealTotals items={currentItems} />

          {/* Food items */}
          {currentItems.length === 0 ? (
            <View style={ds.noItems}>
              <Icon
                name="food-off-outline"
                size={28}
                color={Colors.textMuted}
              />
              <Text style={ds.noItemsText}>
                No items for {activeMeal} on {activeDay}
              </Text>
              <Text style={ds.noItemsSub}>Tap below to add food items</Text>
            </View>
          ) : (
            currentItems.map((item, i) => (
              <FoodItemRow
                key={`${key}-${i}`}
                index={i}
                item={item}
                onChange={(field, val) => updateItem(i, field, val)}
                onRemove={() => removeItem(i)}
              />
            ))
          )}

          <TouchableOpacity style={ds.addItemBtn} onPress={addItem}>
            <Icon name="plus" size={16} color={Colors.success} />
            <Text style={ds.addItemBtnText}>Add Food Item</Text>
          </TouchableOpacity>
        </Card>

        {/* Save button */}
        <Button
          label={
            saveMutation.isPending
              ? "Saving..."
              : isEditMode
                ? "Update Plan"
                : "Create Plan"
          }
          onPress={handleSave}
          loading={saveMutation.isPending}
        />
      </ScrollView>

      {/* Template picker overlay */}
      <TemplatePicker
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={applyTemplate}
      />
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.purpleFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.purple + "30",
  },
  templateBtnText: {
    color: Colors.purple,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  saveBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
  section: {},
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  fieldWrap: { marginBottom: Spacing.md },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.successFaded,
    borderColor: Colors.success,
  },
  chipText: { color: Colors.textMuted, fontSize: Typography.xs },
  chipTextActive: { color: Colors.success, fontWeight: "700" },
  macroRow: { flexDirection: "row", gap: Spacing.sm },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  toggleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  toggleThumb: {
    position: "absolute",
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbOn: { left: undefined, right: 3, backgroundColor: "#fff" },
  plannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  plannerSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  saveTemplateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  saveTemplateBtnText: { color: Colors.textMuted, fontSize: Typography.xs },
  dayTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    alignItems: "center",
    minWidth: 52,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  dayTabTextActive: { color: "#fff", fontWeight: "700" },
  dayBadge: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    marginTop: 2,
  },
  dayBadgeText: { color: Colors.textMuted, fontSize: 9, fontWeight: "700" },
  mealTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    marginRight: Spacing.xs,
    alignItems: "center",
  },
  mealTabActive: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.primary + "60",
  },
  mealTabText: { color: Colors.textMuted, fontSize: Typography.xs },
  mealTabTextActive: { color: Colors.primary, fontWeight: "700" },
  mealCount: { color: Colors.textMuted, fontSize: 9, marginTop: 1 },
  noItems: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  noItemsText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  noItemsSub: { color: Colors.textMuted, fontSize: Typography.xs },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.success + "50",
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  addItemBtnText: {
    color: Colors.success,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
