// // mobile/src/screens/owner/MoreScreen.tsx
// // Secondary features hub: attendance, payments, supplements, workouts,
// // diet plans, reports, notifications, referral, billing, profile.
// import React from "react"
// import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import { useNavigation } from "@react-navigation/native"
// import { useAuthStore } from "@/store/authStore"
// import { Avatar } from "@/components/common"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// interface MenuItem {
//   icon:       string
//   label:      string
//   screen:     string
//   color?:     string
//   bg?:        string
//   featureKey?: string   // if set, shows lock icon when not available on plan
//   badge?:     string
// }

// const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
//   {
//     title: "Operations",
//     items: [
//       { icon: "calendar-check-outline", label: "Attendance",    screen: "OwnerAttendance",    featureKey: "hasAttendance" },
//       { icon: "credit-card-outline",    label: "Payments",      screen: "OwnerPayments",      featureKey: "hasPayments", color: Colors.success, bg: Colors.successFaded },
//       { icon: "shopping-outline",       label: "Supplements",   screen: "OwnerSupplements",   featureKey: "hasSupplements" },
//     ],
//   },
//   {
//     title: "Plans & Programs",
//     items: [
//       { icon: "clipboard-list-outline", label: "Workout Plans", screen: "OwnerWorkouts",      featureKey: "hasWorkoutPlans", color: Colors.purple, bg: Colors.purpleFaded },
//       { icon: "food-apple-outline",     label: "Diet Plans",    screen: "OwnerDiets",         featureKey: "hasDietPlans",    color: Colors.success, bg: Colors.successFaded },
//     ],
//   },
//   {
//     title: "Team",
//     items: [
//       { icon: "account-tie-outline",    label: "Trainers",      screen: "OwnerTrainers" },
//     ],
//   },
//   {
//     title: "Insights",
//     items: [
//       { icon: "chart-bar-outline",      label: "Reports",       screen: "OwnerReports",       featureKey: "hasFullReports", color: Colors.info, bg: Colors.infoFaded },
//       { icon: "bell-outline",           label: "Notifications", screen: "OwnerNotifications" },
//     ],
//   },
//   {
//     title: "Account",
//     items: [
//       { icon: "gift-outline",           label: "Refer & Earn",  screen: "OwnerReferral",      featureKey: "hasReferAndEarn", color: Colors.yellow, bg: Colors.yellowFaded },
//       { icon: "lightning-bolt-outline", label: "Subscriptions & Plans",screen: "OwnerSubscriptions",      color: Colors.primary, bg: Colors.primaryFaded },
//       { icon: "account-circle-outline", label: "Profile",       screen: "Profile" },
//     ],
//   },
// ]

// export function MoreScreen() {
//   const navigation  = useNavigation()
//   const { profile, logout } = useAuthStore()
//   const sub         = useSubscription()

//   const isLocked = (featureKey?: string) => {
//     if (!featureKey) return false
//     return !(sub as any)[featureKey]
//   }

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
//         {/* Profile banner */}
//         <TouchableOpacity
//           style={styles.profileBanner}
//           onPress={() => (navigation as any).navigate("Profile")}
//         >
//           <Avatar name={profile?.fullName ?? "O"} url={profile?.avatarUrl} size={48} />
//           <View style={{ flex: 1, marginLeft: Spacing.md }}>
//             <Text style={styles.profileName}>{profile?.fullName}</Text>
//             <Text style={styles.profileEmail}>{profile?.email}</Text>
//           </View>
//           <Icon name="chevron-right" size={18} color={Colors.textMuted} />
//         </TouchableOpacity>

