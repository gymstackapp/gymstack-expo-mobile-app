// mobile/src/screens/member/DietScreen.tsx
// Tab screen — no back button. Shows assigned diet plans.
// Supports BOTH planData key formats:
//   Old: "Monday__Breakfast"  → label = "Breakfast"
//   New: "Monday__08:00 AM"   → label = "08:00 AM" (sorted chronologically)
// Detection: if the part after "__" matches /^\d{1,2}:\d{2} (AM|PM)$/ → new format.

import { memberDietApi } from "@/api/endpoints";
import { Card, EmptyState, Header, NoGymState, SkeletonGroup } from "@/components";
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// Legacy fixed meal order for old-format plans
const MEAL_ORDER = [
  "Breakfast",
  "Mid-Morning",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Post-Workout",
];

// ── Slot helpers ──────────────────────────────────────────────────────────────

const TIME_RE = /^\d{1,2}:\d{2} (AM|PM)$/;

function isTimeSlot(slot: string): boolean {
  return TIME_RE.test(slot);
}

function parseTimeMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(" ");
  const [h, m] = time.split(":").map(Number);
  let hours = h;
  if (period === "AM" && h === 12) hours = 0;
  if (period === "PM" && h !== 12) hours = h + 12;
  return hours * 60 + m;
}

/** Get all slot names that have items for a given day, sorted correctly. */
function getSlotsForDay(
  planData: Record<string, any[]>,
  day: string,
): string[] {
  const prefix = `${day}__`;
  const slots = Object.keys(planData)
    .filter((k) => k.startsWith(prefix) && (planData[k]?.length ?? 0) > 0)
    .map((k) => k.slice(prefix.length));

  return slots.sort((a, b) => {
    if (isTimeSlot(a) && isTimeSlot(b)) {
      return parseTimeMinutes(a) - parseTimeMinutes(b);
    }
    // Old format: sort by MEAL_ORDER index
    const ai = MEAL_ORDER.indexOf(a);
    const bi = MEAL_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    return 0;
  });
}

/** Total calories for a day across ALL slot formats. */
function dayCalories(planData: Record<string, any[]>, day: string): number {
  return Object.entries(planData)
    .filter(([k]) => k.startsWith(`${day}__`))
    .reduce((sum, [, items]) => {
      return (
        sum +
        (items as any[]).reduce(
          (s, it) => s + (parseFloat(it.calories) || 0),
          0,
        )
      );
    }, 0);
}

// ── Macro pill ────────────────────────────────────────────────────────────────

function MacroPill({
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
        mp.pill,
        { backgroundColor: color + "18", borderColor: color + "35" },
      ]}
    >
      <Text style={[mp.val, { color }]}>{value}</Text>
      <Text style={mp.lbl}>{label}</Text>
    </View>
  );
}
const mp = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 64,
  },
  val: { fontSize: Typography.sm, fontWeight: "800" },
  lbl: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
});

// ── Food item row ─────────────────────────────────────────────────────────────

function FoodRow({ item, index }: { item: any; index: number }) {
  const cals = parseFloat(item.calories) || 0;
  return (
    <View style={fr.row}>
      <View style={fr.num}>
        <Text style={fr.numTxt}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={fr.name}>{item.name || "Food item"}</Text>
        {!!item.quantity && <Text style={fr.qty}>{item.quantity}</Text>}
        <View style={fr.macros}>
          {cals > 0 && (
            <Text style={[fr.macro, { color: Colors.primary }]}>
              {cals}kcal
            </Text>
          )}
          {item.protein && (
            <Text style={[fr.macro, { color: "#3b82f6" }]}>
              P {item.protein}g
            </Text>
          )}
          {item.carbs && (
            <Text style={[fr.macro, { color: Colors.warning }]}>
              C {item.carbs}g
            </Text>
          )}
          {item.fat && (
            <Text style={[fr.macro, { color: Colors.error }]}>
              F {item.fat}g
            </Text>
          )}
        </View>
      </View>
      {cals > 0 && (
        <View style={fr.calBadge}>
          <Text style={fr.calTxt}>{cals}</Text>
          <Text style={fr.calUnit}>kcal</Text>
        </View>
      )}
    </View>
  );
}
const fr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  numTxt: { color: Colors.success, fontSize: 11, fontWeight: "800" },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  qty: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  macros: { flexDirection: "row", gap: 8, marginTop: 3, flexWrap: "wrap" },
  macro: { fontSize: Typography.xs, fontWeight: "600" },
  calBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    minWidth: 52,
  },
  calTxt: { color: Colors.primary, fontSize: Typography.sm, fontWeight: "800" },
  calUnit: { color: Colors.primary, fontSize: 9 },
});

// ── Meal slot card ────────────────────────────────────────────────────────────

