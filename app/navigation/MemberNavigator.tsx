// // app/navigation/MemberNavigator.tsx
// // DrawerNavigator → MemberTabs (Home, Discover, Profile) + drawer screens

// import { Colors, Typography } from "@/theme";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React from "react";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// import AttendanceScreen from "../screens/member/AttendanceScreen";
// import MemberDashboard from "../screens/member/DashboardScreen";
// import DietScreen from "../screens/member/DietScreen";
// import DiscoverScreen from "../screens/member/DiscoverScreen";
// import GymDetailScreen from "../screens/member/GymDetailScreen";
// import MemberGymsScreen from "../screens/member/GymsScreen";
// import NotificationsScreen from "../screens/member/NotificationsScreen";
// import PaymentsScreen from "../screens/member/PaymentsScreen";
// import ReferralScreen from "../screens/member/ReferralScreen";
// import WorkoutsScreen from "../screens/member/WorkoutsScreen";
// import { ProfileScreen } from "../screens/shared/ProfileScreen";
// import { MemberDrawerContent } from "./MemberDrawerContent";

// const Drawer = createDrawerNavigator();
// const Tab = createBottomTabNavigator();
// const Stack = createNativeStackNavigator();

// function HomeStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
//       <Stack.Screen name="MemberWorkouts" component={WorkoutsScreen} />
//       <Stack.Screen name="MemberDiet" component={DietScreen} />
//     </Stack.Navigator>
//   );
// }

// function DiscoverStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Discover" component={DiscoverScreen} />
//       <Stack.Screen name="Gyms" component={MemberGymsScreen} />
//       <Stack.Screen name="GymDetail" component={GymDetailScreen} />
//     </Stack.Navigator>
//   );
// }

// function ProfileStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MemberProfile" component={ProfileScreen} />
//     </Stack.Navigator>
//   );
// }

// function AttendanceStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen
//         name="MemberAttendanceScreen"
//         component={AttendanceScreen}
//       />
//     </Stack.Navigator>
//   );
// }

// function PaymentsStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MemberPaymentsScreen" component={PaymentsScreen} />
//     </Stack.Navigator>
//   );
// }

// function NotificationsStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen
//         name="MemberNotificationsScreen"
//         component={NotificationsScreen}
//       />
//     </Stack.Navigator>
//   );
// }

// function ReferralStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MemberReferralScreen" component={ReferralScreen} />
//     </Stack.Navigator>
//   );
// }

// function MemberTabs() {
//   const insets = useSafeAreaInsets();
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: Colors.surface,
//           borderTopColor: Colors.border,
//           borderTopWidth: 1,
//           paddingBottom: insets.bottom + 8,
//           paddingTop: 8,
//           height: 64 + insets.bottom,
//         },
//         tabBarActiveTintColor: Colors.primary,
//         tabBarInactiveTintColor: Colors.textMuted,
//         tabBarLabelStyle: { fontSize: 10, fontWeight: Typography.medium },
//         tabBarIcon: ({ color, size }) => {
//           const icons: Record<string, string> = {
//             Home: "home-outline",
//             Discover: "compass-outline",
//             Profile: "account-circle-outline",
//           };
//           return (
//             <Icon
//               name={icons[route.name] ?? "circle"}
//               size={size}
//               color={color}
//             />
//           );
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeStack} />
//       <Tab.Screen name="Discover" component={DiscoverStack} />
//       <Tab.Screen name="Profile" component={ProfileStack} />
//     </Tab.Navigator>
//   );
// }

// export function MemberNavigator() {
//   return (
//     <Drawer.Navigator
//       drawerContent={(props) => <MemberDrawerContent {...props} />}
//       screenOptions={{
//         headerShown: false,
//         drawerType: "front",
//         drawerStyle: { width: 280, backgroundColor: Colors.surface },
//         overlayColor: "rgba(0,0,0,0.6)",
//         swipeEdgeWidth: 40,
//       }}
//     >
//       <Drawer.Screen name="MemberTabs" component={MemberTabs} />
//       <Drawer.Screen name="MemberAttendance" component={AttendanceStack} />
//       <Drawer.Screen name="MemberPayments" component={PaymentsStack} />
//       <Drawer.Screen
//         name="MemberNotifications"
//         component={NotificationsStack}
//       />
//       <Drawer.Screen name="MemberReferral" component={ReferralStack} />
//     </Drawer.Navigator>
//   );
// }

