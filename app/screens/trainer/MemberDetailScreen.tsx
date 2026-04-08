// app/screens/trainer/MemberDetailScreen.tsx
// Member detail screen for trainers. Shows tabs: Profile · Attendance · Workouts · Diets · Body Metrics
// Body Metrics navigates to BodyMetricsScreen (same stack).

import { membersApi } from "@/api/endpoints";
import { Card, Header, SkeletonGroup } from "@/components";
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

// ── Profile tab ────────────────────────────────────────────────────────────────

function ProfileRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={pr.row}>
      <View style={pr.iconWrap}>
        <Icon name={icon} size={15} color={Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={pr.label}>{label}</Text>
        <Text style={pr.value}>{value}</Text>
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  label: { color: Colors.textMuted, fontSize: Typography.xs },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 1,
  },
});

function ProfileTab({ member }: { member: any }) {
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}>
      {/* Avatar placeholder */}
      <View style={s.avatarWrap}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>
            {(member.fullName ?? "?")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={s.memberName}>{member.fullName}</Text>
        {member.gym?.name && (
          <Text style={s.gymName}>{member.gym.name}</Text>
        )}
        {member.status && (
          <View
            style={[
              s.statusBadge,
              {
                backgroundColor:
                  member.status === "ACTIVE"
                    ? Colors.successFaded
                    : Colors.warningFaded,
              },
            ]}
          >
            <Text
              style={[
                s.statusTxt,
                {
                  color:
                    member.status === "ACTIVE" ? Colors.success : Colors.warning,
                },
              ]}
            >
              {member.status}
            </Text>
          </View>
        )}
      </View>

      <Card style={{ gap: 0 }}>
        <ProfileRow icon="phone-outline" label="Mobile" value={member.mobileNumber} />
        <ProfileRow icon="email-outline" label="Email" value={member.email} />
        <ProfileRow icon="map-marker-outline" label="City" value={member.city} />
        <ProfileRow icon="gender-male-female" label="Gender" value={member.gender} />
        <ProfileRow icon="calendar-outline" label="Date of Birth" value={member.dateOfBirth} />
        <ProfileRow icon="water-outline" label="Blood Group" value={member.bloodGroup} />
        <ProfileRow icon="heart-outline" label="Health Conditions" value={member.healthConditions} />
        <ProfileRow icon="flag-outline" label="Fitness Goal" value={member.fitnessGoal} />
      </Card>
    </ScrollView>
  );
}

// ── Placeholder tab ────────────────────────────────────────────────────────────

function PlaceholderTab({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md }}>
      <Icon name={icon} size={48} color={Colors.border} />
      <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>{title}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function MemberDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { memberId, memberName } = route.params ?? {};

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const { data: member, isLoading } = useQuery<any>({
    queryKey: ["trainerMemberDetail", memberId],
    queryFn: () => membersApi.get(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60_000,
  });

  const displayName = member?.fullName ?? memberName ?? "Member";

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.headerWrap}>
        <Header title={displayName} back />
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
                  navigation.navigate("TrainerBodyMetrics", {
                    memberId,
                    memberName: displayName,
                  });
                } else {
                  setActiveTab(tab.key);
                }
              }}
              style={[s.tab, active && s.tabActive]}
            >
              <Icon
                name={tab.icon}
                size={14}
                color={active ? Colors.primary : Colors.textMuted}
              />
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={5} itemHeight={56} gap={Spacing.md} />
        </View>
      ) : activeTab === "profile" ? (
        <ProfileTab member={member ?? { fullName: displayName }} />
      ) : activeTab === "attendance" ? (
        <PlaceholderTab icon="calendar-check-outline" title="Attendance coming soon" />
      ) : activeTab === "workouts" ? (
        <PlaceholderTab icon="dumbbell" title="Workout history coming soon" />
      ) : activeTab === "diets" ? (
        <PlaceholderTab icon="food-apple-outline" title="Diet plans coming soon" />
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Tab bar
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  tabTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  tabTxtActive: { color: Colors.primary },

  // Avatar / member header
  avatarWrap: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary + "40",
  },
  avatarText: {
    color: Colors.primary,
    fontSize: Typography.xxl ?? 28,
    fontWeight: "800",
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  gymName: { color: Colors.textMuted, fontSize: Typography.sm },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusTxt: { fontSize: Typography.xs, fontWeight: "700" },
});
