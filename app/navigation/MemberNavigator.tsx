// app/navigation/MemberNavigator.tsx
// DrawerNavigator → MemberTabs (Home, Discover, Profile) + drawer screens

import { Colors, Typography } from "@/theme";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AttendanceScreen from "../screens/member/AttendanceScreen";
import MemberDashboard from "../screens/member/DashboardScreen";
import DietScreen from "../screens/member/DietScreen";
import DiscoverScreen from "../screens/member/DiscoverScreen";
import GymDetailScreen from "../screens/member/GymDetailScreen";
import NotificationsScreen from "../screens/member/NotificationsScreen";
import PaymentsScreen from "../screens/member/PaymentsScreen";
import ReferralScreen from "../screens/member/ReferralScreen";
import WorkoutsScreen from "../screens/member/WorkoutsScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { MemberDrawerContent } from "./MemberDrawerContent";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
      <Stack.Screen name="MemberWorkouts" component={WorkoutsScreen} />
      <Stack.Screen name="MemberDiet" component={DietScreen} />
    </Stack.Navigator>
  );
}

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="GymDetail" component={GymDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberProfile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberAttendanceScreen" component={AttendanceScreen} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberPaymentsScreen" component={PaymentsScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberNotificationsScreen" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function ReferralStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberReferralScreen" component={ReferralScreen} />
    </Stack.Navigator>
  );
}

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: Typography.medium },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: "home-outline",
            Discover: "compass-outline",
            Profile: "account-circle-outline",
          };
          return <Icon name={icons[route.name] ?? "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export function MemberNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <MemberDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280, backgroundColor: Colors.surface },
        overlayColor: "rgba(0,0,0,0.6)",
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="MemberTabs" component={MemberTabs} />
      <Drawer.Screen name="MemberAttendance" component={AttendanceStack} />
      <Drawer.Screen name="MemberPayments" component={PaymentsStack} />
      <Drawer.Screen name="MemberNotifications" component={NotificationsStack} />
      <Drawer.Screen name="MemberReferral" component={ReferralStack} />
    </Drawer.Navigator>
  );
}
