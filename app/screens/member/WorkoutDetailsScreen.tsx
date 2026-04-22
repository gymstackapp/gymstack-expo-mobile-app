// mobile/src/screens/member/WorkoutDetailsScreen.tsx
// Screen for displaying detailed workout plan information
import { Badge, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

// today's full name e.g. "Monday"
export const TODAY =
  DAY_SHORT[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// ── Exercise row ──────────────────────────────────────────────────────────────
function ExerciseRow({ ex, index }: { ex: any; index: number }) {
  const meta = [
    ex.sets && `${ex.sets} sets`,
    ex.reps && `${ex.reps} reps`,
    ex.weight && `${ex.weight} kg`,
    ex.duration && `${ex.duration} min`,
    ex.rest && `Rest ${ex.rest}s`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View style={er.row}>
      <View style={er.num}>
        <Text style={er.numTxt}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={er.name}>{ex.name || "Exercise"}</Text>
        {!!meta && <Text style={er.meta}>{meta}</Text>}
        {!!ex.notes && <Text style={er.notes}>{ex.notes}</Text>}
      </View>
    </View>
  );
}
const er = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: "flex-start",
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  numTxt: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  meta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  notes: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: "italic",
    marginTop: 2,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WorkoutDetailsScreen({ route, navigation }: any) {
  const { plan } = route.params;
  const planData = plan.planData ?? {};

  console.log("plandata", planData);
  const [selDay, setSelDay] = useState(TODAY);

  // Build week structure from planData keys (format: "Week 1" → { "Monday": [...] })
  //   const weeks = Object.keys(planData).sort();

  //   const days = Object.keys(planData);
  // Flatten to day → exercises map across all weeks for the selected day
  //   const exercisesForDay: any[] = weeks
  //     .flatMap((week) => {
  //       const days = planData[week] ?? {};
  //       return days[selDay] ?? [];
  //     })
  //     .filter((ex) => ex && ex.name);

  const exercisesForDay: any[] = (planData[selDay] ?? []).filter(
    (ex: any) => ex && ex.name,
  );
  console.log("exercieses", exercisesForDay);

  //   const totalExercises = weeks.reduce((sum: number, week: string) => {
  //     const days = planData[week] ?? {};
  //     return (
  //       sum +
  //       Object.values(days as Record<string, any[]>).reduce(
  //         (ds, exs) => ds + (Array.isArray(exs) ? exs.length : 0),
  //         0,
  //       )
  //     );
  //   }, 0);
  const totalExercises = Object.values(planData).reduce(
    (sum: number, exs: any) => sum + (Array.isArray(exs) ? exs.length : 0),
    0,
  );
  console.log("total", totalExercises);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        {/* Header */}
        <Header
          back
          title={plan?.title ?? "Workout Plan"}
          subtitle={[
            plan.durationWeeks &&
              `${plan.durationWeeks} week${plan.durationWeeks > 1 ? "s" : ""}`,
            plan.gym?.name,
          ]
            .filter(Boolean)
            .join("  ·  ")}
          right={
            <Badge
              label={plan.difficulty ?? "Plan"}
              variant={DIFF_VARIANT[plan.difficulty] ?? "default"}
            />
          }
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Goal card */}
          {!!plan.goal && (
            <View style={s.goalCard}>
              <Icon name="flag-outline" size={15} color={Colors.primary} />
              <Text style={s.goalText}>Goal: {plan.goal}</Text>
            </View>
          )}

          {/* Stats strip */}
          <View style={s.statsStrip}>
            {[
              { icon: "dumbbell", val: totalExercises, lbl: "Total Exercises" },
              //   { icon: "calendar-week", val: days.length, lbl: "Weeks" },
              {
                icon: "account-outline",
                val: plan.creator?.fullName ?? "—",
                lbl: "Assigned by",
              },
            ].map((st) => (
              <View key={st.lbl} style={s.statItem}>
                <Icon name={st.icon} size={14} color={Colors.primary} />
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>

          {/* Day selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayScroll}
          >
            {DAYS.map((day, i) => {
              const isToday = day === TODAY;
              const isActive = day === selDay;
              //   const count = weeks.reduce((sum: number, wk: string) => {
              //     const exs = (planData[wk] ?? {})[day] ?? [];
              //     return sum + (Array.isArray(exs) ? exs.length : 0);
              //   }, 0);
              const count = Array.isArray(planData[day])
                ? planData[day].length
                : 0;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    s.dayPill,
                    isActive && s.dayPillActive,
                    isToday && !isActive && s.dayPillToday,
                  ]}
                  onPress={() => setSelDay(day)}
                >
                  <Text style={[s.dayPillTxt, isActive && s.dayPillTxtActive]}>
                    {DAY_SHORT[i]}
                  </Text>
                  {isToday && (
                    <View
                      style={[
                        s.todayDot,
                        isActive && { backgroundColor: "#fff" },
                      ]}
                    />
                  )}
                  {count > 0 && !isToday && (
                    <Text style={[s.dayCount, isActive && { color: "#fff" }]}>
                      {count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Today indicator */}
          {selDay === TODAY && (
            <View style={s.todayBanner}>
              <Icon name="lightning-bolt" size={14} color={Colors.primary} />
              <Text style={s.todayBannerTxt}>Today's workout</Text>
            </View>
          )}

          {/* Exercises */}
          <View style={s.exerciseWrap}>
            {exercisesForDay.length === 0 ? (
              <View style={s.restDay}>
                <Icon name="sleep" size={28} color={Colors.textMuted} />
                <Text style={s.restTxt}>Rest day</Text>
                <Text style={s.restSub}>
                  No exercises scheduled for {selDay}
                </Text>
              </View>
            ) : (
              <View style={s.exerciseCard}>
                <Text style={s.exSection}>
                  {selDay} — {exercisesForDay.length} exercise
                  {exercisesForDay.length !== 1 ? "s" : ""}
                </Text>
                {exercisesForDay.map((ex, i) => (
                  <ExerciseRow key={i} ex={ex} index={i} />
                ))}
              </View>
            )}
          </View>

          {/* Weekly breakdown */}
          {/* {Object.keys(planData).length > 0 && (
            <View style={s.exerciseWrap}>
              <Text style={s.sectionHead}>Full Schedule</Text>
              {Object.entries(planData).map(([day,exs]) => {
                const days = planData[day] ?? {};
                // const activeDays = Object.entries(
                //   days as Record<string, any[]>,
                // ).filter(([, exs]) => Array.isArray(exs) && exs.length > 0);\
                const activeDays = Array.isArray(exs) && exs.length > 0;
                return (
                  <View key={day} style={s.weekCard}>
                    <Text style={s.weekHead}>{day}</Text>
                    {activeDays.length === 0 ? (
                      <Text
                        style={{
                          color: Colors.textMuted,
                          fontSize: Typography.xs,
                        }}
                      >
                        All rest
                      </Text>
                    ) : (
                      
                        <View style={s.weekDayRow}>
                          <Text
                            style={[
                              s.weekDayName,
                              day === TODAY && { color: Colors.primary },
                            ]}
                          >
                            {day === TODAY ? `${day} ✦` : day}
                          </Text>
                          <Text style={s.weekDayCount}>
                            {exs.length} exercise{exs.length !== 1 ? "s" : ""}
                          </Text>
                        </View>
                      
                    )}
                  </View>
                );
              })}
            </View>
          )} */}
          <View style={s.exerciseWrap}>
            <Text style={s.sectionHead}>Full Schedule</Text>
            {Object.entries(planData).map(([day, exs]: any) => (
              <View key={day} style={s.weekCard}>
                <Text style={s.weekHead}>{day}</Text>
                {Array.isArray(exs) && exs.length > 0 ? (
                  <View style={s.weekDayRow}>
                    <Text
                      style={[
                        s.weekDayName,
                        day === TODAY && { color: Colors.primary },
                      ]}
                    >
                      {" "}
                      {day === TODAY ? `${day} ✦` : day}{" "}
                    </Text>
                    <Text style={s.weekDayCount}>
                      {" "}
                      {exs.length} exercise{exs.length !== 1 ? "s" : ""}{" "}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: Colors.textMuted }}> Rest day </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  goalText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  statsStrip: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statVal: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  statLbl: { color: Colors.textMuted, fontSize: 10, textAlign: "center" },
  dayScroll: {
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillToday: { borderColor: Colors.primary },
  dayPillTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  dayPillTxtActive: { color: "#fff", fontWeight: "700" },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  dayCount: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  todayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  todayBannerTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  exerciseWrap: { paddingBottom: Spacing.md },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  restDay: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  restTxt: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  restSub: { color: Colors.textMuted, fontSize: Typography.sm },
  exSection: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  sectionHead: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  weekHead: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  weekDayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  weekDayName: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  weekDayCount: { color: Colors.textMuted, fontSize: Typography.xs },
});
