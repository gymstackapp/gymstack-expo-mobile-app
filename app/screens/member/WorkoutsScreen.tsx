// mobile/src/screens/member/WorkoutsScreen.tsx
// Tab screen — no back button. Shows all assigned workout plans.
// "Today" pill highlights the current day's exercises across all plans.
import { memberWorkoutsApi } from "@/api/endpoints";
import { Badge, Card, EmptyState, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DIFF_COLOR: Record<string, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.warning,
  ADVANCED: Colors.error,
};
const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

// today's full name e.g. "Monday"
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

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

// ── Plan detail view ──────────────────────────────────────────────────────────
function PlanDetail({ plan, onBack }: { plan: any; onBack: () => void }) {
  const planData = plan.planData ?? {};
  const [selDay, setSelDay] = useState(TODAY);

  // Build week structure from planData keys (format: "Week 1" → { "Monday": [...] })
  const weeks = Object.keys(planData).sort();
  // Flatten to day → exercises map across all weeks for the selected day
  const exercisesForDay: any[] = weeks
    .flatMap((week) => {
      const days = planData[week] ?? {};
      return days[selDay] ?? [];
    })
    .filter((ex) => ex && ex.name);

  const totalExercises = weeks.reduce((sum: number, week: string) => {
    const days = planData[week] ?? {};
    return (
      sum +
      Object.values(days as Record<string, any[]>).reduce(
        (ds, exs) => ds + (Array.isArray(exs) ? exs.length : 0),
        0,
      )
    );
  }, 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.detailHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.detailTitle} numberOfLines={1}>
            {plan.title ?? "Workout Plan"}
          </Text>
          <Text style={s.detailSub}>
            {[
              plan.durationWeeks && `${plan.durationWeeks} weeks`,
              plan.difficulty,
              plan.gym?.name,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>
        <Badge
          label={plan.difficulty ?? "Plan"}
          variant={DIFF_VARIANT[plan.difficulty] ?? "default"}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
            { icon: "calendar-week", val: weeks.length, lbl: "Weeks" },
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
            const count = weeks.reduce((sum: number, wk: string) => {
              const exs = (planData[wk] ?? {})[day] ?? [];
              return sum + (Array.isArray(exs) ? exs.length : 0);
            }, 0);
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
              <Text style={s.restSub}>No exercises scheduled for {selDay}</Text>
            </View>
          ) : (
            <Card>
              <Text style={s.exSection}>
                {selDay} — {exercisesForDay.length} exercise
                {exercisesForDay.length !== 1 ? "s" : ""}
              </Text>
              {exercisesForDay.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} index={i} />
              ))}
            </Card>
          )}
        </View>

        {/* Weekly breakdown */}
        {weeks.length > 1 && (
          <View style={s.exerciseWrap}>
            <Text style={s.sectionHead}>Full Schedule</Text>
            {weeks.map((week) => {
              const days = planData[week] ?? {};
              const activeDays = Object.entries(
                days as Record<string, any[]>,
              ).filter(([, exs]) => Array.isArray(exs) && exs.length > 0);
              return (
                <Card key={week} style={{ marginBottom: Spacing.sm }}>
                  <Text style={s.weekHead}>{week}</Text>
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
                    activeDays.map(([day, exs]) => (
                      <View key={day} style={s.weekDayRow}>
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
                    ))
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Plan list ─────────────────────────────────────────────────────────────────
export default function WorkoutsScreen() {
  const navigation = useNavigation<any>();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["memberWorkouts"],
    queryFn: memberWorkoutsApi.list as () => Promise<any[]>,
    staleTime: 2 * 60_000,
  });

  // If a plan is selected, show detail view
  if (selectedPlan) {
    return (
      <PlanDetail plan={selectedPlan} onBack={() => setSelectedPlan(null)} />
    );
  }

  // Calculate today's exercise count across all plans
  const todayCount = plans.reduce((sum, plan) => {
    const planData = plan.planData ?? {};
    return (
      sum +
      Object.values(planData as Record<string, any>).reduce(
        (ws: number, days: any) => {
          const exs = days[TODAY] ?? [];
          return ws + (Array.isArray(exs) ? exs.length : 0);
        },
        0,
      )
    );
  }, 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.screenTitle}>Workouts</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          {todayCount > 0 && (
            <View style={s.todayChip}>
              <Icon name="lightning-bolt" size={12} color={Colors.primary} />
              <Text style={s.todayChipTxt}>{todayCount} today</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's summary banner (if there are exercises today) */}
      {todayCount > 0 && !isLoading && (
        <View style={s.todayCardWrap}>
          <TouchableOpacity
            style={s.todayCard}
            onPress={() => {
              // Navigate to the first plan that has exercises today
              const planWithToday = plans.find((p) => {
                const pd = p.planData ?? {};
                return Object.values(pd as Record<string, any>).some((days) => {
                  const exs = days[TODAY] ?? [];
                  return Array.isArray(exs) && exs.length > 0;
                });
              });
              if (planWithToday) setSelectedPlan(planWithToday);
            }}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.todayCardLabel}>
                TODAY · {TODAY.toUpperCase()}
              </Text>
              <Text style={s.todayCardTitle}>
                {todayCount} exercise{todayCount !== 1 ? "s" : ""} scheduled
              </Text>
              <Text style={s.todayCardSub}>Tap to start today's workout</Text>
            </View>
            <View style={s.todayCardArrow}>
              <Icon
                name="play-circle-outline"
                size={36}
                color={Colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup
            variant="card"
            count={3}
            itemHeight={110}
            gap={Spacing.md}
          />
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No workout plans yet"
          subtitle="Your trainer or gym will assign workout plans here"
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
            gap: Spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            plans.length > 0 ? (
              <Text style={s.listHead}>
                {plans.length} plan{plans.length !== 1 ? "s" : ""} assigned
              </Text>
            ) : null
          }
          renderItem={({ item: p }) => {
            const pd = p.planData ?? {};
            const totalEx = Object.values(pd as Record<string, any>).reduce(
              (ws: number, days: any) =>
                ws +
                Object.values(days as Record<string, any[]>).reduce(
                  (ds, exs) => ds + (Array.isArray(exs) ? exs.length : 0),
                  0,
                ),
              0,
            );
            const todayExs = Object.values(pd as Record<string, any>).reduce(
              (sum: number, days: any) => {
                const exs = days[TODAY] ?? [];
                return sum + (Array.isArray(exs) ? exs.length : 0);
              },
              0,
            );
            const diffColor = DIFF_COLOR[p.difficulty] ?? Colors.textMuted;

            return (
              <TouchableOpacity
                onPress={() => setSelectedPlan(p)}
                activeOpacity={0.78}
              >
                <Card>
                  <View style={s.planCardTop}>
                    <View
                      style={[s.planDot, { backgroundColor: diffColor + "25" }]}
                    >
                      <Icon name="dumbbell" size={18} color={diffColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planTitle}>
                        {p.title ?? "Workout Plan"}
                      </Text>
                      <Text style={s.planBy}>
                        by {p.creator?.fullName ?? "Trainer"} · {p.gym?.name}
                      </Text>
                    </View>
                    <Badge
                      label={p.difficulty ?? "Plan"}
                      variant={DIFF_VARIANT[p.difficulty] ?? "default"}
                    />
                  </View>

                  <View style={s.planMeta}>
                    {[
                      totalEx > 0 && `${totalEx} exercises`,
                      p.durationWeeks && `${p.durationWeeks} weeks`,
                      p.goal,
                    ]
                      .filter(Boolean)
                      .map((tag, i) => (
                        <View key={i} style={s.metaTag}>
                          <Text style={s.metaTagTxt}>{tag}</Text>
                        </View>
                      ))}
                  </View>

                  {todayExs > 0 && (
                    <View style={s.todayExBadge}>
                      <Icon
                        name="lightning-bolt"
                        size={12}
                        color={Colors.primary}
                      />
                      <Text style={s.todayExTxt}>
                        {todayExs} exercise{todayExs !== 1 ? "s" : ""} today
                      </Text>
                    </View>
                  )}

                  <View style={s.planFooter}>
                    <Text style={s.tapHint}>Tap to view full plan</Text>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={Colors.textMuted}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  menuBtn: { padding: 4 },
  // List header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  todayChipTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  listHead: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  // Today card
  todayCardWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  todayCardLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  todayCardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  todayCardSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 3,
  },
  todayCardArrow: {},
  // Plan cards
  planCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  planDot: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  planBy: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  planMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaTag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaTagTxt: { color: Colors.textSecondary, fontSize: Typography.xs },
  todayExBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  todayExTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  planFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  tapHint: { color: Colors.textMuted, fontSize: Typography.xs },
  // Detail view
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  detailSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
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
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
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
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
  exerciseWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
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
  },
  sectionHead: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: Spacing.md,
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
