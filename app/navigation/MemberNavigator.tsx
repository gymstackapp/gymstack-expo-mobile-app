// import { Ionicons } from "@expo/vector-icons";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import React from "react";
// import MemberDashboard from "../screens/member/MemberDashboard";

// export type MemberTabParamList = {
//   Dashboard: undefined;
//   Workouts: undefined;
//   Progress: undefined;
//   Settings: undefined;
// };

// const Tab = createBottomTabNavigator<MemberTabParamList>();

// const COLORS = {
//   primary: "#FF3B30",
//   background: "#0A0A0A",
//   surface: "#1A1A1A",
//   text: "#FFFFFF",
//   inactive: "#555555",
// };

// function PlaceholderScreen({ title }: { title: string }) {
//   const { View, Text } = require("react-native");
//   return (
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: COLORS.background,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "600" }}>
//         {title}
//       </Text>
//       <Text style={{ color: COLORS.inactive, marginTop: 8 }}>Coming soon</Text>
//     </View>
//   );
// }

// export default function MemberNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: COLORS.surface,
//           borderTopColor: "#2C2C2E",
//           borderTopWidth: 1,
//           height: 60,
//           paddingBottom: 8,
//         },
//         tabBarActiveTintColor: COLORS.primary,
//         tabBarInactiveTintColor: COLORS.inactive,
//         tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
//         tabBarIcon: ({ focused, color, size }) => {
//           const icons: Record<string, { active: string; inactive: string }> = {
//             Dashboard: { active: "home", inactive: "home-outline" },
//             Workouts: { active: "barbell", inactive: "barbell-outline" },
//             Progress: {
//               active: "trending-up",
//               inactive: "trending-up-outline",
//             },
//             Settings: { active: "settings", inactive: "settings-outline" },
//           };
//           const icon = icons[route.name];
//           return (
//             <Ionicons
//               name={(focused ? icon.active : icon.inactive) as any}
//               size={size}
//               color={color}
//             />
//           );
//         },
//       })}
//     >
//       <Tab.Screen name="Dashboard" component={MemberDashboard} />
//       <Tab.Screen
//         name="Workouts"
//         children={() => <PlaceholderScreen title="Workouts" />}
//       />
//       <Tab.Screen
//         name="Progress"
//         children={() => <PlaceholderScreen title="Progress" />}
//       />
//       <Tab.Screen
//         name="Settings"
//         children={() => <PlaceholderScreen title="Settings" />}
//       />
//     </Tab.Navigator>
//   );
// }

// mobile/src/navigation/MemberNavigator.tsx
import { Colors, Typography } from "@/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AttendanceScreen from "../screens/member/AttendanceScreen";
import MemberDashboard from "../screens/member/DashboardScreen";
import DietScreen from "../screens/member/DietScreen";
import DiscoverScreen from "../screens/member/DiscoverScreen";
import GymDetailScreen from "../screens/member/GymDetailScreen";
import MoreScreen from "../screens/member/MoreScreen";
import NotificationsScreen from "../screens/member/NotificationsScreen";
import PaymentsScreen from "../screens/member/PaymentsScreen";
import ReferralScreen from "../screens/member/ReferralScreen";
import WorkoutsScreen from "../screens/member/WorkoutsScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";

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

function MemberMoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberMore" component={MoreScreen} />
      <Stack.Screen name="MemberAttendance" component={AttendanceScreen} />
      <Stack.Screen name="MemberPayments" component={PaymentsScreen} />
      <Stack.Screen
        name="MemberNotifications"
        component={NotificationsScreen}
      />
      <Stack.Screen name="MemberReferral" component={ReferralScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export function MemberNavigator() {
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
            More: "dots-horizontal",
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
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="More" component={MemberMoreStack} />
    </Tab.Navigator>
  );
}
