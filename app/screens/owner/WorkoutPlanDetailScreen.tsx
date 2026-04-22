// app/screens/owner/WorkoutPlanDetailScreen.tsx
// Read-only view of a workout plan.
// Route params: { plan: WorkoutPlan }
// Header: back + title + edit button
// Shows: metadata, stats, week/day tab navigation, exercise list

import { Badge, Card, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { WorkoutPlan } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  weight?: string;
  duration?: string;
  rest?: string;
  notes?: string;
}
type WeekData = Record<string, Exercise[]>;
type PlanData = Record<string, WeekData>;

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

const DIFF_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcStats(planData: PlanData) {
  let exercises = 0;
  let activeDays = 0;
  for (const days of Object.values(planData)) {
    for (const exs of Object.values(days)) {
      exercises += exs?.length ?? 0;
      if ((exs?.length ?? 0) > 0) activeDays += 1;
    }
  }
  return { exercises, activeDays };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WorkoutPlanDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const plan: WorkoutPlan = route.params?.plan;

  const planData: PlanData = (plan as any)?.planData ?? {};
  const weeks = Object.keys(planData);
  const hasData = weeks.length > 0;

  const [selWeek, setSelWeek] = useState<string>(weeks[0] ?? "Week 1");
  const [selDay, setSelDay] = useState<Day>("Monday");

  const currentExercises: Exercise[] =
    planData[selWeek]?.[selDay] ?? [];

  const { exercises: totalEx, activeDays } = calcStats(planData);

  const difficulty = (plan as any)?.difficulty ?? "BEGINNER";
  const isTemplate = !!(plan as any)?.isTemplate;

  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={plan?.title ?? "Workout Plan"}
        back
        right={
          <TouchableOpacity
            style={s.editBtn}
            onPress={() =>
              navigation.navigate("OwnerAddWorkoutPlan", { plan })
            }
          >
            <Icon name="pencil-outline" size={16} color={Colors.primary} />
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meta card ──────────────────────────────────────────────── */}
        <Card style={s.metaCard}>
          <View style={s.metaTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.metaTitle} numberOfLines={2}>
                {plan?.title ?? "Untitled Plan"}
              </Text>
              {plan?.goal ? (
                <Text style={s.metaGoal}>{plan.goal}</Text>
              ) : null}
            </View>
            <Badge
              label={DIFF_LABEL[difficulty] ?? difficulty}
              variant={DIFF_VARIANT[difficulty] ?? "default"}
            />
          </View>

          {plan?.description ? (
            <Text style={s.metaDesc}>{plan.description}</Text>
          ) : null}

          <View style={s.metaTags}>
            {plan?.gym?.name ? (
              <View style={s.tag}>
                <Icon name="dumbbell" size={11} color={Colors.textMuted} />
                <Text style={s.tagTxt}>{plan.gym.name}</Text>
              </View>
            ) : null}
            <View style={s.tag}>
              <Icon name="calendar-range" size={11} color={Colors.textMuted} />
              <Text style={s.tagTxt}>
                {plan?.durationWeeks ?? 0} weeks
              </Text>
            </View>
            {plan?.isGlobal && (
              <View style={[s.tag, s.tagBlue]}>
                <Icon name="earth" size={11} color={Colors.info} />
                <Text style={[s.tagTxt, { color: Colors.info }]}>Global</Text>
              </View>
            )}
            {isTemplate && (
              <View style={[s.tag, s.tagPurple]}>
                <Icon name="bookmark-outline" size={11} color={Colors.purple} />
                <Text style={[s.tagTxt, { color: Colors.purple }]}>Template</Text>
              </View>
            )}
            {plan?.assignedMember && (
              <View style={[s.tag, s.tagPrimary]}>
                <Icon name="account-outline" size={11} color={Colors.primary} />
                <Text style={[s.tagTxt, { color: Colors.primary }]}>
                  {plan.assignedMember.profile?.fullName ?? "Assigned"}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* ── Stats bar ──────────────────────────────────────────────── */}
        <View style={s.statsBar}>
          {[
            {
              icon: "dumbbell",
              value: String(totalEx),
              label: "Exercises",
              color: Colors.primary,
            },
            {
              icon: "calendar-check-outline",
              value: String(activeDays),
              label: "Active days",
              color: Colors.success,
            },
            {
              icon: "calendar-week",
              value: String(weeks.length || (plan?.durationWeeks ?? 0)),
              label: "Weeks",
              color: Colors.info,
            },
          ].map((st) => (
            <View key={st.label} style={s.statItem}>
              <Text style={[s.statValue, { color: st.color }]}>
                {st.value}
              </Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Exercise planner ───────────────────────────────────────── */}
        {!hasData ? (
          <View style={s.noExercises}>
            <Icon name="clipboard-list-outline" size={40} color={Colors.textMuted} />
            <Text style={s.noExTxt}>No exercises planned yet</Text>
            <TouchableOpacity
              style={s.addFirstBtn}
              onPress={() =>
                navigation.navigate("OwnerAddWorkoutPlan", { plan })
              }
            >
              <Icon name="plus" size={15} color="#fff" />
              <Text style={s.addFirstTxt}>Add Exercises</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Week selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabScroll}
            >
              {weeks.map((week) => {
                const cnt = Object.values(planData[week] ?? {}).reduce(
                  (s, exs) => s + (exs?.length ?? 0),
                  0,
                );
                return (
                  <TouchableOpacity
                    key={week}
                    style={[s.weekPill, selWeek === week && s.weekPillActive]}
                    onPress={() => setSelWeek(week)}
                  >
                    <Text
                      style={[s.weekTxt, selWeek === week && s.weekTxtActive]}
                    >
                      {week}
                    </Text>
                    {cnt > 0 && (
                      <Text
                        style={[s.pillCnt, selWeek === week && { color: "#fff" }]}
                      >
                        {cnt}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Day selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabScroll}
            >
              {DAYS.map((day) => {
                const cnt = (planData[selWeek]?.[day] ?? []).length;
                const active = selDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[s.dayPill, active && s.dayPillActive]}
                    onPress={() => setSelDay(day)}
                  >
                    <Text style={[s.dayTxt, active && s.dayTxtActive]}>
                      {day.slice(0, 3)}
                    </Text>
                    {cnt > 0 && (
                      <Text style={[s.pillCnt, active && { color: Colors.primary }]}>
                        {cnt}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exercise list */}
            <View style={s.exerciseSection}>
              <Text style={s.dayHeading}>
                {selWeek} · {selDay}
              </Text>

              {currentExercises.length === 0 ? (
                <View style={s.dayEmpty}>
                  <Icon name="weather-sunny-off" size={24} color={Colors.textMuted} />
                  <Text style={s.dayEmptyTxt}>Rest day — no exercises</Text>
                </View>
              ) : (
                currentExercises.map((ex, i) => (
                  <View key={i} style={s.exRow}>
                    <View style={s.exNum}>
                      <Text style={s.exNumTxt}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.exName}>{ex.name}</Text>
                      {[
                        ex.sets && `${ex.sets} sets`,
                        ex.reps && `${ex.reps} reps`,
                        ex.weight && `${ex.weight} kg`,
                        ex.duration && `${ex.duration} min`,
                        ex.rest && `Rest ${ex.rest}s`,
                      ]
                        .filter(Boolean)
                        .join("  ·  ") ? (
                        <Text style={s.exMeta}>
                          {[
                            ex.sets && `${ex.sets} sets`,
                            ex.reps && `${ex.reps} reps`,
                            ex.weight && `${ex.weight} kg`,
                            ex.duration && `${ex.duration} min`,
                            ex.rest && `Rest ${ex.rest}s`,
                          ]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </Text>
                      ) : null}
                      {ex.notes ? (
                        <Text style={s.exNotes} numberOfLines={2}>
                          {ex.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.md,
  },

  // Header edit button
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
  editBtnTxt: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },

  // Meta card
  metaCard: {},
  metaTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
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
  metaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBlue: {
    backgroundColor: Colors.info + "15",
    borderColor: Colors.info + "40",
  },
  tagPurple: {
    backgroundColor: Colors.purple + "15",
    borderColor: Colors.purple + "40",
  },
  tagPrimary: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary + "40",
  },
  tagTxt: { color: Colors.textMuted, fontSize: 11 },

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

  // No exercises
  noExercises: {
    alignItems: "center",
    paddingVertical: 48,
    gap: Spacing.sm,
  },
  noExTxt: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  addFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    marginTop: 4,
  },
  addFirstTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },

  // Tab scrollers
  tabScroll: { paddingBottom: Spacing.sm, gap: Spacing.xs },

  // Week pills
  weekPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    minWidth: 72,
  },
  weekPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  weekTxtActive: { color: "#fff", fontWeight: "700" },

  // Day pills
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    minWidth: 44,
  },
  dayPillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  dayTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  dayTxtActive: { color: Colors.primary, fontWeight: "700" },

  pillCnt: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },

  // Exercise section
  exerciseSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  dayHeading: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  dayEmpty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dayEmptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },

  // Exercise row
  exRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
  exMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  exNotes: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: "italic",
    marginTop: 2,
  },
});
