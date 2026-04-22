// mobile/src/components/common/StatCard.tsx
// Compact metric card — icon + value + label.
// Used in dashboard grids: revenue, attendance, members, etc.
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Card } from "./Card";

interface StatCardProps {
  icon: string; // MaterialCommunityIcons icon name
  label: string; // description text below the value
  value: string | number;
  color?: string; // accent color for icon and value, default primary
  bg?: string; // icon background color, default primaryFaded
  style?: ViewStyle;
  sub?: string; // optional secondary line below the label
  // Optional: show a small trend indicator
  trend?: "up" | "down" | "neutral";
  trendValue?: string; // e.g. "+12%"
}

export function StatCard({
  icon,
  label,
  value,
  color = Colors.primary,
  bg = Colors.primaryFaded,
  style,
  sub,
  trend,
  trendValue,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? Colors.success
      : trend === "down"
        ? Colors.error
        : Colors.textMuted;

  const trendIcon =
    trend === "up"
      ? "trending-up"
      : trend === "down"
        ? "trending-down"
        : "minus";

  return (
    <Card style={style ? { ...styles.card, ...style } : styles.card}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={16} color={color} />
      </View>

      {/* Value */}
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {String(value)}
      </Text>

      {/* Label */}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {sub ? (
        <Text style={[styles.sub, { color }]} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}

      {/* Trend */}
      {trend && trendValue ? (
        <View style={styles.trendRow}>
          <Icon
            name={trendIcon}
            size={12}
            color={trendColor}
            style={styles.trendIcon}
          />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendValue}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    lineHeight: Typography.xl * 1.2,
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: 3,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 1,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  trendIcon: {
    marginRight: 3,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
});
