// mobile/src/screens/member/DietPlanDetailsScreen.tsx
// Detail screen for a diet plan
import { Card, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
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

const MEAL_ORDER = [
  "Breakfast",
  "Mid-Morning",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Post-Workout",
];

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
    const ai = MEAL_ORDER.indexOf(a);
    const bi = MEAL_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    return 0;
  });
}

function dayCalories(planData: Record<string, any[]>, day: string): number {
  return Object.entries(planData)
    .filter(([k]) => k.startsWith(`${day}__`))
    .reduce(
      (sum, [, items]) =>
        sum +
        (items as any[]).reduce(
          (s, it) => s + (parseFloat(it.calories) || 0),
          0,
        ),
      0,
    );
}

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
              Protein {item.protein}g
            </Text>
          )}
          {item.carbs && (
            <Text style={[fr.macro, { color: Colors.warning }]}>
              Carbs {item.carbs}g
            </Text>
          )}
          {item.fat && (
            <Text style={[fr.macro, { color: Colors.error }]}>
              Fat {item.fat}g
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

export default function DietPlanDetailsScreen({ route, navigation }: any) {
  const { plan } = route.params;
  const [selDay, setSelDay] = useState(TODAY);
  const planData: Record<string, any[]> = plan.planData ?? {};

  const slots = getSlotsForDay(planData, selDay);
  const dayTotalCal = dayCalories(planData, selDay);

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
        <Header
          back
          title={plan.title ?? "Diet Plan"}
          subtitle={`${plan.gym?.name} · by ${plan.creator?.fullName}`}
        />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {(plan.caloriesTarget ||
            plan.proteinG ||
            plan.carbsG ||
            plan.fatG) && (
            <View style={{ paddingTop: Spacing.md }}>
              <Card>
                <Text style={s.cardHead}>Daily Targets</Text>
                <View style={s.macroRow}>
                  {plan.caloriesTarget && (
                    <MacroPill
                      label="Calories"
                      value={`${plan.caloriesTarget}`}
                      color={Colors.primary}
                    />
                  )}
                  {plan.proteinG && (
                    <MacroPill
                      label="Protein"
                      value={`${plan.proteinG}g`}
                      color="#3b82f6"
                    />
                  )}
                  {plan.carbsG && (
                    <MacroPill
                      label="Carbs"
                      value={`${plan.carbsG}g`}
                      color={Colors.warning}
                    />
                  )}
                  {plan.fatG && (
                    <MacroPill
                      label="Fat"
                      value={`${plan.fatG}g`}
                      color={Colors.error}
                    />
                  )}
                </View>
              </Card>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayScroll}
          >
            {DAYS.map((day) => {
              const cnt = Object.keys(planData)
                .filter((k) => k.startsWith(`${day}__`))
                .reduce((sum, k) => sum + (planData[k]?.length ?? 0), 0);
              const isToday = day === TODAY;
              const isActive = day === selDay;
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
                    {day.slice(0, 3)}
                  </Text>
                  {isToday && (
                    <View
                      style={[
                        s.todayDot,
                        isActive && { backgroundColor: "#fff" },
                      ]}
                    />
                  )}
                  {cnt > 0 && !isToday && (
                    <Text style={[s.dayCount, isActive && { color: "#fff" }]}>
                      {cnt}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {dayTotalCal > 0 && (
            <View style={s.dayCalRow}>
              <Icon name="fire" size={14} color={Colors.primary} />
              <Text style={s.dayCalTxt}>
                {selDay}: ~{Math.round(dayTotalCal)} kcal
              </Text>
              {selDay === TODAY && (
                <View style={s.todayTag}>
                  <Text style={s.todayTagTxt}>Today</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ paddingBottom: Spacing.xl }}>
            {slots.length === 0 ? (
              <View style={s.emptyMeal}>
                <Icon
                  name="food-off-outline"
                  size={26}
                  color={Colors.textMuted}
                />
                <Text style={s.emptyMealTxt}>Nothing planned for {selDay}</Text>
              </View>
            ) : (
              slots.map((slot) => {
                const items = planData[`${selDay}__${slot}`] ?? [];
                return <SlotCard key={slot} slot={slot} items={items} />;
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
    marginBottom: Spacing.sm,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  macroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
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
  dayCalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: 6,
  },
});
