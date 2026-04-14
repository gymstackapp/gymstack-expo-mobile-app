// mobile/src/components/common/Dropdown.tsx
// Reusable bottom-sheet dropdown — matches Input styling.
// Accepts string[] or { label, value }[] options.

import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | DropdownOption[];
  placeholder?: string;
  leftIcon?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

function normalise(options: string[] | DropdownOption[]): DropdownOption[] {
  return (options as any[]).map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );
}

export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  leftIcon,
  error,
  disabled = false,
  containerStyle,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const items = normalise(options);
  const selected = items.find((o) => o.value === value);
  const hasError = !!error;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* ── Trigger ───────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          styles.box,
          hasError && styles.boxError,
          disabled && styles.boxDisabled,
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {leftIcon ? (
          <Icon
            name={leftIcon}
            size={18}
            color={Colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <View style={styles.textContainer}>
          <Text
            style={[styles.value, !selected && styles.placeholder]}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </Text>
        </View>

        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={disabled ? Colors.textDisabled : Colors.textMuted}
        />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* ── Centered modal ─────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          {/* Backdrop tap-to-dismiss */}
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          <View style={styles.sheet}>
            {/* Title */}
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}

            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => {
                const active = item.value === value;
                const isLast = index === items.length - 1;
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      active && styles.optionActive,
                      isLast && styles.optionLast,
                    ]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <Icon
                        name="check-circle"
                        size={18}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Trigger ───────────────────────────────────────────────
  wrap: { marginBottom: Spacing.md },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    minWidth: 120,
  },
  boxError: { borderColor: Colors.error },
  boxDisabled: { opacity: 0.5 },
  leftIcon: { marginRight: Spacing.sm },
  textContainer: { flex: 1 },
  value: {
    color: "#ffffff",
    fontSize: 15,
  },
  placeholder: { color: "#ffffff80" },
  error: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: 5,
  },

  // ── Centered modal ────────────────────────────────────────
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.primaryFaded },
  optionLast: { borderBottomWidth: 0 },
  optionText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
