// mobile/src/screens/member/WorkoutsScreen.tsx
// Tab screen — no back button. Shows all assigned workout plans.
// "Today" pill highlights the current day's exercises across all plans.
import { memberWorkoutsApi } from "@/api/endpoints";
import { Badge, Card, EmptyState, Header, NoGymState, SkeletonGroup } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
export const TODAY =
  DAY_SHORT[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// ── Plan list ─────────────────────────────────────────────────────────────────
export default function WorkoutsScreen() {
  const navigation = useNavigation<any>();

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

  // Calculate today's exercise count across all plans
  const todayCount = plans.reduce((sum, plan) => {
    const planData = plan.planData ?? {};

    const exercises = planData[TODAY] ?? [];
    const result = sum + (Array.isArray(exercises) ? exercises.length : 0);
    return result;
  }, 0);

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Workouts" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <Header
          menu
          title="Workout Plans"
          right={
            todayCount > 0 && (
              <View style={s.todayChip}>
                <Icon name="lightning-bolt" size={12} color={Colors.primary} />
                <Text style={s.todayChipTxt}>{todayCount}</Text>
              </View>
            )
          }
        />

        {/* Today's summary banner (if there are exercises today) */}
        {todayCount > 0 && !isLoading && (
          <View style={s.todayCardWrap}>
            <TouchableOpacity
              style={s.todayCard}
              onPress={() => {
                // Navigate to the first plan that has exercises today
                const planWithToday = plans.find((p) => {
                  const pd = p.planData ?? {};
                  return Object.values(pd as Record<string, any>).some(
                    (days) => {
                      const exs = days[TODAY] ?? [];
                      return Array.isArray(exs) && exs.length > 0;
                    },
                  );
                });
                if (planWithToday) {
                  navigation.navigate("WorkoutDetailsScreen", {
                    plan: planWithToday,
                  });
                }
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

        {isLoading || gymLoading ? (
          <View>
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
                  onPress={() =>
                    navigation.navigate("WorkoutDetailsScreen", { plan: p })
                  }
                  activeOpacity={0.78}
                >
                  <Card>
                    <View style={s.planCardTop}>
                      <View
                        style={[
                          s.planDot,
                          { backgroundColor: diffColor + "25" },
                        ]}
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
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
  todayCardWrap: { paddingBottom: Spacing.sm },
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
});
