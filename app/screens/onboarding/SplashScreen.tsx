// mobile/src/screens/onboarding/SplashScreen.tsx
import { Colors } from "@/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width: SW } = Dimensions.get("window");
const LOGO = require("../../../assets/images/logo.png");

export function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: SW * 0.62, height: SW * 0.62 },
});
