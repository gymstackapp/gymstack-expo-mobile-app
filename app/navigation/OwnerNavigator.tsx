// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';
// import OwnerDashboard from '../screens/owner/OwnerDashboard';

// export type OwnerTabParamList = {
//   Dashboard: undefined;
//   Members: undefined;
//   Schedule: undefined;
//   Settings: undefined;
// };

// const Tab = createBottomTabNavigator<OwnerTabParamList>();

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

// export default function OwnerNavigator() {
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
//             Dashboard: { active: 'grid', inactive: 'grid-outline' },
//             Members: { active: 'people', inactive: 'people-outline' },
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
//       <Tab.Screen name="Dashboard" component={OwnerDashboard} />
//       <Tab.Screen name="Members" children={() => <PlaceholderScreen title="Members" />} />
//       <Tab.Screen name="Schedule" children={() => <PlaceholderScreen title="Schedule" />} />
//       <Tab.Screen name="Settings" children={() => <PlaceholderScreen title="Settings" />} />
//     </Tab.Navigator>
//   );
// }

// mobile/src/navigation/OwnerNavigator.tsx
import { Colors, Typography } from "@/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Dashboard
import DashboardScreen from "../screens/owner/DashboardScreen";
// Gyms
import AddGymScreen from "../screens/owner/AddGymScreen";
import OwnerGymDetailScreen from "../screens/owner/GymDetailScreen";
import OwnerGymsScreen from "../screens/owner/GymsScreen";
// Members
import AddMemberScreen from "../screens/owner/AddMemberScreen";
import OwnerMemberDetailScreen from "../screens/owner/MemberDetailScreen";
import OwnerMembersScreen from "../screens/owner/MembersScreen";
// Trainers
import AddTrainerScreen from "../screens/owner/AddTrainerScreen";
import TrainersScreen from "../screens/owner/TrainersScreen";
// Attendance
import AttendanceScreen from "../screens/owner/AttendanceScreen";
// Payments
import PaymentsScreen from "../screens/owner/PaymentsScreen";
// Plans
import PlansScreen from "../screens/owner/PlansScreen";
// Supplements
import SupplementsScreen from "../screens/owner/SupplementsScreen";
// Workouts & Diets
import DietsScreen from "../screens/owner/DietsScreen";
import WorkoutsScreen from "../screens/owner/WorkoutsScreen";
// Reports
import ReportsScreen from "../screens/owner/ReportsScreen";
// Notifications
import NotificationsScreen from "../screens/owner/NotificationsScreen";
// Referral
import ReferralScreen from "../screens/owner/ReferralScreen";
// Billing
import BillingScreen from "../screens/owner/BillingScreen";
// Settings / Profile
import MoreScreen from "../screens/owner/MoreScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab screens (primary nav) ────────────────────────────────────────────────

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDashboard" component={DashboardScreen} />
      <Stack.Screen name="OwnerGymDetail" component={OwnerGymDetailScreen} />
      <Stack.Screen
        name="OwnerMemberDetail"
        component={OwnerMemberDetailScreen}
      />
    </Stack.Navigator>
  );
}

function GymsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerGyms" component={OwnerGymsScreen} />
      <Stack.Screen name="OwnerGymDetail" component={OwnerGymDetailScreen} />
      <Stack.Screen name="OwnerAddGym" component={AddGymScreen} />
      <Stack.Screen name="OwnerPlans" component={PlansScreen} />
    </Stack.Navigator>
  );
}

function MembersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerMembers" component={OwnerMembersScreen} />
      <Stack.Screen
        name="OwnerMemberDetail"
        component={OwnerMemberDetailScreen}
      />
      <Stack.Screen name="OwnerAddMember" component={AddMemberScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerMore" component={MoreScreen} />
      <Stack.Screen name="OwnerTrainers" component={TrainersScreen} />
      <Stack.Screen name="OwnerAddTrainer" component={AddTrainerScreen} />
      <Stack.Screen name="OwnerAttendance" component={AttendanceScreen} />
      <Stack.Screen name="OwnerPayments" component={PaymentsScreen} />
      <Stack.Screen name="OwnerSupplements" component={SupplementsScreen} />
      <Stack.Screen name="OwnerWorkouts" component={WorkoutsScreen} />
      <Stack.Screen name="OwnerDiets" component={DietsScreen} />
      <Stack.Screen name="OwnerReports" component={ReportsScreen} />
      <Stack.Screen name="OwnerNotifications" component={NotificationsScreen} />
      <Stack.Screen name="OwnerReferral" component={ReferralScreen} />
      <Stack.Screen name="OwnerBilling" component={BillingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ── Bottom tabs ───────────────────────────────────────────────────────────────

export function OwnerNavigator() {
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
            Dashboard: "view-dashboard-outline",
            Gyms: "dumbbell",
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
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Gyms" component={GymsStack} />
      <Tab.Screen name="Members" component={MembersStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}
