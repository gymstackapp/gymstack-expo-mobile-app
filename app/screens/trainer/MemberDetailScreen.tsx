// app/screens/trainer/MemberDetailScreen.tsx
// Full member detail for trainers: Profile · Attendance · Workout Plans · Diet Plans · Body Metrics

import { trainerMembersApi } from "@/api/endpoints";
import { Avatar, Card, Header, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
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

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "profile" | "attendance" | "workouts" | "diets" | "metrics";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "profile",    label: "Profile",    icon: "account-outline" },
  { key: "attendance", label: "Attendance", icon: "calendar-check-outline" },
  { key: "workouts",   label: "Workouts",   icon: "dumbbell" },
  { key: "diets",      label: "Diets",      icon: "food-apple-outline" },
  { key: "metrics",    label: "Metrics",    icon: "human-male-height" },
];

function statusStyle(status: string) {
  if (status === "ACTIVE") return { bg: Colors.successFaded, fg: Colors.success };
  if (status === "EXPIRED") return { bg: Colors.errorFaded, fg: Colors.error };
  return { bg: Colors.warningFaded, fg: Colors.warning };
}

function daysLeft(endDate: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

function fmtDuration(ci: string, co: string) {
  const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60_000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

function ProfileRow({ icon, color = Colors.textMuted, label, value }: { icon: string; color?: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={pr.row}>
      <Icon name={icon} size={15} color={color} style={{ marginTop: 1 }} />
      <View style={pr.textWrap}>
        <Text style={pr.label}>{label}</Text>
        <Text style={pr.value}>{value}</Text>
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  textWrap: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { color: Colors.textMuted, fontSize: Typography.xs },
  value: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600", textAlign: "right", maxWidth: "65%" },
});

function ProfileTab({ member }: { member: any }) {
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.md }}>
      <Card style={{ gap: 0 }}>
        <ProfileRow icon="phone-outline"       color="#4ade80" label="Phone"        value={member.profile?.mobileNumber} />
        <ProfileRow icon="email-outline"       color={Colors.primary}  label="Email"        value={member.profile?.email} />
        <ProfileRow icon="gender-male-female"  color="#60a5fa" label="Gender"       value={member.profile?.gender?.toUpperCase()} />
        <ProfileRow icon="calendar-outline"    color={Colors.primary}  label="Date of Birth"
          value={member.profile?.dateOfBirth ? new Date(member.profile.dateOfBirth).toLocaleDateString("en-IN", { dateStyle: "medium" }) : null} />
        <ProfileRow icon="map-marker-outline"  color="#60a5fa" label="City"         value={member.profile?.city} />
        <ProfileRow icon="human-male-height"   color="#60a5fa" label="Height"       value={member.heightCm ? `${member.heightCm} cm` : null} />
        <ProfileRow icon="weight"              color="#60a5fa" label="Weight"       value={member.weightKg ? `${member.weightKg} kg` : null} />
        {member.medicalNotes && (
          <View style={{ paddingTop: Spacing.md }}>
            <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>Medical Notes</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 4 }}>{member.medicalNotes}</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

// ── Attendance Tab ─────────────────────────────────────────────────────────────

function AttendanceTab({ member }: { member: any }) {
  const records = member.attendance ?? [];
  if (records.length === 0) {
    return (
      <View style={t.empty}>
        <Icon name="calendar-check-outline" size={40} color={Colors.border} />
        <Text style={t.emptyTxt}>No attendance records yet</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={t.tableHeader}>
          <Text style={[t.colHead, { flex: 2 }]}>CHECK IN</Text>
          <Text style={[t.colHead, { flex: 1.5 }]}>CHECK OUT</Text>
          <Text style={[t.colHead, { flex: 1, textAlign: "right" }]}>DUR.</Text>
        </View>
        {records.map((a: any, i: number) => {
          const dur = a.checkOutTime ? fmtDuration(a.checkInTime, a.checkOutTime) : null;
          return (
            <View key={a.id} style={[t.tableRow, i < records.length - 1 && t.rowBorder]}>
              <Text style={[t.cell, { flex: 2 }]}>
                {new Date(a.checkInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </Text>
              <Text style={[t.cell, { flex: 1.5 }]}>
                {a.checkOutTime
                  ? new Date(a.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" })
                  : <Text style={{ color: Colors.success, fontSize: Typography.xs }}>In gym</Text>}
              </Text>
              <Text style={[t.cell, { flex: 1, textAlign: "right" }]}>{dur ?? "—"}</Text>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

// ── Workouts Tab ───────────────────────────────────────────────────────────────

const DIFF_COLORS: Record<string, { bg: string; fg: string }> = {
  BEGINNER:     { bg: Colors.successFaded, fg: Colors.success },
  INTERMEDIATE: { bg: Colors.warningFaded, fg: Colors.warning },
  ADVANCED:     { bg: Colors.errorFaded,   fg: Colors.error },
};

function WorkoutsTab({ member, memberId }: { member: any; memberId: string }) {
  const navigation = useNavigation<any>();
  const plans = member.workoutPlans ?? [];
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.md }}>
      <TouchableOpacity
        style={wt.createBtn}
        onPress={() => navigation.navigate("TrainerWorkouts", { memberId })}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={14} color={Colors.primary} />
        <Text style={wt.createTxt}>Create Workout Plan</Text>
      </TouchableOpacity>
      {plans.length === 0 ? (
        <View style={t.empty}>
          <Icon name="dumbbell" size={40} color={Colors.border} />
          <Text style={t.emptyTxt}>No workout plans yet</Text>
        </View>
      ) : (
        plans.map((p: any) => {
          const dc = DIFF_COLORS[p.difficulty] ?? DIFF_COLORS.BEGINNER;
          return (
            <Card key={p.id} style={{ gap: Spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700", flex: 1, marginRight: Spacing.sm }}>{p.title}</Text>
                <View style={[wt.diffBadge, { backgroundColor: dc.bg }]}>
                  <Text style={[wt.diffTxt, { color: dc.fg }]}>{p.difficulty}</Text>
                </View>
              </View>
              {p.goal && <Text style={{ color: Colors.primary + "BB", fontSize: Typography.xs }}>🎯 {p.goal}</Text>}
              <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>
                {new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const wt = StyleSheet.create({
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  createTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  diffBadge: { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  diffTxt: { fontSize: 10, fontWeight: "700" },
});

// ── Diets Tab ──────────────────────────────────────────────────────────────────

function DietsTab({ member, memberId }: { member: any; memberId: string }) {
  const navigation = useNavigation<any>();
  const plans = member.dietPlans ?? [];
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.md }}>
      <TouchableOpacity
        style={wt.createBtn}
        onPress={() => navigation.navigate("TrainerDiets", { memberId })}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={14} color={Colors.primary} />
        <Text style={wt.createTxt}>Create Diet Plan</Text>
      </TouchableOpacity>
      {plans.length === 0 ? (
        <View style={t.empty}>
          <Icon name="food-apple-outline" size={40} color={Colors.border} />
          <Text style={t.emptyTxt}>No diet plans yet</Text>
        </View>
      ) : (
        plans.map((p: any) => (
          <Card key={p.id} style={{ gap: Spacing.xs }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700", flex: 1 }}>{p.title}</Text>
              {p.caloriesTarget && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Icon name="fire" size={12} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" }}>{p.caloriesTarget} kcal</Text>
                </View>
              )}
            </View>
            {p.goal && <Text style={{ color: Colors.primary + "BB", fontSize: Typography.xs }}>🎯 {p.goal}</Text>}
            {(p.proteinG || p.carbsG || p.fatG) && (
              <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
                {p.proteinG && <Text style={dt.macro}>P {p.proteinG}g</Text>}
                {p.carbsG   && <Text style={[dt.macro, { color: "#eab308", backgroundColor: "#eab30815" }]}>C {p.carbsG}g</Text>}
                {p.fatG     && <Text style={[dt.macro, { color: "#f87171", backgroundColor: "#f8717115" }]}>F {p.fatG}g</Text>}
              </View>
            )}
            <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>
              {new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const dt = StyleSheet.create({
  macro: {
    color: "#60a5fa",
    backgroundColor: "#60a5fa15",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

// ── Shared styles ──────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colHead: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  cell: { color: Colors.textSecondary, fontSize: Typography.xs },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function MemberDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { memberId, memberName } = route.params ?? {};

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const { data: member, isLoading } = useQuery<any>({
    queryKey: ["trainerMemberDetail", memberId],
    queryFn: () => trainerMembersApi.get(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60_000,
  });

  const displayName = member?.profile?.fullName ?? memberName ?? "Member";
  const days = daysLeft(member?.endDate ?? null);
  const isExpired = member?.status === "EXPIRED" || (days !== null && days < 0);
  const ss = statusStyle(member?.status ?? "ACTIVE");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header title={displayName} back />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Skeleton height={120} />
          <Skeleton height={48} />
          <Skeleton height={200} />
        </View>
      ) : (
        <>
          {/* Hero card */}
          <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
            <Card style={{ gap: Spacing.md }}>
              <View style={s.heroTop}>
                <Avatar name={displayName} url={member?.profile?.avatarUrl} size={68} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" }}>
                    <Text style={s.heroName}>{displayName}</Text>
                    {member?.status && (
                      <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
                        <Text style={[s.statusTxt, { color: ss.fg }]}>{member.status}</Text>
                      </View>
                    )}
                  </View>
                  {member?.profile?.email && (
                    <Text style={s.heroSub}>{member.profile.email}</Text>
                  )}
                  {member?.gym?.name && (
                    <Text style={s.heroSub}>{member.gym.name}</Text>
                  )}
                </View>
              </View>

              <View style={s.planBar}>
                <View style={s.planCell}>
                  <Text style={s.planLabel}>Plan</Text>
                  <Text style={s.planValue} numberOfLines={1}>{member?.membershipPlan?.name ?? "—"}</Text>
                </View>
                <View style={s.planDivider} />
                <View style={s.planCell}>
                  <Text style={s.planLabel}>Joined</Text>
                  <Text style={s.planValue}>
                    {member?.startDate
                      ? new Date(member.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </Text>
                </View>
                <View style={s.planDivider} />
                <View style={s.planCell}>
                  <Text style={s.planLabel}>Expires</Text>
                  <Text style={[s.planValue, isExpired ? { color: Colors.error } : days !== null && days <= 7 ? { color: Colors.warning } : {}]}>
                    {member?.endDate
                      ? isExpired ? "Expired" : `${days}d left`
                      : "No expiry"}
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Tab bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.tabBar}
            contentContainerStyle={s.tabBarContent}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    if (tab.key === "metrics") {
                      navigation.navigate("TrainerBodyMetrics", { memberId, memberName: displayName });
                    } else {
                      setActiveTab(tab.key);
                    }
                  }}
                  style={[s.tab, active && s.tabActive]}
                >
                  <Icon name={tab.icon} size={13} color={active ? Colors.primary : Colors.textMuted} />
                  <Text style={[s.tabTxt, active && s.tabTxtActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content */}
          {activeTab === "profile"    && <ProfileTab member={member} />}
          {activeTab === "attendance" && <AttendanceTab member={member} />}
          {activeTab === "workouts"   && <WorkoutsTab member={member} memberId={memberId} />}
          {activeTab === "diets"      && <DietsTab member={member} memberId={memberId} />}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  heroTop: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  heroName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  heroSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusTxt: { fontSize: 10, fontWeight: "700" },
  planBar: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  planCell: { flex: 1, alignItems: "center" },
  planDivider: { width: 1, backgroundColor: Colors.border },
  planLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  planValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600", marginTop: 2 },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.xs },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  tabTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  tabTxtActive: { color: Colors.primary },
});