function SlotCard({ slot, items }: { slot: string; items: any[] }) {
  const slotCals = items.reduce(
    (s, it) => s + (parseFloat(it.calories) || 0),
    0,
  );
  const isTime = isTimeSlot(slot);
  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: Spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.xs,
          }}
        >
          <Icon
            name={isTime ? "clock-outline" : "food-fork-drink"}
            size={14}
            color={Colors.success}
          />
          <Text style={s.cardHead}>{slot}</Text>
        </View>
        {slotCals > 0 && (
          <View style={s.slotCalBadge}>
            <Icon name="fire" size={10} color={Colors.primary} />
            <Text style={s.slotCalTxt}>{Math.round(slotCals)} kcal</Text>
          </View>
        )}
      </View>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <View
              style={{
                height: 1,
                backgroundColor: Colors.border,
                marginVertical: Spacing.xs,
              }}
            />
          )}
          <FoodRow item={item} index={i} />
        </React.Fragment>
      ))}
    </Card>
  );
}

// ── Plan list ─────────────────────────────────────────────────────────────────

export default function DietScreen() {
  const navigation = useNavigation<any>();

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["memberDiet"],
    queryFn: memberDietApi.get as () => Promise<any[]>,
    staleTime: 2 * 60_000,
  });

  // Today's total calories across all plans (all slot formats)
  const todayCals = plans.reduce((sum, plan) => {
    return sum + dayCalories(plan.planData ?? {}, TODAY);
  }, 0);

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Nutrition" />
      </SafeAreaView>
    );
  }

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
        <Header menu title="Nutrition" />

        {/* Today summary card */}
        {todayCals > 0 && !isLoading && !gymLoading && (
          <View
            style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}
          >
            <TouchableOpacity
              style={s.todayCard}
              onPress={() =>
                navigation.navigate("DietPlanDetailsScreen", { plan: plans[0] })
              }
              activeOpacity={0.85}
            >
              <Icon
                name="food-apple-outline"
                size={22}
                color={Colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.todayCardLabel}>
                  TODAY · {TODAY.toUpperCase()}
                </Text>
                <Text style={s.todayCardCals}>
                  ~{Math.round(todayCals)} kcal planned
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.success} />
            </TouchableOpacity>
          </View>
        )}

        {isLoading || gymLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup
              variant="card"
              count={3}
              itemHeight={120}
              gap={Spacing.md}
            />
          </View>
        ) : plans.length === 0 ? (
          <EmptyState
            icon="food-apple-outline"
            title="No diet plans yet"
            subtitle="Your trainer or gym will assign nutrition plans here"
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
            renderItem={({ item: p }) => {
              const pd = p.planData ?? {};
              const todaySlots = getSlotsForDay(pd, TODAY);
              const todayItemCount = todaySlots.reduce(
                (sum, slot) => sum + (pd[`${TODAY}__${slot}`]?.length ?? 0),
                0,
              );
              const todayCalsForPlan = dayCalories(pd, TODAY);

              return (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("DietPlanDetailsScreen", { plan: p })
                  }
                  activeOpacity={0.78}
                >
                  <Card>
                    <View style={s.planTop}>
                      <View style={s.planIcon}>
                        <Icon
                          name="food-apple-outline"
                          size={20}
                          color={Colors.success}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.planTitle}>
                          {p.title ?? "Diet Plan"}
                        </Text>
                        <Text style={s.planBy}>
                          by {p.creator?.fullName} · {p.gym?.name}
                        </Text>
                      </View>
                    </View>

                    {(p.caloriesTarget || p.proteinG || p.carbsG || p.fatG) && (
                      <View style={s.macroRow}>
                        {p.caloriesTarget && (
                          <MacroPill
                            label="Cal"
                            value={`${p.caloriesTarget}`}
                            color={Colors.primary}
                          />
                        )}
                        {p.proteinG && (
                          <MacroPill
                            label="Protein"
                            value={`${p.proteinG}g`}
                            color="#3b82f6"
                          />
                        )}
                        {p.carbsG && (
                          <MacroPill
                            label="Carbs"
                            value={`${p.carbsG}g`}
                            color={Colors.warning}
                          />
                        )}
                        {p.fatG && (
                          <MacroPill
                            label="Fat"
                            value={`${p.fatG}g`}
                            color={Colors.error}
                          />
                        )}
                      </View>
                    )}

                    {todayItemCount > 0 && (
                      <View style={s.todayBadge}>
                        <Icon name="fire" size={11} color={Colors.primary} />
                        <Text style={s.todayBadgeTxt}>
                          {todayItemCount} items today
                          {todayCalsForPlan > 0
                            ? ` · ~${Math.round(todayCalsForPlan)} kcal`
                            : ""}
                        </Text>
                      </View>
                    )}

                    <View style={s.planFooter}>
                      <Text style={s.tapHint}>Tap to view meals</Text>
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
  menuBtn: { padding: 4 },
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
  calChip: {
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
  calChipTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.success + "40",
    padding: Spacing.md,
  },
  todayCardLabel: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  todayCardCals: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
    marginTop: 2,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.successFaded,
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
  macroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  todayBadge: {
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
  todayBadgeTxt: {
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
  cardHead: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  slotCalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slotCalTxt: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  dayScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  dayCalRow: {
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
  dayCalTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
    flex: 1,
  },
  todayTag: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayTagTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  emptyMeal: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyMealTxt: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
});
