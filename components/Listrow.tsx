// mobile/src/components/common/ListRow.tsx
// Reusable row for settings menus, more screens, detail pages.
// Saves writing the same flexRow pattern in every file.
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface ListRowProps {
  label: string;
  icon?: string; // leading icon name (MaterialCommunityIcons)
  iconColor?: string;
  iconBg?: string;
  value?: string; // right-side value text
  onPress?: () => void;
  showArrow?: boolean; // show chevron-right, default true when onPress provided
  right?: React.ReactNode; // custom right element (overrides value + arrow)
  destructive?: boolean; // makes label red
  disabled?: boolean;
  style?: ViewStyle;
  bordered?: boolean; // adds bottom border (for use inside Card)
}

export function ListRow({
  label,
  icon,
  iconColor = Colors.textSecondary,
  iconBg = Colors.surfaceRaised,
  value,
  onPress,
  showArrow,
  right,
  destructive,
  disabled,
  style,
  bordered,
}: ListRowProps) {
  const showChevron = showArrow ?? !!onPress;

  const content = (
    <View
      style={[
        styles.row,
        bordered && styles.bordered,
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* Leading icon */}
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      ) : null}

      {/* Label */}
      <Text
        style={[
          styles.label,
          destructive && { color: Colors.error },
          disabled && { color: Colors.textMuted },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Right area */}
      {right ? (
        right
      ) : (
        <View style={styles.rightArea}>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {showChevron ? (
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          ) : null}
        </View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  rightArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 0,
  },
  value: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
});
