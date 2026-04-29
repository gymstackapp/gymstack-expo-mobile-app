// components/DatePickerInput.tsx
// Tap-to-open date picker modal with scrollable day/month/year columns.
// Returns the selected date as a "YYYY-MM-DD" string.

import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useEffect, useRef, useState } from "react";
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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ITEM_H = 48;

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function buildYears(minYear?: number, maxYear?: number): number[] {
  const now = new Date().getFullYear();
  const max = maxYear ?? now;
  const min = minYear ?? now - 100;
  const years: number[] = [];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}

// ── Single column ─────────────────────────────────────────────────────────────

function Column<T extends string | number>({
  items,
  selected,
  onSelect,
  label,
}: {
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  label?: string;
}) {
  const listRef = useRef<FlatList<T>>(null);
  const idx = items.indexOf(selected);

  useEffect(() => {
    if (idx >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: idx,
          animated: false,
          viewPosition: 0.5,
        });
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={col.wrap}>
      {label ? <Text style={col.header}>{label}</Text> : null}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const active = item === selected;
          return (
            <TouchableOpacity
              style={[col.item, active && col.itemActive]}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[col.text, active && col.textActive]}
                numberOfLines={1}
              >
                {typeof item === "number" ? String(item) : item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const col = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    fontWeight: "600",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  itemActive: { backgroundColor: Colors.primaryFaded },
  text: { color: Colors.textSecondary, fontSize: Typography.sm },
  textActive: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: Typography.base,
  },
});

// ── DatePickerInput ───────────────────────────────────────────────────────────

interface DatePickerInputProps {
  label?: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxDate?: "today"; // restrict to today or before
  minYear?: number;
  maxYear?: number;
  containerStyle?: ViewStyle;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  maxDate,
  minYear,
  maxYear,
  containerStyle,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  // Parse the initial value or default to today
  const parseVal = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m, day: d };
    }
    return { year: currentYear, month: currentMonth, day: currentDay };
  };

  const [tempYear, setTempYear] = useState(parseVal().year);
  const [tempMonth, setTempMonth] = useState(parseVal().month);
  const [tempDay, setTempDay] = useState(parseVal().day);

  const maxY = maxYear ?? (maxDate === "today" ? currentYear : currentYear);
  const years = buildYears(minYear, maxY);
  const days = Array.from(
    { length: daysInMonth(tempMonth, tempYear) },
    (_, i) => i + 1,
  );
  const months = MONTHS.map((name, i) => ({ label: name, value: i + 1 }));

  // Clamp day when month/year changes
  useEffect(() => {
    const max = daysInMonth(tempMonth, tempYear);
    if (tempDay > max) setTempDay(max);
  }, [tempMonth, tempYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const open_ = () => {
    const p = parseVal();
    setTempYear(p.year);
    setTempMonth(p.month);
    setTempDay(p.day);
    setOpen(true);
  };

  const confirm = () => {
    const mm = String(tempMonth).padStart(2, "0");
    const dd = String(tempDay).padStart(2, "0");
    onChange(`${tempYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setOpen(false);
  };

  const display =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? (() => {
          const [y, m, d] = value.split("-").map(Number);
          return `${d} ${SHORT_MONTHS[m - 1]} ${y}`;
        })()
      : null;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.box, !!error && styles.boxError]}
        onPress={open_}
        activeOpacity={0.7}
      >
        <Icon
          name="calendar-outline"
          size={18}
          color={Colors.textMuted}
          style={styles.icon}
        />
        <Text
          style={[styles.value, !display && styles.placeholder]}
          numberOfLines={1}
        >
          {display ?? placeholder}
        </Text>
        {display && (
          <TouchableOpacity
            onPress={() => onChange("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label ?? "Select Date"}</Text>

            <View style={styles.columns}>
              {/* Day column */}
              <Column
                items={days}
                selected={tempDay}
                onSelect={setTempDay}
                label="Day"
              />
              {/* Month column */}
              <Column
                items={months.map((m) => m.label)}
                selected={MONTHS[tempMonth - 1]}
                onSelect={(name) => setTempMonth(MONTHS.indexOf(name) + 1)}
                label="Month"
              />
              {/* Year column */}
              <Column
                items={years}
                selected={tempYear}
                onSelect={setTempYear}
                label="Year"
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  boxError: { borderColor: Colors.error },
  icon: { marginRight: Spacing.sm },
  value: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  placeholder: { color: Colors.textMuted },
  error: { color: Colors.error, fontSize: Typography.xs, marginTop: 5 },

  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    width: "90%",
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
  },
  columns: {
    flexDirection: "row",
    height: ITEM_H * 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  clearBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { color: Colors.textMuted, fontSize: Typography.sm },
  confirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});
