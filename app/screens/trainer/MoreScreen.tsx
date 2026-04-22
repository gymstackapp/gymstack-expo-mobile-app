// app/screens/trainer/MoreScreen.tsx
import { trainerNotificationsApi } from "@/api/endpoints";
import { Avatar, Card } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
    title: "My Work",
    items: [
      {
        icon: "office-building-outline",
        label: "My Gyms",
        screen: "TrainerGyms",
        color: Colors.primary,
        desc: "Gyms you're working at",
      },
      {
        icon: "compass-outline",
        label: "Discover Gyms",
        screen: "TrainerDiscover",
        color: Colors.info,
        desc: "Find gyms to join",
      },
      {
        icon: "calendar-check-outline",
        label: "Attendance",
        screen: "TrainerAttendance",
        color: Colors.success,
        desc: "Check-in history",
      },
    ] as MenuItem[],
  },
  {
    title: "Communication",
    items: [
      {
        icon: "bell-outline",
        label: "Notifications",
        screen: "TrainerNotifications",
        color: Colors.warning,
        desc: "Inbox & sent messages",
        badge: true,
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

export function MoreScreen() {
  const navigation = useNavigation<any>();
  const { profile, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["trainerUnreadCount"],
    queryFn: () =>
      (trainerNotificationsApi as any).unreadCount?.() as Promise<{ count: number }>,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const unreadCount = (unreadData as any)?.count ?? 0;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.titleRow}>
        <Text style={s.screenTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <Avatar name={profile?.fullName ?? "T"} url={profile?.avatarUrl} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile?.fullName ?? "Trainer"}</Text>
            <Text style={s.profileEmail} numberOfLines={1}>{profile?.email}</Text>
            {profile?.city && (
              <View style={s.profileCity}>
                <Icon name="map-marker-outline" size={11} color={Colors.textMuted} />
                <Text style={s.profileCityText}>{profile.city}</Text>
              </View>
            )}
          </View>
          <View style={s.profileArrow}>
            <Icon name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

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
                    <View style={[s.menuIcon, { backgroundColor: item.color + "18" }]}>
                      <Icon name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      {item.desc && <Text style={s.menuDesc}>{item.desc}</Text>}
                    </View>
                    {showBadge && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                      </View>
                    )}
                    <Icon name="chevron-right" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}

        {/* App info */}
        <Card style={s.infoCard}>
          <View style={s.infoRow}>
            <Icon name="information-outline" size={16} color={Colors.textMuted} />
            <Text style={s.infoText}>GymStack v1.0.0</Text>
          </View>
          <View style={[s.infoRow, { marginTop: 6 }]}>
            <Icon name="shield-check-outline" size={16} color={Colors.textMuted} />
            <Text style={s.infoText}>Your data is encrypted and secure</Text>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={[s.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Icon name="logout" size={18} color={Colors.error} />
          )}
          <Text style={s.logoutText}>{isLoggingOut ? "Signing out..." : "Sign Out"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  titleRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  screenTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: "800" },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  profileName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "700" },
  profileEmail: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  profileCity: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  profileCityText: { color: Colors.textMuted, fontSize: Typography.xs },
  profileArrow: { width: 32, height: 32, borderRadius: Radius.lg, backgroundColor: Colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.sm },
  menuCard: { padding: 0, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  menuLabel: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  menuDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  badge: { backgroundColor: Colors.primary, borderRadius: Radius.full, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  infoText: { color: Colors.textMuted, fontSize: Typography.xs },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Colors.errorFaded, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.error + "30" },
  logoutText: { color: Colors.error, fontSize: Typography.sm, fontWeight: "700" },
});
