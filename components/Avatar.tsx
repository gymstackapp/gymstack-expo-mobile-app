// mobile/src/components/common/Avatar.tsx
import { Typography } from "@/theme";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  name: string; // used for initials fallback
  url?: string | null; // remote image URL
  size?: number; // diameter in px, default 40
  style?: object;
}

export function Avatar({ name, url, size = 40, style }: AvatarProps) {
  const radius = size / 2;
  const fontSize = size * 0.35;

  // Generate a consistent hue from the name so each person always gets the same color
  const hue =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
          style,
        ]}
        // Fallback to initials on image load error
        // Note: Image doesn't natively support onError fallback in RN without
        // state, so for production you'd use react-native-fast-image's
        // fallback props or wrap in a state-managed component.
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `hsl(${hue}, 45%, 32%)`,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: Typography.bold,
  },
});
