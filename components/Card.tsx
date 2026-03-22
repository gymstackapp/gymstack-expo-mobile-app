// mobile/src/components/common/Card.tsx
import { Colors, Radius, Spacing } from "@/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  raised?: boolean; // slightly lighter background, for nested cards
  noPadding?: boolean; // use when card contents need edge-to-edge (e.g. tables)
}

export function Card({ children, style, raised, noPadding }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        raised && styles.raised,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  raised: {
    backgroundColor: Colors.surfaceRaised,
  },
  noPadding: {
    padding: 0,
    overflow: "hidden", // clips children to rounded corners
  },
});
