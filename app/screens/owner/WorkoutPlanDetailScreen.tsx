// app/screens/owner/WorkoutPlanDetailScreen.tsx
// Read-only detail view for a workout plan.
// Route params: { plan: WorkoutPlan }
// planData shape (web/API standard): { Mon: Exercise[], Tue: Exercise[], ... }
// Features: meta card, stats bar, 7-day tab navigation with today indicator,
//           exercise list, archive action.

import { workoutsApi } from "@/api/endpoints";
import { Badge, Card, Header } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { WorkoutPlan } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = (typeof DAYS)[number];

const FULL_DAYS: Record<DayKey, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  weight?: string;
  rest?: string;
  notes?: string;
}

// planData as returned by the web API: flat day-keyed map
type PlanData = Record<string, Exercise[]>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayShort(): DayKey {
  // getDay(): 0=Sun,1=Mon,...,6=Sat  →  DAYS index: 0=Mon,...,6=Sun
  const idx = new Date().getDay();
  return DAYS[idx === 0 ? 6 : idx - 1];
}

function calcStats(planData: PlanData) {
  let exercises = 0;
  let activeDays = 0;
  for (const d of DAYS) {
    const len = planData[d]?.length ?? 0;
    exercises += len;
    if (len > 0) activeDays++;
  }
  return { exercises, activeDays };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WorkoutPlanDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const qc = useQueryClient();

  // Use route param as initial data; refresh in background via query
  const routePlan: WorkoutPlan = route.params?.plan;
  const planId: string = routePlan?.id;

  const { data: fetchedPlan } = useQuery<WorkoutPlan>({
    queryKey: ["ownerWorkout", planId],
    queryFn: () => workoutsApi.getById(planId) as Promise<WorkoutPlan>,
    enabled: !!planId,
    initialData: routePlan,
    staleTime: 30_000,
  });

  const plan = fetchedPlan ?? routePlan;
  const planData: PlanData = (plan as any)?.planData ?? {};
  const today = todayShort();
  const [selDay, setSelDay] = useState<DayKey>(today);

  const currentExercises: Exercise[] = planData[selDay] ?? [];
  const { exercises: totalEx, activeDays } = calcStats(planData);
  const difficulty: string = (plan as any)?.difficulty ?? "BEGINNER";
  const isTemplate = !!(plan as any)?.isTemplate;

  // ── Archive ────────────────────────────────────────────────────────────────

  const archiveMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({ type: "success", text1: "Plan archived" });
      navigation.goBack();
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmArchive = () =>
    showAlert(
      "Archive Plan",
      `Archive "${plan?.title}"? It will be hidden from members.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => archiveMutation.mutate(plan.id),
        },
      ],
    );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={plan?.title ?? "Workout Plan"}
        back
        right={
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => navigation.navigate("OwnerAddWorkoutPlan", { plan })}
          >
            <Icon name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meta card ──────────────────────────────────────────────────── */}
        <Card style={s.metaCard}>
          <View style={s.metaTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.metaTitle} numberOfLines={2}>
                {plan?.title ?? "Untitled Plan"}
              </Text>
              {plan?.goal ? (
                <Text style={s.metaGoal}>🎯 {plan.goal}</Text>
              ) : null}
            </View>
            <View style={s.metaBadges}>
              <Badge
                label={difficulty}
                variant={DIFF_VARIANT[difficulty] ?? "default"}
              />
              {plan?.isGlobal && (
                <View style={s.tagBlue}>
                  <Icon name="earth" size={11} color={Colors.info} />
                  <Text style={[s.tagTxt, { color: Colors.info }]}>All Members</Text>
                </View>
              )}
              {isTemplate && (
                <View style={s.tagPurple}>
                  <Icon name="bookmark-outline" size={11} color={Colors.purple} />
                  <Text style={[s.tagTxt, { color: Colors.purple }]}>Template</Text>
                </View>
              )}
            </View>
          </View>

          {plan?.description ? (
            <Text style={s.metaDesc}>{plan.description}</Text>
          ) : null}

          {/* Info grid — Gym / Assigned to / Created by */}
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={s.infoCellVal} numberOfLines={1}>
                {plan?.gym?.name ?? "—"}
              </Text>
              <Text style={s.infoCellLbl}>Gym</Text>
            </View>
            <View style={[s.infoCell, s.infoCellBorder]}>
              <Text style={s.infoCellVal} numberOfLines={1}>
                {plan?.assignedMember?.profile?.fullName ??
                  (plan?.isGlobal ? "All members" : "—")}
              </Text>
              <Text style={s.infoCellLbl}>Assigned to</Text>
            </View>
            <View style={[s.infoCell, s.infoCellBorder]}>
              <Text style={s.infoCellVal} numberOfLines={1}>
                {(plan as any)?.creator?.fullName ?? "—"}
              </Text>
              <Text style={s.infoCellLbl}>Created by</Text>
            </View>
          </View>
        </Card>

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <View style={s.statsBar}>
          {[
            { icon: "dumbbell", value: String(totalEx), label: "Exercises", color: Colors.primary },
            { icon: "calendar-check-outline", value: String(activeDays), label: "Active days", color: Colors.success },
            { icon: "calendar-week", value: String(plan?.durationWeeks ?? 1), label: "Weeks", color: Colors.info },
          ].map((st) => (
            <View key={st.label} style={s.statItem}>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Day tabs ───────────────────────────────────────────────────── */}
        <View style={s.dayTabsWrap}>
          {DAYS.map((day) => {
            const hasEx = (planData[day]?.length ?? 0) > 0;
            const isToday = day === today;
            const active = selDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[s.dayTab, active && s.dayTabActive]}
                onPress={() => setSelDay(day)}
              >
                <Text style={[s.dayTabTxt, active && s.dayTabTxtActive]}>
                  {day}
                </Text>
                {isToday && (
                  <View style={[s.todayDot, active && { backgroundColor: Colors.primary }]} />
                )}
                {hasEx && !active && (
                  <View style={s.exDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Exercise section ───────────────────────────────────────────── */}
        <View style={s.exerciseSection}>
          <View style={s.exerciseSectionHeader}>
            <View style={s.exHeaderLeft}>
              <Icon name="dumbbell" size={14} color={Colors.primary} />
              <Text style={s.exHeaderTitle}>
                {FULL_DAYS[selDay]}
                {selDay === today ? " (Today)" : ""}
              </Text>
            </View>
            <Text style={s.exHeaderCount}>
              {currentExercises.length} exercise
              {currentExercises.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {currentExercises.length === 0 ? (
            <View style={s.dayEmpty}>
              <Icon name="weather-sunny-off" size={28} color={Colors.textMuted} />
              <Text style={s.dayEmptyTxt}>
                Rest day — no exercises for {FULL_DAYS[selDay]}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 0 }}>
              {currentExercises.map((ex, i) => (
                <View
                  key={i}
                  style={[s.exRow, i === 0 && { borderTopWidth: 0 }]}
                >
                  <View style={s.exNum}>
                    <Text style={s.exNumTxt}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{ex.name}</Text>
                    {/* Chips row */}
                    {(ex.sets || ex.reps || ex.duration) ? (
                      <View style={s.exChips}>
                        {ex.sets && ex.reps ? (
                          <View style={s.exChip}>
                            <Text style={s.exChipTxt}>
                              {ex.sets} sets × {ex.reps} reps
                            </Text>
                          </View>
                        ) : null}
                        {ex.duration ? (
                          <View style={s.exChip}>
                            <Text style={s.exChipTxt}>{ex.duration}</Text>
                          </View>
                        ) : null}
                        {ex.weight ? (
                          <View style={s.exChip}>
                            <Text style={s.exChipTxt}>{ex.weight} kg</Text>
                          </View>
                        ) : null}
                        {ex.rest ? (
                          <View style={s.exChip}>
                            <Text style={s.exChipTxt}>Rest {ex.rest}s</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    {ex.notes ? (
                      <Text style={s.exNotes} numberOfLines={2}>
                        {ex.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Archive button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={confirmArchive}
          disabled={archiveMutation.isPending}
          style={[s.archiveBtn, archiveMutation.isPending && { opacity: 0.5 }]}
        >
          <Icon name="archive-arrow-down-outline" size={16} color={Colors.error} />
          <Text style={s.archiveBtnTxt}>Archive Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.primaryFaded,
  },
  editBtnTxt: { color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" },

  // Meta card
  metaCard: {},
  metaTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metaTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  metaGoal: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 3,
  },
  metaDesc: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  metaBadges: { gap: 5, alignItems: "flex-end" },
  tagBlue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.info + "15",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.info + "40",
  },
  tagPurple: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.purple + "15",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.purple + "40",
  },
  tagTxt: { color: Colors.textMuted, fontSize: 10 },

  // Info grid
  infoGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  infoCell: { flex: 1, alignItems: "center" },
  infoCellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  infoCellVal: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  infoCellLbl: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },

  // Stats bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: Typography.xl, fontWeight: "800" },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },

  // Day tabs
  dayTabsWrap: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 2,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: "center",
    position: "relative",
  },
  dayTabActive: { backgroundColor: Colors.surface },
  dayTabTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  dayTabTxtActive: { color: Colors.textPrimary, fontWeight: "700" },
  todayDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  exDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },

  // Exercise section
  exerciseSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  exerciseSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  exHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  exHeaderCount: { color: Colors.textMuted, fontSize: Typography.xs },
  dayEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: Spacing.sm,
  },
  dayEmptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },

  // Exercise row
  exRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  exNumTxt: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  exName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  exChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  exChip: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exChipTxt: { color: Colors.textMuted, fontSize: 11 },
  exNotes: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: "italic",
    marginTop: 4,
  },

  // Archive
  archiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.error + "30",
    backgroundColor: Colors.error + "10",
  },
  archiveBtnTxt: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
});
