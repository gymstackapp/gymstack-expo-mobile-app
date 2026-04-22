// app/navigation/TrainerDrawerContent.tsx
import { Avatar } from "@/components";
import { showAlert } from "@/components/AppAlert";
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
  tab?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "view-dashboard-outline", label: "Dashboard", screen: "TrainerTabs", tab: "Dashboard" },
  { icon: "account-group-outline", label: "Members", screen: "TrainerTabs", tab: "Members" },
  { icon: "office-building-outline", label: "My Gyms", screen: "TrainerGyms" },
  { icon: "compass-outline", label: "Discover Gyms", screen: "TrainerDiscover" },
  { icon: "calendar-check-outline", label: "Attendance", screen: "TrainerAttendance" },
  { icon: "bell-outline", label: "Notifications", screen: "TrainerNotifications" },
  { icon: "account-circle-outline", label: "Profile", screen: "TrainerTabs", tab: "Profile" },
];

export function TrainerDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { profile, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const activeRouteName = props.state.routes[props.state.index].name;

  const getActiveTab = (): string | null => {
    if (activeRouteName !== "TrainerTabs") return null;
    const tabsRoute = props.state.routes.find((r) => r.name === "TrainerTabs");
    const tabState = (tabsRoute?.state as any);
    if (!tabState) return "Dashboard";
    return tabState.routes?.[tabState.index ?? 0]?.name ?? "Dashboard";
  };

  const activeTab = getActiveTab();

  const isActive = (item: NavItem) => {
    if (item.screen === "TrainerTabs") {
      return activeRouteName === "TrainerTabs" && activeTab === item.tab;
    }
    return activeRouteName === item.screen;
  };

  const onPress = (item: NavItem) => {
    if (item.screen === "TrainerTabs" && item.tab) {
      (navigation as any).navigate("TrainerTabs", { screen: item.tab });
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

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Icon name="dumbbell" size={20} color="#fff" />
        </View>
        <Text style={styles.brandName}>GymStack</Text>
      </View>

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

      <View style={styles.userRow}>
        <Avatar name={profile?.fullName ?? "T"} url={profile?.avatarUrl} size={34} />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{profile?.fullName}</Text>
          <Text style={styles.userRole}>Trainer</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface, borderRightWidth: 1, borderRightColor: Colors.border },
  brand: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logoWrap: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  brandName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  menuLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, marginBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
  navItem: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, marginBottom: 2 },
  navItemActive: { backgroundColor: Colors.primaryFaded },
  navLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
  navLabelActive: { color: Colors.primary, fontWeight: Typography.semibold },
  userRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  userInfo: { flex: 1 },
  userName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  userRole: { color: Colors.textMuted, fontSize: Typography.xs },
  logoutBtn: { width: 34, height: 34, borderRadius: Radius.md, backgroundColor: Colors.errorFaded, alignItems: "center", justifyContent: "center" },
});
