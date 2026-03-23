// app/navigation/OwnerNavigator.tsx
// Architecture:
//   DrawerNavigator (slides from left, custom sidebar)
//   └── MainTabs  ← BottomTabNavigator
//       ├── Dashboard → DashboardStack
//       ├── Gyms      → GymsStack
//       ├── Members   → MembersStack
//       └── Profile   → ProfileScreen
//   └── Drawer-level stacks (Trainers, Attendance, Payments, …)

import { Colors, Typography } from "@/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Screens ──────────────────────────────────────────────────────────────────

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
import OwnerAttendanceScreen from "../screens/owner/AttendanceScreen";
// Payments
import OwnerPaymentsScreen from "../screens/owner/PaymentsScreen";
// Plans
import OwnerPlansScreen from "../screens/owner/PlansScreen";
// Supplements
import SupplementsScreen from "../screens/owner/SupplementsScreen";
// Workouts & Diets
import OwnerDietsScreen from "../screens/owner/DietsScreen";
import OwnerWorkoutsScreen from "../screens/owner/WorkoutsScreen";
// Reports
import ReportsScreen from "../screens/owner/ReportsScreen";
// Notifications
import OwnerNotificationsScreen from "../screens/owner/NotificationsScreen";
// Referral
import ReferralScreen from "../screens/owner/ReferralScreen";
// Billing
import BillingScreen from "../screens/owner/BillingScreen";
// Profile
import { ProfileScreen } from "../screens/shared/ProfileScreen";

import AddDietPlanScreen from "../screens/owner/AddDietPlanScreen";
import { OwnerDrawerContent } from "./OwnerDrawerContent";

// ── Navigators ────────────────────────────────────────────────────────────────

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab stacks ────────────────────────────────────────────────────────────────

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
      <Stack.Screen name="OwnerPlans" component={OwnerPlansScreen} />
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

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerProfile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ── Drawer-level stacks (accessed from sidebar) ───────────────────────────────

function TrainersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTrainersList" component={TrainersScreen} />
      <Stack.Screen name="OwnerAddTrainer" component={AddTrainerScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OwnerAttendanceScreen"
        component={OwnerAttendanceScreen}
      />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OwnerPaymentsScreen"
        component={OwnerPaymentsScreen}
      />
    </Stack.Navigator>
  );
}

function SupplementsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OwnerSupplementsScreen"
        component={SupplementsScreen}
      />
    </Stack.Navigator>
  );
}

function WorkoutsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OwnerWorkoutsScreen"
        component={OwnerWorkoutsScreen}
      />
      <Stack.Screen name="OwnerAddWorkoutPlan" component={AddDietPlanScreen} />
    </Stack.Navigator>
  );
}

function DietsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDietsScreen" component={OwnerDietsScreen} />
      <Stack.Screen name="OwnerAddDietPlan" component={AddDietPlanScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerReportsScreen" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OwnerNotificationsScreen"
        component={OwnerNotificationsScreen}
      />
    </Stack.Navigator>
  );
}

function ReferralStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerReferralScreen" component={ReferralScreen} />
    </Stack.Navigator>
  );
}

function BillingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerBillingScreen" component={BillingScreen} />
    </Stack.Navigator>
  );
}

// ── Bottom tab navigator ───────────────────────────────────────────────────────

function MainTabs() {
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
            Profile: "account-circle-outline",
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
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ── Root drawer navigator ──────────────────────────────────────────────────────

export function OwnerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <OwnerDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280, backgroundColor: Colors.surface },
        overlayColor: "rgba(0,0,0,0.6)",
        swipeEdgeWidth: 40,
      }}
    >
      {/* Main tab app — listed first so it's the default screen */}
      <Drawer.Screen name="MainTabs" component={MainTabs} />

      {/* Drawer-accessible stacks */}
      <Drawer.Screen name="OwnerTrainers" component={TrainersStack} />
      <Drawer.Screen name="OwnerAttendance" component={AttendanceStack} />
      <Drawer.Screen name="OwnerPayments" component={PaymentsStack} />
      <Drawer.Screen name="OwnerSupplements" component={SupplementsStack} />
      <Drawer.Screen name="OwnerWorkouts" component={WorkoutsStack} />
      <Drawer.Screen name="OwnerDiets" component={DietsStack} />
      <Drawer.Screen name="OwnerReports" component={ReportsStack} />
      <Drawer.Screen name="OwnerNotifications" component={NotificationsStack} />
      <Drawer.Screen name="OwnerReferral" component={ReferralStack} />
      <Drawer.Screen name="OwnerBilling" component={BillingStack} />
    </Drawer.Navigator>
  );
}
