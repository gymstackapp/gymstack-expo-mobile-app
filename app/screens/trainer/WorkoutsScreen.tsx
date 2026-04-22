// app/screens/trainer/WorkoutsScreen.tsx
// Trainer workout plan manager: list → create/edit (modal) → per-day exercises.
// planData format: { Mon: Exercise[], Tue: Exercise[], ... }

import { trainerMembersApi, trainerWorkoutsApi } from "@/api/endpoints";
import { Avatar, Button, Card, EmptyState, Header, Input, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

const DIFF_COLOR: Record<string, { fg: string; bg: string }> = {
  BEGINNER:     { fg: "#4ade80", bg: "#4ade8015" },
  INTERMEDIATE: { fg: "#facc15", bg: "#facc1515" },
  ADVANCED:     { fg: "#f87171", bg: "#f8717115" },
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  duration: string;
  notes: string;
}

type WeekPlan = Partial<Record<Day, Exercise[]>>;

interface WorkoutPlan {
  id: string;
  title: string;
  goal: string | null;
  difficulty: string;
  isGlobal: boolean;
  planData: WeekPlan;
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null;
  gym: { name: string };
  createdAt: string;
}

function blankExercise(): Exercise {
  return { name: "", sets: "", reps: "", duration: "", notes: "" };
}

// ── Exercise row in builder ────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  idx,
  onChange,
  onRemove,
}: {
  ex: Exercise;
  idx: number;
  onChange: (field: keyof Exercise, val: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={er.wrap}>
      <View style={er.headerRow}>
        <View style={er.badge}>
          <Text style={er.badgeTxt}>{idx + 1}</Text>
        </View>
        <Input
          value={ex.name}
          onChangeText={(v) => onChange("name", v)}
          placeholder="Exercise name (e.g. Bench Press)"
          style={er.nameInput}
        />
        <TouchableOpacity onPress={onRemove} style={er.removeBtn}>
          <Icon name="close-circle-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <View style={er.fieldsRow}>
        {(["sets", "reps", "duration"] as (keyof Exercise)[]).map((f) => (
          <View key={f} style={er.field}>
            <Input
              label={f === "duration" ? "Time" : f.charAt(0).toUpperCase() + f.slice(1)}
              value={ex[f]}
              onChangeText={(v) => onChange(f, v)}
              keyboardType={f !== "duration" ? "numeric" : "default"}
              placeholder={f === "duration" ? "30s" : "3"}
            />
          </View>
        ))}
      </View>
      <Input
        label="Notes"
        value={ex.notes}
        onChangeText={(v) => onChange("notes", v)}
        placeholder="Optional notes…"
      />
    </View>
  );
}

const er = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  badge: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeTxt: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  nameInput: { flex: 1 },
  removeBtn: { paddingTop: 2, flexShrink: 0 },
  fieldsRow: { flexDirection: "row", gap: Spacing.xs },
  field: { flex: 1 },
});

// ── Plan builder modal ─────────────────────────────────────────────────────────

