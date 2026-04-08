// app/navigation/OwnerDrawerContent.tsx
// Custom drawer sidebar — mirrors the web admin sidebar design.

import { Avatar } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useSubscription } from "@/hooks/useSubsciption";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface NavItem {
  icon: string;
  label: string;
  screen: string;
  tab?: string; // if set, navigate into the tab
}

const NAV_ITEMS: NavItem[] = [
  {
    icon: "view-dashboard-outline",
    label: "Dashboard",
    screen: "MainTabs",
    tab: "Dashboard",
  },
  { icon: "dumbbell", label: "Gyms", screen: "MainTabs", tab: "Gyms" },
  {
    icon: "account-group-outline",
    label: "Members",
    screen: "MainTabs",
    tab: "Members",
  },
  { icon: "account-tie-outline", label: "Trainers", screen: "OwnerTrainers" },
  {
    icon: "calendar-check-outline",
    label: "Attendance",
    screen: "OwnerAttendance",
  },
  { icon: "credit-card-outline", label: "Payments", screen: "OwnerPayments" },
  {
    icon: "shopping-outline",
    label: "Supplements",
    screen: "OwnerSupplements",
  },
  {
    icon: "clipboard-list-outline",
    label: "Workout Plans",
    screen: "OwnerWorkouts",
  },
  { icon: "food-apple-outline", label: "Diet Plans", screen: "OwnerDiets" },
  { icon: "lock-outline", label: "Lockers", screen: "OwnerLockers" },
  {
    icon: "currency-rupee",
    label: "Expenses",
    screen: "OwnerExpenses",
  },
  // { icon: "gift-outline", label: "Refer & Earn", screen: "OwnerReferral" },
  {
    icon: "bell-outline",
    label: "Notifications",
    screen: "OwnerNotifications",
  },
  { icon: "chart-bar", label: "Reports", screen: "OwnerReports" },
  { icon: "lightning-bolt-outline", label: "Billing", screen: "OwnerBilling" },
  {
    icon: "account-circle-outline",
    label: "Settings",
    screen: "MainTabs",
    tab: "Profile",
  },
];

export function OwnerDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { profile, logout } = useAuthStore();
  const { subscription, usage, limits } = useSubscription();
  const insets = useSafeAreaInsets();

  const activeRouteName = props.state.routes[props.state.index].name;

  // For tab items, detect which tab is active inside MainTabs
  const getActiveTab = (): string | null => {
    if (activeRouteName !== "MainTabs") return null;
    const mainTabsRoute = props.state.routes.find((r) => r.name === "MainTabs");
    const tabState = mainTabsRoute?.state as any;
    if (!tabState) return "Dashboard"; // default
    const idx = tabState.index ?? 0;
    return tabState.routes?.[idx]?.name ?? "Dashboard";
  };

  const activeTab = getActiveTab();

  const isActive = (item: NavItem) => {
    if (item.screen === "MainTabs") {
      return activeRouteName === "MainTabs" && activeTab === item.tab;
    }
    return activeRouteName === item.screen;
  };

  const onPress = (item: NavItem) => {
    if (item.screen === "MainTabs" && item.tab) {
      (navigation as any).navigate("MainTabs", { screen: item.tab });
    } else {
      (navigation as any).navigate(item.screen);
    }
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const onLogout = () => {
    showAlert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined ? "∞" : String(n);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Brand header ─────────────────────────────────────── */}
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Icon name="dumbbell" size={20} color="#fff" />
        </View>
        <Text style={styles.brandName}>GymStack</Text>
      </View>

      {/* ── Nav items ─────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.menuLabel}>MENU</Text>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => onPress(item)}
              activeOpacity={0.7}
            >
              <Icon
                name={item.icon}
                size={18}
                color={active ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Subscription info ─────────────────────────────────── */}
      {subscription && (
        <View style={styles.subBox}>
          <View style={styles.subHeader}>
            <Icon name="crown-outline" size={14} color={Colors.primary} />
            <Text style={styles.subPlan}>{subscription.planName}</Text>
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>{subscription.planName}</Text>
            </View>
          </View>
          <View style={styles.subLimits}>
            {[
              { label: "Gyms", used: usage?.gyms, max: limits?.maxGyms },
              {
                label: "Members",
                used: usage?.members,
                max: limits?.maxMembers,
              },
              {
                label: "Trainers",
                used: usage?.trainers,
                max: limits?.maxTrainers,
              },
              {
                label: "Plans",
                used: usage?.membershipPlans,
                max: limits?.maxMembershipPlans,
              },
            ].map(({ label, used, max }) => (
              <View key={label} style={styles.subLimitRow}>
                <Text style={styles.subLimitLabel}>{label}</Text>
                <Text style={styles.subLimitValue}>
                  {fmt(max) === "∞" ? "∞ Unlimited" : `${used ?? 0} / ${max}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── User row + logout ─────────────────────────────────── */}
      <View style={styles.userRow}>
        <Avatar
          name={profile?.fullName ?? "O"}
          url={profile?.avatarUrl}
          size={34}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.fullName}
          </Text>
          <Text style={styles.userRole}>
            {profile?.role
              ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
              : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: Colors.primaryFaded },
  navLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  navLabelActive: { color: Colors.primary, fontWeight: Typography.semibold },

  // Subscription box
  subBox: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  subPlan: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    flex: 1,
  },
  subBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  subBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: Typography.semibold,
  },
  subLimits: { gap: 4 },
  subLimitRow: { flexDirection: "row", justifyContent: "space-between" },
  subLimitLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  subLimitValue: { color: Colors.textSecondary, fontSize: Typography.xs },

  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  userInfo: { flex: 1 },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  userRole: { color: Colors.textMuted, fontSize: Typography.xs },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorFaded,
    alignItems: "center",
    justifyContent: "center",
  },
});
