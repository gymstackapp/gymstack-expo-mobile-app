import { trainerDashboardApi } from "@/api/endpoints";
import {
  Avatar,
  Card,
  NotificationBell,
  Skeleton,
  StatCard,
} from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

// ── Types ──────────────────────────────────────────────────────────────────────
interface AssignedMember {
  id: string;
  status: string;
  membershipPlan?: { name: string } | null;
  profile: { fullName: string; avatarUrl: string | null };
}

interface DashboardData {
  trainerName: string | null;
  gymName: string | null;
  expiringSoon: {
    id: string;
    endDate: string;
    profile: { fullName: string; avatarUrl: string | null };
  }[];
  membersNeedingAttention: {
    id: string;
    hasWorkoutPlan: boolean;
    hasDietPlan: boolean;
    profile: { fullName: string; avatarUrl: string | null };
  }[];
  recentAttendance: {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    member: { profile: { fullName: string; avatarUrl: string | null } };
  }[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    workoutPlans: number;
    dietPlans: number;
  } | null;
  trainer: {
    id: string | null;
    profile: { fullName: string | null; avatarUrl: string | null } | null;
    gym: { id: string | null; name: string | null; city: string | null } | null;
    assignedMembers: AssignedMember[] | null;
  } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const dy = Math.floor(diff / 86_400_000);
  if (dy > 0) return `${dy}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.max(0, m)}m ago`;
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();

  const { data, isLoading, error, refetch, isRefetching } =
    useQuery<DashboardData>({
      queryKey: ["trainerDashboard"],
      queryFn: trainerDashboardApi.get as () => Promise<DashboardData>,
      staleTime: 60_000,
    });

  const firstName =
    data?.trainerName?.split(" ")[0] ??
    profile?.fullName?.split(" ")[0] ??
    "there";

  const stats = data?.stats;
  const expiringSoon = data?.expiringSoon ?? [];
  const attention = data?.membersNeedingAttention ?? [];
  const recentAttendance = data?.recentAttendance ?? [];
  const assignedMembers = data?.trainer?.assignedMembers ?? [];