//         {/* Plan badge */}
//         {sub.subscription && (
//           <TouchableOpacity
//             style={styles.planBadge}
//             onPress={() => (navigation as any).navigate("OwnerSubscriptions")}
//           >
//             <Icon name="crown-outline" size={16} color={Colors.primary} />
//             <Text style={styles.planBadgeText}>{sub.subscription.planName} Plan</Text>
//             {sub.daysRemaining !== null && sub.daysRemaining <= 14 && (
//               <View style={styles.expiringChip}>
//                 <Text style={styles.expiringChipText}>{sub.daysRemaining}d left</Text>
//               </View>
//             )}
//             {sub.isExpired && (
//               <View style={[styles.expiringChip, { backgroundColor: Colors.errorFaded, borderColor: Colors.error + "40" }]}>
//                 <Text style={[styles.expiringChipText, { color: Colors.error }]}>Expired</Text>
//               </View>
//             )}
//             <Icon name="chevron-right" size={14} color={Colors.textMuted} style={{ marginLeft: "auto" }} />
//           </TouchableOpacity>
//         )}

//         {/* Menu sections */}
//         {MENU_SECTIONS.map(section => (
//           <View key={section.title} style={{ marginTop: Spacing.xl }}>
//             <Text style={styles.sectionTitle}>{section.title}</Text>
//             <View style={styles.sectionCard}>
//               {section.items.map((item, idx) => {
//                 const locked = isLocked(item.featureKey)
//                 return (
//                   <TouchableOpacity
//                     key={item.screen}
//                     style={[
//                       styles.menuRow,
//                       idx < section.items.length - 1 && styles.menuRowBorder,
//                     ]}
//                     onPress={() => (navigation as any).navigate(item.screen)}
//                   >
//                     <View style={[styles.menuIcon, { backgroundColor: item.bg ?? Colors.surfaceRaised }]}>
//                       <Icon name={item.icon} size={18} color={locked ? Colors.textMuted : (item.color ?? Colors.textSecondary)} />
//                     </View>
//                     <Text style={[styles.menuLabel, locked && { color: Colors.textMuted }]}>{item.label}</Text>
//                     {locked ? (
//                       <Icon name="lock-outline" size={14} color={Colors.textMuted} />
//                     ) : (
//                       <Icon name="chevron-right" size={16} color={Colors.textMuted} />
//                     )}
//                   </TouchableOpacity>
//                 )
//               })}
//             </View>
//           </View>
//         ))}

//         {/* Logout */}
//         <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
//           <Icon name="logout" size={18} color={Colors.error} />
//           <Text style={styles.logoutText}>Sign Out</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   safe:          { flex: 1, backgroundColor: Colors.bg },
//   scroll:        { padding: Spacing.lg, paddingBottom: 40 },
//   profileBanner: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
//   profileName:   { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
//   profileEmail:  { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   planBadge:     { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primaryFaded, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary + "30", padding: Spacing.md, marginBottom: Spacing.sm },
//   planBadgeText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
//   expiringChip:  { backgroundColor: Colors.warningFaded, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.warning + "40" },
//   expiringChipText: { color: Colors.warning, fontSize: 10, fontWeight: Typography.semibold },
//   sectionTitle:  { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.sm },
//   sectionCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
//   menuRow:       { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.lg },
//   menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
//   menuIcon:      { width: 36, height: 36, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
//   menuLabel:     { flex: 1, color: Colors.textPrimary, fontSize: Typography.base },
//   logoutBtn:     { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.lg, marginTop: Spacing.xl, backgroundColor: Colors.errorFaded, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.error + "30" },
//   logoutText:    { color: Colors.error, fontSize: Typography.base, fontWeight: Typography.semibold },
// })