// app/navigation/MemberNavigator.tsx
// DrawerNavigator → MemberTabs (Home, Workouts, Nutrition, Announcements)
// + drawer screens (Discover, Attendance, Payments, Notifications, Referral, Store, Profile)
//
// CHANGES from previous version:
//   - Bottom tabs: Home | Workouts | Nutrition | Announcements (removed Discover)
//   - Discover moved to drawer (accessible via hamburger menu)
//   - Store (Supplements) added to drawer
//   - Announcements is now a bottom tab
//   - Workout & Diet screens are full tab screens (no back header)

import { Colors, Typography } from "@/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AnnouncementsScreen from "../screens/member/AnnouncementScreen";
import AttendanceScreen from "../screens/member/AttendanceScreen";
import MemberDashboard from "../screens/member/DashboardScreen";
import DietScreen from "../screens/member/DietScreen";
import DiscoverScreen from "../screens/member/DiscoverScreen";
import GymDetailScreen from "../screens/member/GymDetailScreen";
import MemberGymsScreen from "../screens/member/GymsScreen";
import NotificationsScreen from "../screens/member/NotificationsScreen";
import PaymentsScreen from "../screens/member/PaymentsScreen";
import ReferralScreen from "../screens/member/ReferralScreen";
import SupplementsScreen from "../screens/member/SupplementsScreen";
import WorkoutsScreen from "../screens/member/WorkoutsScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { MemberDrawerContent } from "./MemberDrawerContent";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab stacks ────────────────────────────────────────────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
    </Stack.Navigator>
  );
}

function WorkoutsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberWorkoutsScreen" component={WorkoutsScreen} />
    </Stack.Navigator>
  );
}

function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberDietScreen" component={DietScreen} />
    </Stack.Navigator>
  );
}

function AnnouncementsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MemberAnnouncementsScreen"
        component={AnnouncementsScreen}
      />
    </Stack.Navigator>
  );
}

// ── Drawer stacks ─────────────────────────────────────────────────────────────

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="Gyms" component={MemberGymsScreen} />
      <Stack.Screen name="GymDetail" component={GymDetailScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MemberAttendanceScreen"
        component={AttendanceScreen}
      />
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
      <Stack.Screen
        name="MemberNotificationsScreen"
        component={NotificationsScreen}
      />
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

function StoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberStoreScreen" component={SupplementsScreen} />
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

// ── Bottom tab navigator ──────────────────────────────────────────────────────

function MemberTabs() {
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
            Home: "home-outline",
            Workouts: "dumbbell",
            Nutrition: "food-apple-outline",
            Announcements: "bullhorn-outline",
          };
          return (
            <Icon
              name={icons[route.name] ?? "circle"}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Workouts" component={WorkoutsStack} />
      <Tab.Screen name="Nutrition" component={NutritionStack} />
      <Tab.Screen name="Announcements" component={AnnouncementsStack} />
    </Tab.Navigator>
  );
}

// ── Root drawer navigator ──────────────────────────────────────────────────────

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
      {/* Default screen — bottom tabs */}
      <Drawer.Screen name="MemberTabs" component={MemberTabs} />

      {/* Drawer-accessible screens */}
      <Drawer.Screen name="MemberDiscover" component={DiscoverStack} />
      <Drawer.Screen name="MemberAttendance" component={AttendanceStack} />
      <Drawer.Screen name="MemberPayments" component={PaymentsStack} />
      <Drawer.Screen
        name="MemberNotifications"
        component={NotificationsStack}
      />
      <Drawer.Screen name="MemberReferral" component={ReferralStack} />
      <Drawer.Screen name="MemberStore" component={StoreStack} />
      <Drawer.Screen name="MemberProfile" component={ProfileStack} />
    </Drawer.Navigator>
  );
}
