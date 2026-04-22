// mobile/src/screens/member/DashboardScreen.tsx
import { memberAttendanceApi, memberDashboardApi } from "@/api/endpoints";
import { Avatar, Card, NoGymState, Skeleton } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const { width: SCREEN_W } = Dimensions.get("window");

// ── API response types ────────────────────────────────────────────────────────

interface GymMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
  gym: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    contactNumber: string | null;
  } | null;
  membershipPlan: {
    name: string;
    price: string | number;
    durationMonths: number;
  } | null;
  assignedTrainer: {
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

interface DashboardData {
  memberName: string;
  gymName: string;
  membershipStatus: string;
  membershipPlan: string;
  expiryDate: string | null;
  daysRemaining: number | null;
  hasCheckedInToday: boolean;
  currentStreak: number;
  monthlyCheckIns: number;
  todayWorkout: any | null;
  todayDiet: any | null;
  recentNotifications: DashboardNotification[];
  unreadCount: number;
  activeMembership: GymMembership | null;
  memberships: GymMembership[];
}

// mobile/src/screens/member/DashboardScreen.tsx

// ── Mini attendance chart (last 7 days bars) ──────────────────────────────────
function WeekBars({ attendance }: { attendance: any[] }) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const hit = attendance.some(
        (a) => new Date(a.checkInTime).toDateString() === key,
      );
      result.push({
        label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
        hit,
        isToday: i === 0,
      });
    }
    return result;
  }, [attendance]);

  return (
    <View style={wb.row}>
      {days.map((d, i) => (
        <View key={i} style={wb.col}>
          <View
            style={[wb.bar, d.hit && wb.barFilled, d.isToday && wb.barToday]}
          />
          <Text style={[wb.lbl, d.isToday && { color: Colors.primary }]}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
const wb = StyleSheet.create({
  row: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
  col: { flex: 1, alignItems: "center", gap: 4 },
  bar: {
    width: "100%",
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surfaceRaised,
  },
  barFilled: { backgroundColor: Colors.primary + "60", height: 48 },
  barToday: { borderWidth: 1.5, borderColor: Colors.primary },
  lbl: { color: Colors.textMuted, fontSize: 9, fontWeight: "600" },
});

// ── Calorie mini-bar ──────────────────────────────────────────────────────────
function CalorieBar({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const color =
    pct > 0.9 ? Colors.error : pct > 0.6 ? Colors.warning : Colors.success;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>
          Calories today
        </Text>
        <Text style={{ color, fontSize: Typography.xs, fontWeight: "700" }}>
          {consumed} / {target} kcal
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: Colors.surfaceRaised,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ── Quick stat pill ───────────────────────────────────────────────────────────
function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={[sp.pill, { borderColor: color + "25" }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[sp.val, { color }]}>{value}</Text>
      <Text style={sp.lbl}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  val: { fontSize: Typography.lg, fontWeight: "800" },
  lbl: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MemberDashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } =
    useQuery<DashboardData>({
      queryKey: ["memberDashboard"],
      queryFn: memberDashboardApi.get as () => Promise<DashboardData>,
      staleTime: 60_000,
    });

  const checkInMutation = useMutation({
    mutationFn: memberAttendanceApi.checkIn,
    onMutate: async () => {
      // Optimistic update: set hasCheckedInToday to true and increment streak
      qc.setQueryData(["memberDashboard"], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            hasCheckedInToday: true,
            currentStreak: (oldData.currentStreak ?? 0) + 1,
            monthlyCheckIns: (oldData.monthlyCheckIns ?? 0) + 1,
          };
        }
        return oldData;
      });
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["memberDashboard"] });
      qc.invalidateQueries({ queryKey: ["memberAttendance"] });
      Toast.show({
        type: "success",
        text1: res.message ?? "Checked in! 🔥",
        position: "top",
      });
    },
    onError: (err: any) => {
      // Revert optimistic update
      qc.setQueryData(["memberDashboard"], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            hasCheckedInToday: false,
            currentStreak: Math.max((oldData.currentStreak ?? 1) - 1, 0),
            monthlyCheckIns: Math.max((oldData.monthlyCheckIns ?? 1) - 1, 0),
          };
        }
        return oldData;
      });
      Toast.show({
        type: "error",
        text1: err?.message ?? "Check-in failed",
        position: "top",
      });
    },
  });

  const firstName =
    data?.memberName?.split(" ")[0] ??
    profile?.fullName?.split(" ")[0] ??
    "there";
  const active = data?.activeMembership ?? null;
  const currentStreak = data?.currentStreak ?? 0;
  const longestStreak = active?.longestStreak ?? 0;
  const monthlyCheckIns = data?.monthlyCheckIns ?? 0;
  const daysRemaining = data?.daysRemaining ?? null;
  const checkedInToday = data?.hasCheckedInToday ?? false;
  const todayWorkout = data?.todayWorkout ?? null;
  const todayDiet = data?.todayDiet ?? null;
  const recentNotifications = data?.recentNotifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const todayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];

  // Diet calorie estimate from today's meals
  const todayCaloriesConsumed = 0; // will fill from diet API when integrated
  const calorieTarget = 2000;

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Dashboard" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {error ? (
        <View style={s.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={s.errorTitle}>Failed to load dashboard</Text>
          <Text style={s.errorMessage}>
            {error?.message ?? "Something went wrong. Please try again."}
          </Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* ── Header ─────────────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.menuBtn}
            >
              <Icon name="menu" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>
                Good{" "}
                {new Date().getHours() < 12
                  ? "morning"
                  : new Date().getHours() < 17
                    ? "afternoon"
                    : "evening"}{" "}
                👋
              </Text>
              <Text style={s.name}>{firstName}</Text>
            </View>
            <View style={s.headerRight}>
              {currentStreak > 0 && (
                <View style={s.streakBadge}>
                  <Text style={s.streakBadgeText}>🔥 {currentStreak}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Avatar
                  name={profile?.fullName ?? "M"}
                  url={profile?.avatarUrl}
                  size={42}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Membership card ─────────────────────────────── */}
          {isLoading || gymLoading ? (
            <Skeleton height={110} style={{ marginBottom: Spacing.lg }} />
          ) : active ? (
            <View style={s.membershipCard}>
              <View style={s.membershipTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.gymName}>{active.gym?.name}</Text>
                  <Text style={s.planName}>
                    {active.membershipPlan?.name ?? "Active Member"}
                  </Text>
                  {active.gym?.city && (
                    <View style={s.gymMeta}>
                      <Icon
                        name="map-marker-outline"
                        size={12}
                        color="rgba(255,255,255,0.6)"
                      />
                      <Text style={s.gymMetaText}>{active.gym.city}</Text>
                    </View>
                  )}
                </View>
                <View style={s.membershipRight}>
                  <View style={s.activeChip}>
                    <View style={s.activeDot} />
                    <Text style={s.activeText}>Active</Text>
                  </View>
                  {daysRemaining !== null && (
                    <Text
                      style={[s.expiryText, daysRemaining <= 7 && s.expiryWarn]}
                    >
                      {daysRemaining <= 0
                        ? "Expired"
                        : `${daysRemaining}d left`}
                    </Text>
                  )}
                </View>
              </View>

              {/* Trainer */}
              {active.assignedTrainer && (
                <View style={s.trainerRow}>
                  <Icon
                    name="account-tie-outline"
                    size={12}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={s.trainerText}>
                    Trainer:{" "}
                    {active.assignedTrainer.profile?.fullName ?? "Assigned"}
                  </Text>
                </View>
              )}

              {/* Check-in button */}
              <TouchableOpacity
                style={[s.checkInBtn, checkedInToday && s.checkInBtnDone]}
                onPress={() => !checkedInToday && checkInMutation.mutate()}
                disabled={checkedInToday || checkInMutation.isPending}
                activeOpacity={0.8}
              >
                <Icon
                  name={checkedInToday ? "check-circle" : "lightning-bolt"}
                  size={16}
                  color={checkedInToday ? Colors.success : Colors.primary}
                />
                <Text
                  style={[
                    s.checkInText,
                    checkedInToday && { color: Colors.success },
                  ]}
                >
                  {checkInMutation.isPending
                    ? "Checking in…"
                    : checkedInToday
                      ? "Checked in today ✓"
                      : "Check In Now"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.noGymCard}
              onPress={() => navigation.navigate("Discover")}
              activeOpacity={0.8}
            >
              <Icon name="compass-outline" size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.noGymTitle}>No active gym membership</Text>
                <Text style={s.noGymSub}>
                  Discover gyms near you and join today
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* ── Expiry Alert ────────────────────────────────── */}
          {!isLoading && !gymLoading && data?.memberships && data.memberships
            .filter((m) => {
              if (!m.endDate) return false;
              const days = Math.ceil(
                (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return days <= 7;
            })
            .map((m) => {
              const days = Math.ceil(
                (new Date(m.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const expired = days <= 0;
              return (
                <View
                  key={m.id}
                  style={[
                    s.expiryAlert,
                    expired ? s.expiryAlertExpired : s.expiryAlertWarn,
                  ]}
                >
                  <Icon
                    name={expired ? "alert-circle" : "clock-alert-outline"}
                    size={20}
                    color={expired ? Colors.error : Colors.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.expiryAlertTitle, expired ? { color: Colors.error } : { color: Colors.warning }]}>
                      {expired
                        ? `Membership Expired — ${m.gym?.name ?? "Your Gym"}`
                        : `Expiring Soon — ${m.gym?.name ?? "Your Gym"}`}
                    </Text>
                    <Text style={s.expiryAlertSub}>
                      {expired
                        ? "Your membership has expired. Renew to keep access."
                        : `${days} day${days === 1 ? "" : "s"} left on your membership.`}
                    </Text>
                  </View>
                  {m.gym?.id && (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("GymDetail", { gymId: m.gym!.id })
                      }
                      style={[
                        s.renewBtn,
                        expired ? s.renewBtnExpired : s.renewBtnWarn,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.renewBtnText, expired ? { color: Colors.error } : { color: Colors.warning }]}>
                        Renew Now
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

          {/* ── Stats pills ─────────────────────────────────── */}
          {isLoading || gymLoading ? (
            <Skeleton height={70} style={{ marginBottom: Spacing.lg }} />
          ) : (
            <View style={s.statsRow}>
              <StatPill
                icon="fire"
                value={currentStreak}
                label="Streak"
                color={Colors.primary}
              />
              <StatPill
                icon="calendar-check"
                value={monthlyCheckIns}
                label="This Month"
                color="#3b82f6"
              />
              <StatPill
                icon="dumbbell"
                value={todayWorkout ? 1 : 0}
                label="Workouts"
                color="#8b5cf6"
              />
              <StatPill
                icon="food-apple-outline"
                value={todayDiet ? 1 : 0}
                label="Diets"
                color="#10b981"
              />
            </View>
          )}

          {/* ── Attendance 7-day chart ───────────────────────── */}
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>This Week</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("MemberAttendance")}
              >
                <Text style={s.cardLink}>View all</Text>
              </TouchableOpacity>
            </View>
            {isLoading || gymLoading ? (
              <Skeleton height={60} />
            ) : (
              <WeekBars attendance={[]} />
            )}
            <View style={s.streakMeta}>
              <Text style={s.streakMetaText}>
                Current streak:{" "}
                <Text style={{ color: Colors.primary, fontWeight: "800" }}>
                  {currentStreak} days
                </Text>
                {"  ·  "}Best:{" "}
                <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>
                  {longestStreak} days
                </Text>
              </Text>
            </View>
          </Card>

          {/* ── Calorie tracker ──────────────────────────────── */}
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Today's Nutrition</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Nutrition")}
              >
                <Text style={s.cardLink}>Diet plan</Text>
              </TouchableOpacity>
            </View>
            <CalorieBar
              consumed={todayCaloriesConsumed}
              target={calorieTarget}
            />
            <View style={s.macroRow}>
              {[
                { label: "Protein", value: "—g", color: "#ef4444" },
                { label: "Carbs", value: "—g", color: "#f59e0b" },
                { label: "Fats", value: "—g", color: "#3b82f6" },
              ].map((m) => (
                <View key={m.label} style={s.macroPill}>
                  <Text style={[s.macroVal, { color: m.color }]}>
                    {m.value}
                  </Text>
                  <Text style={s.macroLbl}>{m.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={s.viewDietBtn}
              onPress={() => navigation.navigate("Nutrition")}
            >
              <Icon
                name="food-apple-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={s.viewDietText}>View today's meal plan</Text>
              <Icon name="chevron-right" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </Card>

          {/* ── Today's workout ──────────────────────────────── */}
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Today's Workout</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Workouts")}>
                <Text style={s.cardLink}>All plans</Text>
              </TouchableOpacity>
            </View>
            {isLoading || gymLoading ? (
              <Skeleton height={60} />
            ) : todayWorkout ? (
              <TouchableOpacity
                style={s.workoutCta}
                onPress={() => navigation.navigate("MemberWorkouts")}
                activeOpacity={0.8}
              >
                <Icon name="dumbbell" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.workoutCtaTitle}>
                    {todayWorkout.name ?? "Today's Workout"}
                  </Text>
                  <Text style={s.workoutCtaSub}>
                    Tap to view {todayName}'s exercises
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={s.emptyInCard}>
                <Icon name="dumbbell" size={24} color={Colors.textMuted} />
                <Text style={s.emptyInCardText}>
                  No workout plan assigned yet
                </Text>
              </View>
            )}
          </Card>

          {/* ── Recent Notifications ─────────────────────────── */}
          {recentNotifications.length > 0 && (
            <>
              <View style={s.rowBetween}>
                <Text style={s.sectionTitle}>
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("MemberNotifications")}
                >
                  <Text style={s.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {recentNotifications.slice(0, 3).map((n) => (
                <View key={n.id} style={s.activityRow}>
                  <View
                    style={[
                      s.activityDot,
                      {
                        backgroundColor: n.isRead
                          ? Colors.border
                          : Colors.primary,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.activityGym}>{n.title}</Text>
                    <Text style={s.activityTime}>{n.message}</Text>
                  </View>
                  {!n.isRead && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeBadgeText}>New</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* ── Quick actions ────────────────────────────────── */}
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {[
              {
                icon: "office-building-outline",
                label: "My Gym",
                screen: "MemberGyms",
                color: Colors.info,
              },
              {
                icon: "dumbbell",
                label: "Workouts",
                screen: "Workouts",
                color: Colors.purple,
              },
              {
                icon: "food-apple-outline",
                label: "Diet Plan",
                screen: "Nutrition",
                color: Colors.success,
              },
              {
                icon: "credit-card-outline",
                label: "Payments",
                screen: "MemberPayments",
                color: Colors.warning,
              },
              {
                icon: "shopping-outline",
                label: "Supplements",
                screen: "MemberStore",
                color: Colors.primary,
              },
              // {
              //   icon: "gift-outline",
              //   label: "Refer & Earn",
              //   screen: "MemberReferral",
              //   color: Colors.warning,
              // },
            ].map((q) => (
              <TouchableOpacity
                key={q.screen}
                style={s.quickCard}
                onPress={() => navigation.navigate(q.screen)}
                activeOpacity={0.75}
              >
                <View
                  style={[s.quickIcon, { backgroundColor: q.color + "18" }]}
                >
                  <Icon name={q.icon} size={20} color={q.color} />
                </View>
                <Text style={s.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  greeting: { color: Colors.textMuted, fontSize: Typography.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  streakBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  streakBadgeText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "800",
  },
  // Membership card
  membershipCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  membershipTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  planName: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 2,
  },
  gymMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  gymMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
  membershipRight: { alignItems: "flex-end", gap: 4 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  expiryText: { color: Colors.textMuted, fontSize: Typography.xs },
  expiryWarn: { color: Colors.warning },
  trainerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trainerText: { color: Colors.textMuted, fontSize: Typography.xs },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary + "20",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  checkInBtnDone: {
    backgroundColor: Colors.successFaded,
    borderColor: Colors.success + "40",
  },
  checkInText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  noGymCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  noGymTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  noGymSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  // Stats pills
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  // Cards
  card: {},
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  cardLink: { color: Colors.primary, fontSize: Typography.sm },
  streakMeta: { marginTop: Spacing.sm },
  streakMetaText: { color: Colors.textMuted, fontSize: Typography.xs },
  // Macros
  macroRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  macroPill: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: "center",
  },
  macroVal: { fontSize: Typography.sm, fontWeight: "800" },
  macroLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  viewDietBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  viewDietText: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  // Workout
  workoutCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  workoutCtaTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  workoutCtaSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  emptyInCard: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyInCardText: { color: Colors.textMuted, fontSize: Typography.sm },
  // Milestones
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  milestone: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    width: 80,
    gap: 4,
  },
  milestoneLbl: { color: Colors.textMuted, fontSize: 9, textAlign: "center" },
  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  quickCard: {
    width: (Dimensions.get("window").width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  // Activity
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: { color: Colors.primary, fontSize: Typography.sm },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  activityGym: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  activityTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: Colors.successFaded,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  // Expiry alert
  expiryAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  expiryAlertWarn: {
    backgroundColor: Colors.warning + "15",
    borderColor: Colors.warning + "40",
  },
  expiryAlertExpired: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error + "40",
  },
  expiryAlertTitle: {
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  expiryAlertSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  renewBtn: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  renewBtnWarn: {
    backgroundColor: Colors.warning + "15",
    borderColor: Colors.warning + "50",
  },
  renewBtnExpired: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error + "50",
  },
  renewBtnText: {
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  errorMessage: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