import { Avatar } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
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
  color?: string;
  bg?: string;
  featureKey?: string; // if set, shows lock icon when not available on plan
  badge?: string;
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Operations",
    items: [
      {
        icon: "calendar-check-outline",
        label: "Attendance",
        screen: "OwnerAttendance",
        featureKey: "hasAttendance",
      },
      {
        icon: "credit-card-outline",
        label: "Payments",
        screen: "OwnerPayments",
        featureKey: "hasPayments",
        color: Colors.success,
        bg: Colors.successFaded,
      },
      {
        icon: "shopping-outline",
        label: "Supplements",
        screen: "OwnerSupplements",
        featureKey: "hasSupplements",
      },
    ],
  },
  {
    title: "Plans & Programs",
    items: [
      {
        icon: "clipboard-list-outline",
        label: "Workout Plans",
        screen: "OwnerWorkouts",
        featureKey: "hasWorkoutPlans",
        color: Colors.purple,
        bg: Colors.purpleFaded,
      },
      {
        icon: "food-apple-outline",
        label: "Diet Plans",
        screen: "OwnerDiets",
        featureKey: "hasDietPlans",
        color: Colors.success,
        bg: Colors.successFaded,
      },
    ],
  },
  {
    title: "Team",
    items: [
      {
        icon: "account-tie-outline",
        label: "Trainers",
        screen: "OwnerTrainers",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        icon: "chart-bar-outline",
        label: "Reports",
        screen: "OwnerReports",
        featureKey: "hasFullReports",
        color: Colors.info,
        bg: Colors.infoFaded,
      },
      {
        icon: "bell-outline",
        label: "Notifications",
        screen: "OwnerNotifications",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        icon: "gift-outline",
        label: "Refer & Earn",
        screen: "OwnerReferral",
        featureKey: "hasReferAndEarn",
        color: Colors.yellow,
        bg: Colors.yellowFaded,
      },
      {
        icon: "lightning-bolt-outline",
        label: "Subscriptions & Plans",
        screen: "OwnerSubscriptions",
        color: Colors.primary,
        bg: Colors.primaryFaded,
      },
      { icon: "account-circle-outline", label: "Profile", screen: "Profile" },
    ],
  },
];
const MoreScreen = () => {
  const navigation = useNavigation();
  const { profile, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  // const sub = useSubscription();

  // const isLocked = (featureKey?: string) => {
  //   if (!featureKey) return false;
  //   return !(sub as any)[featureKey];
  // }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileBanner}
          onPress={() => (navigation as any).navigate("Profile")}
        >
          <Avatar
            name={profile?.fullName ?? "O"}
            url={profile?.avatarUrl}
            size={48}
          />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.profileName}>{profile?.fullName}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Plan Badge */}
        {/* {sub.subscription && (
          <TouchableOpacity style={styles.planBadge} onPress={() => (navigation as any).navigate('OwnerSubscriptions')}>
            <Icon name="crown-outline" size={16} color={Colors.primary} />
            <Text style={styles.planBadgeText}>{sub.subscription.planName} Plan</Text>
            {sub.daysRemaining !== null && sub.daysRemaining <= 14 && (
              <View style={styles.expiringChip}>
                <Text style={styles.expiringChipText}>{sub.daysRemaining}d left</Text>
              </View>
            )}
            {sub.isExpired && (
              <View style={[styles.expiringChip, { backgroundColor: Colors.errorFaded, borderColor: Colors.error + "40" }]}>
                <Text style={[styles.expiringChipText, { color: Colors.error }]}>Expired</Text>
              </View>
            )}
            <Icon name="chevron-right" size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )} */}

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: Spacing.xl }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => {
                // const locked = isLocked(item.featureKey)\
                const locked = false;
                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[
                      styles.menuRow,
                      idx < section.items.length - 1 && styles.menuRowBorder,
                    ]}
                    onPress={() => (navigation as any).navigate(item.screen)}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: item.bg ?? Colors.surfaceRaised },
                      ]}
                    >
                      <Icon
                        name={item.icon}
                        size={18}
                        color={
                          locked
                            ? Colors.textMuted
                            : (item.color ?? Colors.textSecondary)
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuLabel,
                        locked && { color: Colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {locked ? (
                      <Icon
                        name="lock-outline"
                        size={14}
                        color={Colors.textMuted}
                      />
                    ) : (
                      <Icon
                        name="chevron-right"
                        size={16}
                        color={Colors.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Icon name="logout" size={18} color={Colors.error} />
          )}
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  profileEmail: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  planBadgeText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  expiringChip: {
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  expiringChipText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: Typography.semibold,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
