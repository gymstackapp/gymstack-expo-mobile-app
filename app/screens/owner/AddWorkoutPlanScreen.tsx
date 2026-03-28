// mobile/src/screens/owner/AddWorkoutPlanScreen.tsx
// Full-screen dedicated screen for creating / editing a workout plan.
// Replaces the modal that was inside WorkoutsScreen.
// Receives optional `planId` route param for edit mode.

import { gymsApi, membersApi, workoutsApi } from "@/api/endpoints";
import { Button, Card, Header, Input } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
    Gym,
    GymMemberListItem,
    MembersListResponse,
    WorkoutPlan,
} from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const DIFF_COLORS: Record<Difficulty, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.warning,
  ADVANCED: Colors.error,
};

const DIFF_BG: Record<Difficulty, string> = {
  BEGINNER: Colors.successFaded,
  INTERMEDIATE: Colors.warningFaded,
  ADVANCED: Colors.errorFaded,
};

const COMMON_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Strength",
  "Endurance",
  "Flexibility",
  "Fat Burn",
  "Toning",
  "Athletic Performance",
];

// ── Form type ─────────────────────────────────────────────────────────────────

interface WorkoutForm {
  gymId: string;
  title: string;
  goal: string;
  description: string;
  difficulty: Difficulty;
  durationWeeks: string;
  isGlobal: boolean; // visible to all members
  assignedToMemberId: string; // "" = no assignment
  planData: WeekData; // per-week per-day exercises
}

// planData structure: { "Week 1": { "Monday": ExerciseItem[], ... }, ... }
interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  weight: string; // kg or "bodyweight"
  duration: string; // minutes (for cardio)
  notes: string;
}

type DayExercises = Record<string, ExerciseItem[]>;
type WeekData = Record<string, DayExercises>;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyExercise = (): ExerciseItem => ({
  name: "",
  sets: "",
  reps: "",
  weight: "",
  duration: "",
  notes: "",
});

function blankForm(defaultGymId = ""): WorkoutForm {
  return {
    gymId: defaultGymId,
    title: "",
    goal: "",
    description: "",
    difficulty: "BEGINNER",
    durationWeeks: "4",
    isGlobal: false,
    assignedToMemberId: "",
    planData: {},
  };
}

// ── Exercise row component ────────────────────────────────────────────────────

