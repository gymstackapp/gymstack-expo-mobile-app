// mobile/src/components/common/EmptyState.tsx
// Centered empty state — shown when a list has no items.
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface EmptyStateProps {
  icon: string; // MaterialCommunityIcons name
  title: string;
  subtitle?: string;
  action?: React.ReactNode; // e.g. a Button component
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <Icon name={icon} size={30} color={Colors.textMuted} />
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Action */}
      {action ? <View style={styles.actionWrap}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: Typography.sm * 1.5,
  },
  actionWrap: {
    marginTop: Spacing.sm,
  },
});
