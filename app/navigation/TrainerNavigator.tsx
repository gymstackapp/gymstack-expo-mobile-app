// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';
// import TrainerDashboard from '../screens/trainer/TrainerDashboard';

// export type TrainerTabParamList = {
//   Dashboard: undefined;
//   Clients: undefined;
//   Schedule: undefined;
//   Settings: undefined;
// };

// const Tab = createBottomTabNavigator<TrainerTabParamList>();

// const COLORS = {
//   primary: '#FF3B30',
//   background: '#0A0A0A',
//   surface: '#1A1A1A',
//   text: '#FFFFFF',
//   inactive: '#555555',
// };

// function PlaceholderScreen({ title }: { title: string }) {
//   const { View, Text } = require('react-native');
//   return (
//     <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
//       <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '600' }}>{title}</Text>
//       <Text style={{ color: COLORS.inactive, marginTop: 8 }}>Coming soon</Text>
//     </View>
//   );
// }

// export default function TrainerNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: COLORS.surface,
//           borderTopColor: '#2C2C2E',
//           borderTopWidth: 1,
//           height: 60,
//           paddingBottom: 8,
//         },
//         tabBarActiveTintColor: COLORS.primary,
//         tabBarInactiveTintColor: COLORS.inactive,
//         tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
//         tabBarIcon: ({ focused, color, size }) => {
//           const icons: Record<string, { active: string; inactive: string }> = {
//             Dashboard: { active: 'fitness', inactive: 'fitness-outline' },
//             Clients: { active: 'people', inactive: 'people-outline' },
//             Schedule: { active: 'calendar', inactive: 'calendar-outline' },
//             Settings: { active: 'settings', inactive: 'settings-outline' },
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
//       <Tab.Screen name="Dashboard" component={TrainerDashboard} />
//       <Tab.Screen name="Clients" children={() => <PlaceholderScreen title="Clients" />} />
//       <Tab.Screen name="Schedule" children={() => <PlaceholderScreen title="Schedule" />} />
//       <Tab.Screen name="Settings" children={() => <PlaceholderScreen title="Settings" />} />
//     </Tab.Navigator>
//   );
// }

// ─────────────────────────────────────────────────────────────────────────────
// mobile/src/navigation/TrainerNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { Colors, Typography } from "@/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NotificationsScreen from "../screens/owner/NotificationsScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { AttendanceScreen } from "../screens/trainer/AttendanceScreen";
import { DashboardScreen } from "../screens/trainer/DashboardScreen";
import { DietsScreen } from "../screens/trainer/DietsScreen";
import { MemberDetailScreen } from "../screens/trainer/MemberDetailScreen";
import { MembersScreen } from "../screens/trainer/MembersScreen";
import { MoreScreen } from "../screens/trainer/MoreScreen";
import { WorkoutsScreen } from "../screens/trainer/WorkoutsScreen";

const TrainerTab = createBottomTabNavigator();
const TrainerStack = createNativeStackNavigator();

function TrainerHomeStack() {
  return (
    <TrainerStack.Navigator screenOptions={{ headerShown: false }}>
      <TrainerStack.Screen
        name="TrainerDashboard"
        component={DashboardScreen}
      />
      <TrainerStack.Screen name="TrainerWorkouts" component={WorkoutsScreen} />
      <TrainerStack.Screen name="TrainerDiets" component={DietsScreen} />
    </TrainerStack.Navigator>
  );
}

function TrainerMembersStack() {
  return (
    <TrainerStack.Navigator screenOptions={{ headerShown: false }}>
      <TrainerStack.Screen name="TrainerMembers" component={MembersScreen} />
      <TrainerStack.Screen
        name="TrainerMemberDetail"
        component={MemberDetailScreen}
      />
    </TrainerStack.Navigator>
  );
}

function TrainerMoreStack() {
  return (
    <TrainerStack.Navigator screenOptions={{ headerShown: false }}>
      <TrainerStack.Screen name="TrainerMore" component={MoreScreen} />
      <TrainerStack.Screen
        name="TrainerAttendance"
        component={AttendanceScreen}
      />
      <TrainerStack.Screen
        name="TrainerNotifications"
        component={NotificationsScreen}
      />
      <TrainerStack.Screen name="Profile" component={ProfileScreen} />
    </TrainerStack.Navigator>
  );
}

export function TrainerNavigator() {
  return (
    <TrainerTab.Navigator
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
            Dashboard: "view-dashboard-outline",
            Members: "account-group-outline",
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
      <TrainerTab.Screen name="Dashboard" component={TrainerHomeStack} />
      <TrainerTab.Screen name="Members" component={TrainerMembersStack} />
      <TrainerTab.Screen name="More" component={TrainerMoreStack} />
    </TrainerTab.Navigator>
  );
}
