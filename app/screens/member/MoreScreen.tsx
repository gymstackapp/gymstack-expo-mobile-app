// mobile/src/screens/member/MoreScreen.tsx
import { memberBodyMetricsApi, memberNotificationsApi } from "@/api/endpoints";
import { Avatar, Card } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface MenuItem {
  icon: string;
  label: string;
  screen: string;
  color: string;
  badge?: boolean;
  desc?: string;
}

const MENU_SECTIONS = [
  {
    title: "My Activity",
    items: [
      {
        icon: "calendar-check-outline",
        label: "Attendance",
        screen: "MemberAttendance",
        color: Colors.info,
        desc: "Check-in history & streaks",
      },
      {
        icon: "credit-card-outline",
        label: "Payments",
        screen: "MemberPayments",
        color: Colors.success,
        desc: "Transaction history",
      },
      {
        icon: "bell-outline",
        label: "Notifications",
        screen: "MemberNotifications",
        color: Colors.primary,
        desc: "Alerts & announcements",
        badge: true,
      },
    ] as MenuItem[],
  },
  {
    title: "Rewards",
    items: [
      {
        icon: "gift-outline",
        label: "Refer & Earn",
        screen: "MemberReferral",
        color: Colors.warning,
        desc: "Earn ₹100 per referral",
      },
    ] as MenuItem[],
  },
  {
    title: "Account",
    items: [
      {
        icon: "account-outline",
        label: "My Profile",
        screen: "Profile",
        color: Colors.purple,
        desc: "Edit your details",
      },
    ] as MenuItem[],
  },
];

// ── My Progress helpers ────────────────────────────────────────────────────────

function ProgressTrend({
  current,
  previous,
  lowerIsBetter = false,
}: {
  current?: number | null;
  previous?: number | null;
  lowerIsBetter?: boolean;
}) {
  if (current == null || previous == null || current === previous) return null;
  const up = current > previous;
  const good = lowerIsBetter ? !up : up;
  const color = good ? Colors.success : Colors.error;
  const icon = up ? "↑" : "↓";
  return (
    <Text style={{ color, fontSize: 10, fontWeight: "700", marginLeft: 2 }}>
      {icon}
    </Text>
  );
}

function ProgressMetric({
  label,
  value,
  unit,
  current,
  previous,
  lowerIsBetter,
}: {
  label: string;
  value?: number | null;
  unit?: string;
  current?: number | null;
  previous?: number | null;
  lowerIsBetter?: boolean;
}) {
  if (value == null) return null;
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: Typography.lg,
            fontWeight: "800",
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginLeft: 2 }}>
            {unit}
          </Text>
        )}
        <ProgressTrend current={current} previous={previous} lowerIsBetter={lowerIsBetter} />
      </View>
      <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function MemberMoreScreen() {
  const navigation = useNavigation<any>();
  const { profile, logout } = useAuthStore();

  const { data: bodyMetrics = [] } = useQuery<any[]>({
    queryKey: ["memberBodyMetrics"],
    queryFn: () => memberBodyMetricsApi.list() as Promise<any[]>,
    staleTime: 5 * 60_000,
  });

  const latestMetric = (bodyMetrics as any[])[0];
  const prevMetric = (bodyMetrics as any[])[1];
  const hasMetrics = latestMetric != null;

  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: () =>
      memberNotificationsApi.unreadCount?.() as Promise<{ count: number }>,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const unreadCount = (unreadData as any)?.count ?? 0;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.titleRow}>
        <Text style={s.screenTitle}>More</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <Avatar
            name={profile?.fullName ?? "?"}
            url={profile?.avatarUrl}
            size={56}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile?.fullName ?? "Member"}</Text>
            <Text style={s.profileEmail} numberOfLines={1}>
              {profile?.email}
            </Text>
            {profile?.city && (
              <View style={s.profileCity}>
                <Icon
                  name="map-marker-outline"
                  size={11}
                  color={Colors.textMuted}
                />
                <Text style={s.profileCityText}>{profile.city}</Text>
              </View>
            )}
          </View>
          <View style={s.profileArrow}>
            <Icon name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* My Progress */}
        {hasMetrics && (
          <View>
            <Text style={s.sectionTitle}>My Progress</Text>
            <Card>
              <View style={{ flexDirection: "row", marginBottom: Spacing.sm }}>
                <ProgressMetric
                  label="Weight"
                  value={latestMetric.weight}
                  unit="kg"
                  current={latestMetric.weight}
                  previous={prevMetric?.weight}
                />
                <ProgressMetric
                  label="Body Fat"
                  value={latestMetric.bodyFatPercent}
                  unit="%"
                  current={latestMetric.bodyFatPercent}
                  previous={prevMetric?.bodyFatPercent}
                  lowerIsBetter
                />
                <ProgressMetric
                  label="BMI"
                  value={latestMetric.bmi}
                  current={latestMetric.bmi}
                  previous={prevMetric?.bmi}
                  lowerIsBetter
                />
                <ProgressMetric
                  label="Muscle"
                  value={latestMetric.muscleMass}
                  unit="kg"
                  current={latestMetric.muscleMass}
                  previous={prevMetric?.muscleMass}
                />
              </View>
              {(latestMetric.chestCm || latestMetric.waistCm || latestMetric.hipsCm) ? (
                <View
                  style={{
                    flexDirection: "row",
                    paddingTop: Spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                  }}
                >
                  <ProgressMetric label="Chest" value={latestMetric.chestCm} unit="cm" />
                  <ProgressMetric label="Waist" value={latestMetric.waistCm} unit="cm" />
                  <ProgressMetric label="Hips" value={latestMetric.hipsCm} unit="cm" />
                </View>
              ) : null}
              {latestMetric.date && (
                <Text
                  style={{
                    color: Colors.textMuted,
                    fontSize: 10,
                    marginTop: Spacing.sm,
                    textAlign: "center",
                  }}
                >
                  Last recorded{" "}
                  {new Date(latestMetric.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Card style={s.menuCard}>
              {section.items.map((item, i) => {
                const showBadge = item.badge && unreadCount > 0;
                const isLast = i === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[s.menuRow, !isLast && s.menuRowBorder]}
                    onPress={() => navigation.navigate(item.screen)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        s.menuIcon,
                        { backgroundColor: item.color + "18" },
                      ]}
                    >
                      <Icon name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      {item.desc && <Text style={s.menuDesc}>{item.desc}</Text>}
                    </View>
                    {showBadge && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}

        {/* App info */}
        <Card style={s.infoCard}>
          <View style={s.infoRow}>
            <Icon
              name="information-outline"
              size={16}
              color={Colors.textMuted}
            />
            <Text style={s.infoText}>GymStack v1.0.0</Text>
          </View>
          <View style={[s.infoRow, { marginTop: 6 }]}>
            <Icon
              name="shield-check-outline"
              size={16}
              color={Colors.textMuted}
            />
            <Text style={s.infoText}>Your data is encrypted and secure</Text>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  titleRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  profileEmail: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  profileCity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  profileCityText: { color: Colors.textMuted, fontSize: Typography.xs },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  menuCard: { padding: 0, overflow: "hidden" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  menuDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  infoText: { color: Colors.textMuted, fontSize: Typography.xs },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
});
