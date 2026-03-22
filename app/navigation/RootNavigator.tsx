// import React from 'react';
// import { useAuth } from '../context/AuthContext';
// import AuthNavigator from './AuthNavigator';
// import OwnerNavigator from './OwnerNavigator';
// import MemberNavigator from './MemberNavigator';
// import TrainerNavigator from './TrainerNavigator';

// export default function RootNavigator() {
//   const { user } = useAuth();

//   if (!user || !user.role) {
//     return <AuthNavigator />;
//   }

//   switch (user.role) {
//     case 'owner':
//       return <OwnerNavigator />;
//     case 'member':
//       return <MemberNavigator />;
//     case 'trainer':
//       return <TrainerNavigator />;
//     default:
//       return <AuthNavigator />;
//   }
// }

import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/theme";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import SelectRoleScreen from "../screens/auth/SelectRoleScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MemberNavigator } from "./MemberNavigator";
import { OwnerNavigator } from "./OwnerNavigator";
import { TrainerNavigator } from "./TrainerNavigator";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  SelectRole: undefined;
  OwnerApp: undefined;
  MemberApp: undefined;
  TrainerApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isHydrated, profile, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const isLoggedIn = !!profile;
  const role = profile?.role;
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "fade" }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        ) : !role ? (
          <Stack.Screen name="SelectRole" component={SelectRoleScreen} />
        ) : role === "owner" ? (
          <Stack.Screen name="OwnerApp" component={OwnerNavigator} />
        ) : role === "trainer" ? (
          <Stack.Screen name="TrainerApp" component={TrainerNavigator} />
        ) : (
          <Stack.Screen name="MemberApp" component={MemberNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
