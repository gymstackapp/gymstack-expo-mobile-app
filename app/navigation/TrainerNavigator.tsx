// app/navigation/TrainerNavigator.tsx
// DrawerNavigator → TrainerTabs (Dashboard, Members, Profile) + drawer screens

import { Colors, Typography } from "@/theme";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { AttendanceScreen } from "../screens/trainer/AttendanceScreen";
import { DashboardScreen } from "../screens/trainer/DashboardScreen";
import { DietsScreen } from "../screens/trainer/DietsScreen";
import { MemberDetailScreen } from "../screens/trainer/MemberDetailScreen";
import { MembersScreen } from "../screens/trainer/MembersScreen";
import { WorkoutsScreen } from "../screens/trainer/WorkoutsScreen";
import { BodyMetricsScreen } from "../screens/trainer/BodyMetricsScreen";
import { NotificationsScreen } from "../screens/trainer/NotificationsScreen";
import { DiscoverScreen } from "../screens/trainer/DiscoverScreen";
import { DiscoverGymDetailScreen } from "../screens/trainer/DiscoverGymDetailScreen";
import { GymsScreen } from "../screens/trainer/GymsScreen";
import { MoreScreen } from "../screens/trainer/MoreScreen";
import { TrainerDrawerContent } from "./TrainerDrawerContent";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TrainerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerDashboard" component={DashboardScreen} />
      <Stack.Screen name="TrainerWorkouts" component={WorkoutsScreen} />
      <Stack.Screen name="TrainerDiets" component={DietsScreen} />
    </Stack.Navigator>
  );
}

function TrainerMembersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerMembers" component={MembersScreen} />
      <Stack.Screen name="TrainerMemberDetail" component={MemberDetailScreen} />
      <Stack.Screen name="TrainerBodyMetrics" component={BodyMetricsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerProfile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerAttendanceScreen" component={AttendanceScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerNotificationsScreen" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerDiscoverList" component={DiscoverScreen} />
      <Stack.Screen name="TrainerDiscoverDetail" component={DiscoverGymDetailScreen} />
    </Stack.Navigator>
  );
}

function GymsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerGymsList" component={GymsScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerMoreScreen" component={MoreScreen} />
    </Stack.Navigator>
  );
}

function TrainerTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 64 + insets.bottom,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: Typography.medium },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: "view-dashboard-outline",
            Members: "account-group-outline",
            Profile: "account-circle-outline",
            More: "dots-horizontal-circle-outline",
          };
          return <Icon name={icons[route.name] ?? "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={TrainerHomeStack} />
      <Tab.Screen name="Members" component={TrainerMembersStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

export function TrainerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <TrainerDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280, backgroundColor: Colors.surface },
        overlayColor: "rgba(0,0,0,0.6)",
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="TrainerTabs" component={TrainerTabs} />
      <Drawer.Screen name="TrainerAttendance" component={AttendanceStack} />
      <Drawer.Screen name="TrainerNotifications" component={NotificationsStack} />
      <Drawer.Screen name="TrainerDiscover" component={DiscoverStack} />
      <Drawer.Screen name="TrainerGyms" component={GymsStack} />
    </Drawer.Navigator>
  );
}
