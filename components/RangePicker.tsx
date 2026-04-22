// components/RangePicker.tsx
// Dashboard range selector — preset options + react-native-calendars date range.

import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export interface RangeOption {
  key: string;
  label: string;
}

interface RangePickerProps {
  options: RangeOption[];
  value: string;
  customStart?: string;
  customEnd?: string;
  onChange: (range: string, customStart?: string, customEnd?: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtShort(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Build the `markedDates` map required by react-native-calendars for a period range.
function buildMarkedDates(start: string, end: string): Record<string, object> {
  if (!start && !end) return {};

  const marked: Record<string, object> = {};
  const primary = Colors.primary;
  const faded = Colors.primaryFaded;

  if (start && !end) {
    marked[start] = {
      startingDay: true,
      endingDay: true,
      color: primary,
      textColor: "#fff",
    };
    return marked;
  }

  if (!start && end) {
    marked[end] = {
      startingDay: true,
      endingDay: true,
      color: primary,
      textColor: "#fff",
    };
    return marked;
  }

  // Both set — fill the range
  const cur = new Date(start);
  const last = new Date(end);

  while (cur <= last) {
    const ds = toStr(cur);
    const isStart = ds === start;
    const isEnd = ds === end;
    marked[ds] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? primary : faded,
      textColor: isStart || isEnd ? "#fff" : Colors.primary,
    };
    cur.setDate(cur.getDate() + 1);
  }

  return marked;
}

// ── Calendar theme ────────────────────────────────────────────────────────────

const calTheme = {
  backgroundColor: "transparent",
  calendarBackground: "transparent",
  textSectionTitleColor: Colors.textMuted,
  selectedDayBackgroundColor: Colors.primary,
  selectedDayTextColor: "#fff",
  todayTextColor: Colors.primary,
  dayTextColor: Colors.textSecondary,
  textDisabledColor: Colors.textDisabled,
  dotColor: Colors.primary,
  arrowColor: Colors.primary,
  monthTextColor: Colors.textPrimary,
  textMonthFontSize: 15,
  textMonthFontWeight: "700" as const,
  textDayFontSize: 13,
  textDayHeaderFontSize: 11,
  textDayHeaderFontWeight: "600" as const,
  "stylesheet.calendar.header": {
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: 4,
      marginBottom: 8,
    },
  },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const YEAR_MIN = 2015;
const MONTH_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── RangePicker ───────────────────────────────────────────────────────────────

export function RangePicker({
  options,
  value,
  customStart = "",
  customEnd = "",
  onChange,
}: RangePickerProps) {
  const todayStr = toStr(new Date());
  const todayYear = new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(customStart);
  const [localEnd, setLocalEnd] = useState(customEnd);
  const [picking, setPicking] = useState<"start" | "end">("start");

  // Tracks the month displayed in the calendar ("YYYY-MM-DD")
  const [currentMonth, setCurrentMonth] = useState(todayStr);
  // When true, the year grid replaces the calendar
  const [showYearGrid, setShowYearGrid] = useState(false);
  // Incrementing this key forces Calendar to re-render at the new month
  const calKey = useRef(0);

  const presets = options.filter((o) => o.key !== "custom");
  const hasCustom = options.some((o) => o.key === "custom");
  const selected = options.find((o) => o.key === value);
  const canApply = !!localStart && !!localEnd && localStart <= localEnd;

  const markedDates = buildMarkedDates(localStart, localEnd);

  function handleOpen() {
    setLocalStart(customStart);
    setLocalEnd(customEnd);
    setPicking("start");
    setOpen(true);
  }

  function handlePreset(key: string) {
    onChange(key);
    setOpen(false);
  }

  function handleDayPress(day: { dateString: string }) {
    const ds = day.dateString;
    if (picking === "start") {
      setLocalStart(ds);
      setLocalEnd("");
      setPicking("end");
    } else {
      if (ds < localStart) {
        // Tapped before start — restart
        setLocalStart(ds);
        setLocalEnd("");
        setPicking("end");
      } else {
        setLocalEnd(ds);
        setPicking("start");
      }
    }
  }

  function handleApply() {
    if (!canApply) return;
    onChange("custom", localStart, localEnd);
    setOpen(false);
  }

  // Trigger label
  let displayLabel = selected?.label ?? "Select range";
  if (value === "custom" && customStart && customEnd) {
    displayLabel = `${fmtShort(customStart)} → ${fmtShort(customEnd)}`;
  }

  return (
    <View>
      {/* ── Trigger ───────────────────────────────────────────── */}
      <TouchableOpacity
        style={s.trigger}
        onPress={handleOpen}
        activeOpacity={0.75}
      >
        <Icon name="calendar-range" size={15} color={Colors.textMuted} />
        <Text style={s.triggerLabel} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Icon name="chevron-down" size={15} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* ── Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.backdrop}>
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Select Range</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Presets */}
              {presets.map((item) => {
                const active = item.key === value;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[s.option, active && s.optionActive]}
                    onPress={() => handlePreset(item.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.optionText, active && s.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active && (
                      <Icon
                        name="check-circle"
                        size={16}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Custom range */}
              {hasCustom && (
                <View style={s.customSection}>
                  <Text
                    style={[
                      s.customTitle,
                      value === "custom" && s.customTitleActive,
                    ]}
                  >
                    Custom Range
                  </Text>

                  {/* Date pills */}
                  <View style={s.dateRow}>
                    <TouchableOpacity
                      style={[
                        s.datePill,
                        picking === "start" && s.datePillActive,
                      ]}
                      onPress={() => setPicking("start")}
                      activeOpacity={0.75}
                    >
                      <Icon
                        name="calendar-arrow-left"
                        size={14}
                        color={
                          picking === "start"
                            ? Colors.primary
                            : Colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          s.datePillText,
                          localStart ? s.datePillTextSet : s.datePillTextEmpty,
                          picking === "start" && s.datePillTextActive,
                        ]}
                      >
                        {localStart ? fmtShort(localStart) : "Start date"}
                      </Text>
                    </TouchableOpacity>

                    <Icon
                      name="arrow-right"
                      size={13}
                      color={Colors.textMuted}
                    />

                    <TouchableOpacity
                      style={[
                        s.datePill,
                        picking === "end" && s.datePillActive,
                      ]}
                      onPress={() => localStart && setPicking("end")}
                      activeOpacity={0.75}
                    >
                      <Icon
                        name="calendar-arrow-right"
                        size={14}
                        color={
                          picking === "end" ? Colors.primary : Colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          s.datePillText,
                          localEnd ? s.datePillTextSet : s.datePillTextEmpty,
                          picking === "end" && s.datePillTextActive,
                        ]}
                      >
                        {localEnd ? fmtShort(localEnd) : "End date"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Picking hint */}
                  <Text style={s.hint}>
                    {picking === "start"
                      ? "Tap a day to set the start date"
                      : "Tap a day to set the end date"}
                  </Text>

                  {/* Calendar */}
                  <View style={s.calendarWrap}>
                    {showYearGrid ? (
                      /* ── Year grid ───────────────────────────────── */
                      <ScrollView
                        style={s.yearScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        <View style={s.yearGrid}>
                          {Array.from(
                            { length: todayYear - YEAR_MIN + 1 },
                            (_, i) => todayYear - i,
                          ).map((yr) => {
                            const isActive =
                              yr === Number(currentMonth.slice(0, 4));
                            return (
                              <TouchableOpacity
                                key={yr}
                                style={[
                                  s.yearCell,
                                  isActive && s.yearCellActive,
                                ]}
                                onPress={() => {
                                  const mm = currentMonth.slice(5, 7);
                                  const next = `${yr}-${mm}-01`;
                                  setCurrentMonth(next);
                                  calKey.current += 1;
                                  setShowYearGrid(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    s.yearText,
                                    isActive && s.yearTextActive,
                                  ]}
                                >
                                  {yr}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    ) : (
                      /* ── Month calendar ──────────────────────────── */
                      <Calendar
                        key={calKey.current}
                        current={currentMonth}
                        theme={calTheme}
                        maxDate={todayStr}
                        markingType="period"
                        markedDates={markedDates}
                        onDayPress={handleDayPress}
                        onMonthChange={(m) =>
                          setCurrentMonth(
                            `${m.year}-${String(m.month).padStart(2, "0")}-01`,
                          )
                        }
                        renderHeader={(date) => {
                          const d = new Date(date as string);
                          const label = `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
                          return (
                            <TouchableOpacity
                              style={s.calHeader}
                              onPress={() => setShowYearGrid(true)}
                              activeOpacity={0.7}
                            >
                              <Text style={s.calHeaderText}>{label}</Text>
                              <Icon
                                name="menu-down"
                                size={18}
                                color={Colors.primary}
                              />
                            </TouchableOpacity>
                          );
                        }}
                        enableSwipeMonths
                        hideExtraDays
                      />
                    )}
                  </View>

                  {/* Apply */}
                  <TouchableOpacity
                    style={[s.applyBtn, !canApply && s.applyBtnDisabled]}
                    onPress={handleApply}
                    disabled={!canApply}
                    activeOpacity={0.8}
                  >
                    <Icon name="check" size={15} color="#fff" />
                    <Text style={s.applyBtnText}>Apply Range</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  triggerLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    width: "96%",
    maxHeight: "88%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.primaryFaded },
  optionText: { color: Colors.textPrimary, fontSize: Typography.sm },
  optionTextActive: { color: Colors.primary, fontWeight: "600" },
  customSection: { padding: Spacing.lg },
  customTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  customTitleActive: { color: Colors.primary },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  datePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
  },
  datePillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  datePillText: { fontSize: 12, flex: 1 },
  datePillTextEmpty: { color: Colors.textDisabled },
  datePillTextSet: { color: Colors.textSecondary },
  datePillTextActive: { color: Colors.primary, fontWeight: "600" },
  hint: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontStyle: "italic",
  },
  calendarWrap: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 11,
  },
  applyBtnDisabled: { opacity: 0.35 },
  applyBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },

  // Year grid
  yearScroll: { maxHeight: 220 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap" },
  yearCell: {
    width: "25%",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
  },
  yearCellActive: { backgroundColor: Colors.primary },
  yearText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: "500" },
  yearTextActive: { color: "#fff", fontWeight: "700" },

  // Custom calendar header
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  calHeaderText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
});
