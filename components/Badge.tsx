// mobile/src/components/common/Badge.tsx
import { Colors, Radius, Typography } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  // Override colors directly when variant isn't enough
  color?: string;
  bg?: string;
  border?: string;
}

const VARIANT_STYLES: Record<
  BadgeVariant,
  { color: string; bg: string; border: string }
> = {
  default: {
    color: Colors.textSecondary,
    bg: Colors.surfaceRaised,
    border: Colors.border,
  },
  primary: {
    color: Colors.primary,
    bg: Colors.primaryFaded,
    border: Colors.primary + "40",
  },
  success: {
    color: Colors.success,
    bg: Colors.successFaded,
    border: Colors.success + "40",
  },
  warning: {
    color: Colors.warning,
    bg: Colors.warningFaded,
    border: Colors.warning + "40",
  },
  error: {
    color: Colors.error,
    bg: Colors.errorFaded,
    border: Colors.error + "40",
  },
  info: {
    color: Colors.info,
    bg: Colors.infoFaded,
    border: Colors.info + "40",
  },
};

export function Badge({
  label,
  variant = "default",
  color,
  bg,
  border,
}: BadgeProps) {
  const v = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg ?? v.bg,
          borderColor: border ?? v.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: color ?? v.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: "600",
  },
});
