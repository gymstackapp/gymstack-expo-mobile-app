// import 'react-native-gesture-handler';
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { StatusBar } from 'expo-status-bar';
// import { AuthProvider } from './app/context/AuthContext';
// import RootNavigator from './app/navigation/RootNavigator';

// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <AuthProvider>
//         <NavigationContainer>
//           <RootNavigator />
//         </NavigationContainer>
//         <StatusBar style="light" />
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// }

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { LogBox, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { RootNavigator } from "./app/navigation/RootNavigator";
import { Colors } from "./theme";
// import { usePushNotifications, registerBackgroundHandler } from "@/utils/pushNotifications"

// Suppress known harmless warnings
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "VirtualizedLists should never be nested",
]);

// Register background FCM handler OUTSIDE React — required for background/quit state
// registerBackgroundHandler()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000, // 1 min default — components can override
      gcTime: 5 * 60_000, // 5 min garbage collect
      refetchOnWindowFocus: false, // mobile has no "window focus"
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  // usePushNofitications();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bg}
        translucent={false}
      />
      <RootNavigator />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