  const QUICK_ACTIONS = [
    {
      icon: "calendar-check-outline",
      label: "Attendance",
      color: "#34d399",
      screen: "TrainerAttendance",
    },
    {
      icon: "dumbbell",
      label: "Workouts",
      color: "#c084fc",
      screen: "TrainerWorkouts",
    },
    {
      icon: "food-apple-outline",
      label: "Diet Plans",
      color: "#fb923c",
      screen: "TrainerDiets",
    },
    {
      icon: "account-group-outline",
      label: "Members",
      color: "#60a5fa",
      screen: "Members",
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {error ? (
        <View style={s.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={s.errorTitle}>Failed to load dashboard</Text>
          <Text style={s.errorMessage}>
            {(error as any)?.message ??
              "Something went wrong. Please try again."}
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
          {/* ── Header ──────────────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.menuBtn}
            >
              <Icon name="menu" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>Good {getGreeting()} 👋</Text>
              <Text style={s.name}>{firstName}</Text>
              {/* {data?.gymName && (
                <Text style={s.gymSub}>{data.gymName} · Trainer</Text>
              )} */}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.sm,
              }}
            >
              <NotificationBell />
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Avatar
                  name={profile?.fullName ?? "T"}
                  url={profile?.avatarUrl}
                  size={42}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <Skeleton height={110} style={{ marginBottom: Spacing.lg }} />
          ) : (
            <View style={s.membershipCard}>
              <View style={s.membershipTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.gymName}>{data?.trainer?.gym?.name}</Text>
                  <View style={s.gymMeta}>
                    <Icon
                      name="map-marker-outline"
                      size={12}
                      color="rgba(255,255,255,0.6)"
                    />
                    <Text style={s.gymMetaText}>
                      {data?.trainer?.gym?.name}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Stats ───────────────────────────────────────── */}
          {isLoading ? (
            <View style={s.statsGrid}>
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  height={88}
                  style={{
                    flex: 1,
                    minWidth: (SW - Spacing.lg * 2 - Spacing.md) / 2,
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={s.statsGrid}>
              <StatCard
                icon="account-group-outline"
                label="Total Members"
                value={stats?.totalMembers ?? 0}
                color={Colors.primary}
                bg={Colors.primaryFaded}
                style={{
                  flex: 1,
                  minWidth: (SW - Spacing.lg * 2 - Spacing.md) / 2,
                }}
              />
              <StatCard
                icon="check-circle-outline"
                label="Active Members"
                value={stats?.activeMembers ?? 0}
                color={Colors.success}
                bg={Colors.successFaded}
                style={{
                  flex: 1,
                  minWidth: (SW - Spacing.lg * 2 - Spacing.md) / 2,
                }}
              />
              <StatCard
                icon="dumbbell"
                label="Workout Plans"
                value={stats?.workoutPlans ?? 0}
                color="#c084fc"
                bg="#c084fc20"
                style={{
                  flex: 1,
                  minWidth: (SW - Spacing.lg * 2 - Spacing.md) / 2,
                }}
              />
              <StatCard
                icon="food-apple-outline"
                label="Diet Plans"
                value={stats?.dietPlans ?? 0}
                color="#fb923c"
                bg="#fb923c20"
                style={{
                  flex: 1,
                  minWidth: (SW - Spacing.lg * 2 - Spacing.md) / 2,
                }}
              />
            </View>
          )}

          {/* ── Expiring Soon ────────────────────────────────── */}
          {!isLoading && expiringSoon.length > 0 && (
            <View style={s.expiryAlert}>
              <View style={s.expiryAlertHeader}>
                <Icon
                  name="clock-alert-outline"
                  size={15}
                  color={Colors.warning}
                />
                <Text style={s.expiryAlertTitle}>
                  Memberships Expiring Soon
                </Text>
              </View>
              <View style={s.expiryChips}>
                {expiringSoon.map((m) => {
                  const days = Math.ceil(
                    (new Date(m.endDate).getTime() - Date.now()) / 86_400_000,
                  );
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={s.expiryChip}
                      onPress={() =>
                        navigation.navigate("TrainerMemberDetail", {
                          memberId: m.id,
                        })
                      }
                      activeOpacity={0.75}
                    >
                      <Avatar
                        name={m.profile.fullName}
                        url={m.profile.avatarUrl}
                        size={28}
                      />
                      <View>
                        <Text style={s.expiryChipName} numberOfLines={1}>
                          {m.profile.fullName}
                        </Text>
                        <Text style={s.expiryChipDays}>
                          {days <= 0 ? "Expires today" : `${days}d left`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Two-column: Needs Attention + Recent Check-ins ── */}
          <View style={s.twoCol}>
            {/* Needs Attention */}
            <Card style={{ flex: 1 }}>
              <View style={s.cardHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Icon
                    name="alert-circle-outline"
                    size={14}
                    color={Colors.warning}
                  />
                  <Text style={s.cardTitle}>Needs Attention</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Members")}
                >
                  <Text style={s.seeAll}>View all</Text>
                </TouchableOpacity>
              </View>
              {isLoading ? (
                <View style={{ gap: Spacing.sm }}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </View>
              ) : attention.length === 0 ? (
                <View style={s.emptyCard}>
                  <Icon
                    name="check-circle-outline"
                    size={24}
                    color={Colors.success}
                  />
                  <Text style={s.emptyCardTxt}>All members are set up</Text>
                </View>
              ) : (
                <View style={{ gap: 2 }}>
                  {attention.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={s.listRow}
                      onPress={() =>
                        navigation.navigate("TrainerMemberDetail", {
                          memberId: m.id,
                        })
                      }
                      activeOpacity={0.75}
                    >
                      <Avatar
                        name={m.profile.fullName}
                        url={m.profile.avatarUrl}
                        size={32}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <Text style={s.listName} numberOfLines={1}>
                          {m.profile.fullName}
                        </Text>
                        <View style={s.tagRow}>
                          {!m.hasWorkoutPlan && (
                            <View
                              style={[s.tag, { backgroundColor: "#fb923c20" }]}
                            >
                              <Text style={[s.tagTxt, { color: "#fb923c" }]}>
                                No workout
                              </Text>
                            </View>
                          )}
                          {!m.hasDietPlan && (
                            <View
                              style={[s.tag, { backgroundColor: "#60a5fa20" }]}
                            >
                              <Text style={[s.tagTxt, { color: "#60a5fa" }]}>
                                No diet
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={14}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            {/* Recent Check-ins */}
            <Card style={{ flex: 1 }}>
              <View style={s.cardHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Icon
                    name="calendar-check-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={s.cardTitle}>Recent Check-ins</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("TrainerAttendance")}
                >
                  <Text style={s.seeAll}>View all</Text>
                </TouchableOpacity>
              </View>
              {isLoading ? (
                <View style={{ gap: Spacing.sm }}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </View>
              ) : recentAttendance.length === 0 ? (
                <View style={s.emptyCard}>
                  <Icon
                    name="calendar-check-outline"
                    size={24}
                    color={Colors.textMuted}
                  />
                  <Text style={s.emptyCardTxt}>No recent check-ins</Text>
                </View>
              ) : (
                <View style={{ gap: 2 }}>
                  {recentAttendance.map((r) => {
                    const durationMin = r.checkOutTime
                      ? Math.round(
                          (new Date(r.checkOutTime).getTime() -
                            new Date(r.checkInTime).getTime()) /
                            60_000,
                        )
                      : null;
                    return (
                      <View key={r.id} style={s.listRow}>
                        <Avatar
                          name={r.member.profile.fullName}
                          url={r.member.profile.avatarUrl}
                          size={32}
                        />
                        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                          <Text style={s.listName} numberOfLines={1}>
                            {r.member.profile.fullName}
                          </Text>
                          <Text style={s.listSub}>
                            {timeAgo(r.checkInTime)}
                          </Text>
                        </View>
                        {durationMin !== null ? (
                          <Text style={s.durationTxt}>{durationMin}m</Text>
                        ) : (
                          <View style={s.inGymBadge}>
                            <Text style={s.inGymTxt}>In gym</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>

          {/* ── My Members ───────────────────────────────────── */}
          {!isLoading && assignedMembers.length > 0 && (
            <Card>
              <View style={s.cardHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Icon
                    name="account-group-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={s.cardTitle}>My Members</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Members")}
                >
                  <Text style={s.seeAll}>View all</Text>
                </TouchableOpacity>
              </View>
              <View style={s.membersGrid}>
                {assignedMembers.slice(0, 6).map((m) => {
                  const statusColor =
                    m.status === "ACTIVE"
                      ? Colors.success
                      : m.status === "EXPIRED"
                        ? Colors.error
                        : Colors.warning;
                  const statusBg =
                    m.status === "ACTIVE"
                      ? Colors.successFaded
                      : m.status === "EXPIRED"
                        ? Colors.errorFaded
                        : Colors.warningFaded;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={s.memberCard}
                      onPress={() =>
                        navigation.navigate("TrainerMemberDetail", {
                          memberId: m.id,
                        })
                      }
                      activeOpacity={0.75}
                    >
                      <Avatar
                        name={m.profile.fullName}
                        url={m.profile.avatarUrl}
                        size={36}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.listName} numberOfLines={1}>
                          {m.profile.fullName}
                        </Text>
                        <Text style={s.listSub} numberOfLines={1}>
                          {m.membershipPlan?.name ?? "No plan"}
                        </Text>
                      </View>
                      <View
                        style={[s.statusBadge, { backgroundColor: statusBg }]}
                      >
                        <Text style={[s.statusTxt, { color: statusColor }]}>
                          {m.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {/* ── Quick Actions ────────────────────────────────── */}
          <Text style={s.sectionCap}>QUICK ACTIONS</Text>
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map((q) => (
              <TouchableOpacity
                key={q.screen}
                style={s.quickCard}
                onPress={() => navigation.navigate(q.screen as any)}
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

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { color: Colors.textMuted, fontSize: Typography.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  gymSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  // Expiry alert
  expiryAlert: {
    backgroundColor: Colors.warning + "12",
    borderWidth: 1,
    borderColor: Colors.warning + "35",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  expiryAlertHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  expiryAlertTitle: {
    color: Colors.warning,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  expiryChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  expiryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.warning + "18",
    borderWidth: 1,
    borderColor: Colors.warning + "25",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  expiryChipName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  expiryChipDays: { color: Colors.warning, fontSize: 10, marginTop: 1 },
  // Cards
  twoCol: { flexDirection: "column", gap: Spacing.md },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  seeAll: { color: Colors.primary, fontSize: Typography.xs },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyCardTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  // List rows
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "60",
  },
  listName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  listSub: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  tagTxt: { fontSize: 9, fontWeight: "700" },
  durationTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  inGymBadge: {
    backgroundColor: Colors.successFaded,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  inGymTxt: { color: Colors.success, fontSize: 9, fontWeight: "700" },
  // My Members grid
  membersGrid: { gap: Spacing.sm },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusTxt: { fontSize: 9, fontWeight: "700" },
  // Quick actions
  sectionCap: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  quickCard: {
    width: (SW - Spacing.lg * 2 - Spacing.sm) / 2,
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
  // Error
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
});