function ExerciseRow({
  index,
  item,
  onChange,
  onRemove,
}: {
  index: number;
  item: ExerciseItem;
  onChange: (field: keyof ExerciseItem, value: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View style={er.container}>
      <TouchableOpacity
        style={er.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={er.headerLeft}>
          <View style={er.indexBadge}>
            <Text style={er.indexText}>{index + 1}</Text>
          </View>
          <Text style={er.exerciseName} numberOfLines={1}>
            {item.name || "New exercise"}
          </Text>
        </View>
        <View style={er.headerRight}>
          {item.sets && item.reps ? (
            <Text style={er.setsSummary}>
              {item.sets}×{item.reps}
            </Text>
          ) : null}
          <Icon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.textMuted}
          />
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={er.body}>
          <Input
            label="Exercise Name *"
            value={item.name}
            onChangeText={(v) => onChange("name", v)}
            placeholder="e.g. Barbell Squat"
            leftIcon="dumbbell"
          />
          <View style={er.row3}>
            <View style={{ flex: 1 }}>
              <Input
                label="Sets"
                value={item.sets}
                onChangeText={(v) => onChange("sets", v)}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Reps"
                value={item.reps}
                onChangeText={(v) => onChange("reps", v)}
                keyboardType="numeric"
                placeholder="10"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={item.weight}
                onChangeText={(v) => onChange("weight", v)}
                placeholder="BW"
              />
            </View>
          </View>
          <View style={er.row2}>
            <View style={{ flex: 1 }}>
              <Input
                label="Duration (min)"
                value={item.duration}
                onChangeText={(v) => onChange("duration", v)}
                keyboardType="numeric"
                placeholder="—"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Notes"
                value={item.notes}
                onChangeText={(v) => onChange("notes", v)}
                placeholder="e.g. slow tempo"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const er = StyleSheet.create({
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
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
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
  indexText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 0,
  },
  setsSummary: { color: Colors.textMuted, fontSize: Typography.xs },
  body: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  row3: { flexDirection: "row", gap: Spacing.sm },
  row2: { flexDirection: "row", gap: Spacing.sm },
});

// ── Week/Day selector ─────────────────────────────────────────────────────────

function WeekDaySelector({
  weeks,
  activeWeek,
  activeDay,
  onSelectWeek,
  onSelectDay,
  onAddWeek,
  exerciseCounts,
}: {
  weeks: string[];
  activeWeek: string;
  activeDay: string;
  onSelectWeek: (w: string) => void;
  onSelectDay: (d: string) => void;
  onAddWeek: () => void;
  exerciseCounts: Record<string, Record<string, number>>;
}) {
  return (
    <View style={wd.container}>
      {/* Week tabs + add button */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={wd.weekScroll}
      >
        {weeks.map((w) => {
          const total = DAYS.reduce(
            (s, d) => s + (exerciseCounts[w]?.[d] ?? 0),
            0,
          );
          return (
            <TouchableOpacity
              key={w}
              onPress={() => onSelectWeek(w)}
              style={[wd.weekTab, activeWeek === w && wd.weekTabActive]}
            >
              <Text
                style={[
                  wd.weekTabText,
                  activeWeek === w && wd.weekTabTextActive,
                ]}
              >
                {w}
              </Text>
              {total > 0 && (
                <View style={wd.countBadge}>
                  <Text style={wd.countText}>{total}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={onAddWeek} style={wd.addWeekBtn}>
          <Icon name="plus" size={14} color={Colors.primary} />
          <Text style={wd.addWeekText}>Week</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={wd.dayScroll}
      >
        {DAYS.map((d) => {
          const count = exerciseCounts[activeWeek]?.[d] ?? 0;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => onSelectDay(d)}
              style={[wd.dayTab, activeDay === d && wd.dayTabActive]}
            >
              <Text
                style={[wd.dayTabText, activeDay === d && wd.dayTabTextActive]}
              >
                {d.slice(0, 3)}
              </Text>
              {count > 0 && (
                <Text
                  style={[wd.dayCount, activeDay === d && { color: "#fff" }]}
                >
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wd = StyleSheet.create({
  container: { gap: 6 },
  weekScroll: { flexGrow: 0 },
  weekTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  weekTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekTabText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  weekTabTextActive: { color: "#fff", fontWeight: "700" },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  addWeekBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.primary + "60",
    marginRight: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addWeekText: { color: Colors.primary, fontSize: Typography.xs },
  dayScroll: { flexGrow: 0 },
  dayTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    marginRight: Spacing.xs,
    alignItems: "center",
    minWidth: 44,
  },
  dayTabActive: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.primary + "60",
  },
  dayTabText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  dayTabTextActive: { color: Colors.primary, fontWeight: "700" },
  dayCount: { color: Colors.textMuted, fontSize: 9, marginTop: 1 },
});

// ── Summary stats bar ─────────────────────────────────────────────────────────

function PlanSummary({
  planData,
  durationWeeks,
}: {
  planData: WeekData;
  durationWeeks: string;
}) {
  const totalExercises = Object.values(planData).reduce(
    (wSum, days) =>
      wSum + Object.values(days).reduce((dSum, exs) => dSum + exs.length, 0),
    0,
  );
  const activeDays = Object.values(planData).reduce(
    (wSum, days) =>
      wSum + Object.keys(days).filter((d) => (days[d]?.length ?? 0) > 0).length,
    0,
  );
  const weeks = Object.keys(planData).length;

  return (
    <View style={ps.container}>
      {[
        { label: "Weeks", value: durationWeeks || "—", color: Colors.primary },
        { label: "Plan weeks", value: String(weeks), color: Colors.info },
        {
          label: "Active days",
          value: String(activeDays),
          color: Colors.success,
        },
        {
          label: "Exercises",
          value: String(totalExercises),
          color: Colors.purple,
        },
      ].map((s) => (
        <View key={s.label} style={ps.stat}>
          <Text style={[ps.value, { color: s.color }]}>{s.value}</Text>
          <Text style={ps.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const ps = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  stat: { flex: 1, alignItems: "center" },
  value: { fontSize: Typography.xl, fontWeight: "800" },
  label: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AddWorkoutPlanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();

  const planId = (route.params as any)?.planId as string | undefined;
  const isEditMode = !!planId;

  // Active selection
  const [activeWeek, setActiveWeek] = useState("Week 1");
  const [activeDay, setActiveDay] = useState("Monday");

  // Form state
  const [form, setForm] = useState<WorkoutForm>(blankForm());
  const [members, setMembers] = useState<GymMemberListItem[]>([]);

  const set = (k: keyof WorkoutForm, v: unknown) =>
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

  // Load existing plan for edit mode
  const { isLoading: loadingPlan } = useQuery<WorkoutPlan>({
    queryKey: ["ownerWorkout", planId],
    queryFn: () => workoutsApi.list({}) as any, // we will populate from list
    enabled: false, // we load via list below
  });

  // If edit mode, find the plan from the list
  const { data: allPlans = [] } = useQuery<WorkoutPlan[]>({
    queryKey: ["ownerWorkouts", ""],
    queryFn: () => workoutsApi.list({}) as Promise<WorkoutPlan[]>,
    enabled: isEditMode,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isEditMode && allPlans.length > 0) {
      const plan = allPlans.find((p) => p.id === planId);
      if (plan) {
        const data = (plan as any).planData ?? {};
        const firstWeek = Object.keys(data)[0] ?? "Week 1";
        setForm({
          gymId: (plan as any).gymId ?? gyms[0]?.id ?? "",
          title: plan.title ?? "",
          goal: plan.goal ?? "",
          description: plan.description ?? "",
          difficulty: (plan.difficulty as Difficulty) ?? "BEGINNER",
          durationWeeks: String(plan.durationWeeks ?? 4),
          isGlobal: plan.isGlobal,
          assignedToMemberId: plan.assignedMember?.id ?? "", // GymMember id if assigned
          planData: data,
        });
        setActiveWeek(firstWeek);
      }
    }
  }, [isEditMode, allPlans, planId]);

  // Load members when gym changes
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

  const weeks =
    Object.keys(form.planData).length > 0
      ? Object.keys(form.planData)
      : ["Week 1"];

  // Ensure activeWeek exists
  useEffect(() => {
    if (!weeks.includes(activeWeek)) setActiveWeek(weeks[0] ?? "Week 1");
  }, [weeks]);

  const addWeek = () => {
    const nextNum = Object.keys(form.planData).length + 1;
    const key = `Week ${nextNum}`;
    set("planData", { ...form.planData, [key]: {} });
    setActiveWeek(key);
  };

  const currentExercises: ExerciseItem[] =
    form.planData[activeWeek]?.[activeDay] ?? [];

  const setExercises = (exs: ExerciseItem[]) => {
    set("planData", {
      ...form.planData,
      [activeWeek]: {
        ...(form.planData[activeWeek] ?? {}),
        [activeDay]: exs,
      },
    });
  };

  const addExercise = () =>
    setExercises([...currentExercises, emptyExercise()]);
  const removeExercise = (i: number) =>
    setExercises(currentExercises.filter((_, idx) => idx !== i));
  const updateExercise = (
    i: number,
    field: keyof ExerciseItem,
    val: string,
  ) => {
    const updated = [...currentExercises];
    updated[i] = { ...updated[i], [field]: val };
    setExercises(updated);
  };

  // Exercise count map for badges
  const exerciseCounts: Record<string, Record<string, number>> = {};
  for (const [week, days] of Object.entries(form.planData)) {
    exerciseCounts[week] = {};
    for (const [day, exs] of Object.entries(days as DayExercises)) {
      exerciseCounts[week][day] = exs.length;
    }
  }

  // ── Save mutation ─────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        gymId: form.gymId || gyms[0]?.id,
        title: form.title.trim(),
        goal: form.goal || null,
        description: form.description || null,
        difficulty: form.difficulty,
        durationWeeks: parseInt(form.durationWeeks) || 4,
        isGlobal: form.isGlobal,
        assignedToMemberId:
          !form.isGlobal && form.assignedToMemberId
            ? form.assignedToMemberId
            : null,
        planData: form.planData,
      };
      return isEditMode
        ? workoutsApi.update(planId!, payload)
        : workoutsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({
        type: "success",
        text1: isEditMode ? "Plan updated! ✅" : "Workout plan created! 💪",
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
    if (!form.gymId && gyms.length === 0) {
      Toast.show({ type: "error", text1: "Please select a gym" });
      return;
    }
    saveMutation.mutate();
  };

  const handleDiscard = () => {
    showAlert(
      "Discard Changes",
      "Are you sure you want to discard this plan?",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Header
          title={isEditMode ? "Edit Plan" : "New Workout Plan"}
          back
          onBack={handleDiscard}
          right={
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              disabled={saveMutation.isPending}
            >
              <Text style={s.saveBtnText}>
                {saveMutation.isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Update"
                    : "Create"}
              </Text>
            </TouchableOpacity>
          }
        />

        {/* ── Section 1: Plan Details ────────────────────────────── */}
        <Card style={s.section}>
          <Text style={s.sectionTitle}>Plan Details</Text>

          {/* Gym selector */}
          {gyms.length > 1 && (
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Gym *</Text>
              <View style={s.chipRow}>
                {gyms.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => set("gymId", g.id)}
                    style={[s.chip, form.gymId === g.id && s.chipActive]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        form.gymId === g.id && s.chipTextActive,
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
            placeholder="e.g. 4-Week Fat Loss Programme"
            leftIcon="clipboard-list-outline"
          />

          {/* Goal quick picks */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Goal</Text>
            <View style={s.chipRow}>
              {COMMON_GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => set("goal", form.goal === g ? "" : g)}
                  style={[s.chip, form.goal === g && s.chipActive]}
                >
                  <Text
                    style={[s.chipText, form.goal === g && s.chipTextActive]}
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

          <Input
            label="Description"
            value={form.description}
            onChangeText={(v) => set("description", v)}
            placeholder="Brief description of this plan..."
            multiline
            numberOfLines={2}
          />

          {/* Difficulty */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Difficulty</Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {DIFFICULTIES.map((d) => {
                const active = form.difficulty === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => set("difficulty", d)}
                    style={[
                      s.diffBtn,
                      active && {
                        backgroundColor: DIFF_BG[d],
                        borderColor: DIFF_COLORS[d] + "60",
                      },
                    ]}
                  >
                    <Icon
                      name={
                        d === "BEGINNER"
                          ? "speedometer-slow"
                          : d === "INTERMEDIATE"
                            ? "speedometer-medium"
                            : "speedometer"
                      }
                      size={16}
                      color={active ? DIFF_COLORS[d] : Colors.textMuted}
                    />
                    <Text
                      style={[
                        s.diffText,
                        active && { color: DIFF_COLORS[d], fontWeight: "700" },
                      ]}
                    >
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Duration (weeks)"
            value={form.durationWeeks}
            onChangeText={(v) => set("durationWeeks", v)}
            keyboardType="numeric"
            leftIcon="calendar-range"
          />
        </Card>

        {/* ── Section 2: Visibility & Assignment ────────────────── */}
        <Card style={s.section}>
          <Text style={s.sectionTitle}>Visibility & Assignment</Text>

          {/* Global toggle */}
          <TouchableOpacity
            style={s.toggleRow}
            onPress={() => {
              set("isGlobal", !form.isGlobal);
              if (!form.isGlobal) set("assignedToMemberId", "");
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Visible to All Members</Text>
              <Text style={s.toggleSub}>
                All gym members can access this plan
              </Text>
            </View>
            <View style={[s.toggle, form.isGlobal && s.toggleOn]}>
              <View style={[s.toggleThumb, form.isGlobal && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {/* Member assignment — hidden when isGlobal */}
          {!form.isGlobal && (
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Assign to Member (optional)</Text>
              <View style={s.memberList}>
                <TouchableOpacity
                  onPress={() => set("assignedToMemberId", "")}
                  style={[
                    s.memberChip,
                    !form.assignedToMemberId && s.memberChipActive,
                  ]}
                >
                  <Text
                    style={[
                      s.memberChipText,
                      !form.assignedToMemberId && s.memberChipTextActive,
                    ]}
                  >
                    Unassigned
                  </Text>
                </TouchableOpacity>
                {members.slice(0, 12).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() =>
                      set(
                        "assignedToMemberId",
                        form.assignedToMemberId === m.id ? "" : m.id,
                      )
                    }
                    style={[
                      s.memberChip,
                      form.assignedToMemberId === m.id && s.memberChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.memberChipText,
                        form.assignedToMemberId === m.id &&
                          s.memberChipTextActive,
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

        {/* ── Section 3: Exercise Planner ────────────────────────── */}
        <Card style={s.section}>
          <View style={s.plannerHeader}>
            <View>
              <Text style={s.sectionTitle}>Exercise Planner</Text>
              <Text style={s.plannerSub}>
                {activeWeek} · {activeDay} · {currentExercises.length} exercise
                {currentExercises.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Plan summary */}
          <PlanSummary
            planData={form.planData}
            durationWeeks={form.durationWeeks}
          />

          <View style={{ height: Spacing.md }} />

          {/* Week + Day selector */}
          <WeekDaySelector
            weeks={weeks}
            activeWeek={activeWeek}
            activeDay={activeDay}
            onSelectWeek={setActiveWeek}
            onSelectDay={setActiveDay}
            onAddWeek={addWeek}
            exerciseCounts={exerciseCounts}
          />

          <View style={{ height: Spacing.md }} />

          {/* Exercises for active week/day */}
          {currentExercises.length === 0 ? (
            <View style={s.noExercises}>
              <Icon name="dumbbell" size={28} color={Colors.textMuted} />
              <Text style={s.noExercisesText}>
                No exercises for {activeDay}
              </Text>
              <Text style={s.noExercisesSub}>Tap the button below to add</Text>
            </View>
          ) : (
            currentExercises.map((item, i) => (
              <ExerciseRow
                key={`${activeWeek}-${activeDay}-${i}`}
                index={i}
                item={item}
                onChange={(field, val) => updateExercise(i, field, val)}
                onRemove={() => removeExercise(i)}
              />
            ))
          )}

          {/* Add exercise button */}
          <TouchableOpacity style={s.addExerciseBtn} onPress={addExercise}>
            <Icon name="plus" size={16} color={Colors.primary} />
            <Text style={s.addExerciseBtnText}>Add Exercise</Text>
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
          style={s.bottomSaveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  saveBtn: {
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textMuted, fontSize: Typography.xs },
  chipTextActive: { color: Colors.primary, fontWeight: "700" },
  diffBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diffText: { color: Colors.textMuted, fontSize: Typography.xs },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
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
  toggleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleThumb: {
    position: "absolute",
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbOn: { left: undefined, right: 3, backgroundColor: "#fff" },
  memberList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  memberChipText: { color: Colors.textMuted, fontSize: Typography.xs },
  memberChipTextActive: { color: Colors.primary, fontWeight: "700" },
  plannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  plannerSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  noExercises: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  noExercisesText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  noExercisesSub: { color: Colors.textMuted, fontSize: Typography.xs },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary + "50",
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  addExerciseBtnText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  bottomSaveBtn: {},
});