function PlanModal({
  visible,
  editing,
  members,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  editing: WorkoutPlan | null;
  members: any[];
  onClose: () => void;
  onSave: (payload: object) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [difficulty, setDifficulty] = useState<string>("BEGINNER");
  const [memberId, setMemberId] = useState("");
  const [freeForAll, setFreeForAll] = useState(false);
  const [activeDay, setActiveDay] = useState<Day>("Mon");
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setTitle(editing.title);
        setGoal(editing.goal ?? "");
        setDifficulty(editing.difficulty);
        setMemberId(editing.assignedMember?.id ?? "");
        setFreeForAll(editing.isGlobal);
        setWeekPlan(editing.planData ?? {});
      } else {
        setTitle("");
        setGoal("");
        setDifficulty("BEGINNER");
        setMemberId("");
        setFreeForAll(false);
        setWeekPlan({});
      }
      setActiveDay("Mon");
    }
  }, [visible, editing]);

  const exercises: Exercise[] = weekPlan[activeDay] ?? [];

  const addExercise = () =>
    setWeekPlan((p) => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), blankExercise()] }));

  const removeExercise = (idx: number) =>
    setWeekPlan((p) => ({ ...p, [activeDay]: (p[activeDay] ?? []).filter((_, i) => i !== idx) }));

  const updateExercise = (idx: number, field: keyof Exercise, val: string) =>
    setWeekPlan((p) => {
      const arr = [...(p[activeDay] ?? [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...p, [activeDay]: arr };
    });

  const handleSave = () => {
    if (!title.trim()) {
      Toast.show({ type: "error", text1: "Plan title is required" });
      return;
    }
    onSave({
      title: title.trim(),
      goal: goal.trim() || null,
      difficulty,
      isGlobal: freeForAll,
      assignedToMemberId: !freeForAll && memberId ? memberId : null,
      planData: weekPlan,
      durationWeeks: 1,
    });
  };

  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* Header */}
        <View style={pm.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={pm.title}>{editing ? "Edit Workout Plan" : "New Workout Plan"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[pm.saveBtn, isSaving && { opacity: 0.5 }]}>
              {isSaving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60, gap: Spacing.lg }}
        >
          {/* Basic info */}
          <Card>
            <Input
              label="Plan Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 4-Week Fat Loss"
              leftIcon="dumbbell"
            />
            <View style={{ height: Spacing.sm }} />
            <Input
              label="Goal"
              value={goal}
              onChangeText={setGoal}
              placeholder="e.g. Weight loss, muscle gain"
              leftIcon="target"
            />
            {/* Difficulty */}
            <Text style={pm.label}>Difficulty</Text>
            <View style={pm.diffRow}>
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                const c = DIFF_COLOR[d];
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={[pm.diffChip, active && { backgroundColor: c.bg, borderColor: c.fg }]}
                  >
                    <Text style={[pm.diffChipTxt, active && { color: c.fg }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Free for all toggle */}
          <Card>
            <View style={pm.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={pm.toggleTitle}>Available to all members</Text>
                <Text style={pm.toggleSub}>Share this plan with your entire gym</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setFreeForAll((v) => !v); if (!freeForAll) setMemberId(""); }}
                style={[pm.toggle, freeForAll && { backgroundColor: Colors.primary }]}
                activeOpacity={0.8}
              >
                <View style={[pm.toggleThumb, freeForAll && pm.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            {!freeForAll && (
              <>
                <Text style={[pm.label, { marginTop: Spacing.md }]}>Assign to Member</Text>
                <TouchableOpacity
                  style={pm.memberSelector}
                  onPress={() => setShowMembers(true)}
                >
                  {selectedMember ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                      <Avatar name={selectedMember.profile?.fullName ?? ""} url={selectedMember.profile?.avatarUrl} size={28} />
                      <Text style={pm.memberSelectorTxt}>{selectedMember.profile?.fullName}</Text>
                    </View>
                  ) : (
                    <Text style={pm.memberSelectorPlaceholder}>— No specific member —</Text>
                  )}
                  <Icon name="chevron-down" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Day tabs */}
          <View>
            <Text style={pm.label}>Weekly Schedule</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, paddingBottom: Spacing.sm }}>
              {DAYS.map((day) => {
                const count = (weekPlan[day] ?? []).length;
                const active = day === activeDay;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setActiveDay(day)}
                    style={[pm.dayTab, active && pm.dayTabActive]}
                  >
                    <Text style={[pm.dayTabTxt, active && pm.dayTabTxtActive]}>{day}</Text>
                    {count > 0 && (
                      <View style={[pm.dayBadge, active && { backgroundColor: Colors.primary }]}>
                        <Text style={pm.dayBadgeTxt}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {exercises.length === 0 ? (
              <View style={pm.emptyDay}>
                <Icon name="dumbbell" size={28} color={Colors.border} />
                <Text style={pm.emptyDayTxt}>No exercises for {activeDay} — rest day</Text>
              </View>
            ) : (
              <View style={{ gap: Spacing.md }}>
                {exercises.map((ex, idx) => (
                  <ExerciseRow
                    key={idx}
                    ex={ex}
                    idx={idx}
                    onChange={(f, v) => updateExercise(idx, f, v)}
                    onRemove={() => removeExercise(idx)}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity style={pm.addExBtn} onPress={addExercise}>
              <Icon name="plus" size={14} color={Colors.primary} />
              <Text style={pm.addExTxt}>Add Exercise for {activeDay}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Member picker sheet */}
        <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
          <View style={pm.pickerOverlay}>
            <View style={pm.pickerSheet}>
              <View style={pm.pickerHeader}>
                <Text style={pm.pickerTitle}>Select Member</Text>
                <TouchableOpacity onPress={() => setShowMembers(false)}>
                  <Icon name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={pm.pickerRow}
                onPress={() => { setMemberId(""); setShowMembers(false); }}
              >
                <Text style={pm.pickerRowTxt}>— No specific member —</Text>
                {!memberId && <Icon name="check" size={16} color={Colors.primary} />}
              </TouchableOpacity>
              <FlatList
                data={members}
                keyExtractor={(m) => m.id}
                renderItem={({ item: m }) => (
                  <TouchableOpacity
                    style={pm.pickerRow}
                    onPress={() => { setMemberId(m.id); setShowMembers(false); }}
                  >
                    <Avatar name={m.profile?.fullName ?? ""} url={m.profile?.avatarUrl} size={32} />
                    <Text style={[pm.pickerRowTxt, { flex: 1 }]}>{m.profile?.fullName}</Text>
                    {memberId === m.id && <Icon name="check" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const pm = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  saveBtn: { color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" },
  label: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600", marginBottom: Spacing.sm },
  diffRow: { flexDirection: "row", gap: Spacing.sm },
  diffChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  diffChipTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  toggleTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  toggleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  memberSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberSelectorTxt: { color: Colors.textPrimary, fontSize: Typography.sm },
  memberSelectorPlaceholder: { color: Colors.textMuted, fontSize: Typography.sm },
  dayTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  dayTabActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
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
  emptyDay: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyDayTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: "stretch",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  addExTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "600" },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerRowTxt: { color: Colors.textPrimary, fontSize: Typography.sm },
});

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onDelete,
  isDeleting,
}: {
  plan: WorkoutPlan;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const dc = DIFF_COLOR[plan.difficulty] ?? DIFF_COLOR.BEGINNER;
  const daysWithData = DAYS.filter((d) => (plan.planData?.[d]?.length ?? 0) > 0);
  const totalEx = DAYS.reduce((s, d) => s + (plan.planData?.[d]?.length ?? 0), 0);

  return (
    <Card style={{ opacity: isDeleting ? 0.5 : 1 }}>
      <View style={pc.top}>
        <View style={[pc.diffBadge, { backgroundColor: dc.bg }]}>
          <Text style={[pc.diffTxt, { color: dc.fg }]}>{plan.difficulty}</Text>
        </View>
        {plan.isGlobal && (
          <View style={pc.globalBadge}>
            <Text style={pc.globalTxt}>All Members</Text>
          </View>
        )}
      </View>

      <Text style={pc.name}>{plan.title}</Text>
      {plan.goal && (
        <Text style={pc.goal}>🎯 {plan.goal}</Text>
      )}

      {daysWithData.length > 0 && (
        <View style={pc.daysRow}>
          {daysWithData.map((d) => (
            <View key={d} style={pc.dayChip}>
              <Text style={pc.dayChipTxt}>{d} ({plan.planData[d]!.length})</Text>
            </View>
          ))}
        </View>
      )}

      <View style={pc.meta}>
        <Text style={pc.metaTxt}>{plan.gym?.name}</Text>
        {plan.assignedMember ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Avatar name={plan.assignedMember.profile.fullName} url={plan.assignedMember.profile.avatarUrl} size={18} />
            <Text style={pc.metaTxt}>{plan.assignedMember.profile.fullName}</Text>
          </View>
        ) : (
          <Text style={[pc.metaTxt, { color: Colors.textMuted + "80" }]}>Unassigned</Text>
        )}
      </View>

      <View style={pc.actions}>
        <TouchableOpacity style={pc.actionBtn} onPress={onEdit}>
          <Icon name="pencil-outline" size={14} color={Colors.primary} />
          <Text style={[pc.actionTxt, { color: Colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.actionBtn} onPress={onDelete} disabled={isDeleting}>
          <Icon name={isDeleting ? "loading" : "archive-outline"} size={14} color={Colors.error} />
          <Text style={[pc.actionTxt, { color: Colors.error }]}>{isDeleting ? "Archiving…" : "Archive"}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const pc = StyleSheet.create({
  top: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.sm },
  diffBadge: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  diffTxt: { fontSize: 10, fontWeight: "700" },
  globalBadge: { backgroundColor: "#a78bfa20", borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  globalTxt: { color: "#a78bfa", fontSize: 10, fontWeight: "700" },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700", marginBottom: 3 },
  goal: { color: Colors.primary + "BB", fontSize: Typography.xs, marginBottom: Spacing.sm },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: Spacing.sm },
  dayChip: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  dayChipTxt: { color: Colors.textMuted, fontSize: 10 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.xs },
  metaTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  actions: { flexDirection: "row", gap: 0, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6 },
  actionTxt: { fontSize: Typography.xs, fontWeight: "600" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function WorkoutsScreen() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WorkoutPlan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: plans = [], isLoading, refetch, isRefetching } = useQuery<WorkoutPlan[]>({
    queryKey: ["trainerWorkouts"],
    queryFn: () => trainerWorkoutsApi.list() as Promise<WorkoutPlan[]>,
    staleTime: 60_000,
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["trainerMembers"],
    queryFn: () => trainerMembersApi.list() as Promise<any[]>,
    staleTime: 300_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => trainerWorkoutsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerWorkouts"] });
      setModalVisible(false);
      setEditing(null);
      Toast.show({ type: "success", text1: "Workout plan created!" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to create plan" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => trainerWorkoutsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerWorkouts"] });
      setModalVisible(false);
      setEditing(null);
      Toast.show({ type: "success", text1: "Plan updated!" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to update plan" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainerWorkoutsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerWorkouts"] });
      Toast.show({ type: "success", text1: "Plan archived" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to archive" }),
    onSettled: () => setDeletingId(null),
  });

  const handleSave = (payload: object) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          title="Workout Plans"
          subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
          right={
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => { setEditing(null); setModalVisible(true); }}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={3} itemHeight={140} gap={Spacing.md} />
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No workout plans yet"
          subtitle="Create weekly exercise schedules for your members"
          action={
            <TouchableOpacity
              style={s.emptyAction}
              onPress={() => { setEditing(null); setModalVisible(true); }}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={s.emptyActionTxt}>Create Plan</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={plans}
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
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onEdit={() => { setEditing(item); setModalVisible(true); }}
              onDelete={() => handleDelete(item.id)}
              isDeleting={deletingId === item.id}
            />
          )}
        />
      )}

      <PlanModal
        visible={modalVisible}
        editing={editing}
        members={members}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
        isSaving={isSaving}
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
