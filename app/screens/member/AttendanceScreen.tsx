// mobile/src/screens/member/AttendanceScreen.tsx
import { memberAttendanceApi } from "@/api/endpoints";
import { Header, Skeleton, SkeletonGroup, StatCard } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
  MemberAttendanceIndividual,
  MemberAttendanceRecord,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AttendanceScreen() {
  const qc = useQueryClient();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  const { data, isLoading, refetch, isRefetching } =
    useQuery<MemberAttendanceRecord>({
      queryKey: ["memberAttendance"],
      queryFn: () =>
        memberAttendanceApi.list({
          page: 1,
        }) as Promise<MemberAttendanceRecord>,
      staleTime: 60_000,
    });

  const checkInMutation = useMutation({
    mutationFn: memberAttendanceApi.checkIn,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["memberAttendance"] });
      qc.invalidateQueries({ queryKey: ["memberDashboard"] });
      Toast.show({
        type: "success",
        text1: res?.message ?? "Checked in! 🔥",
        position: "top",
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: err?.message ?? "Check-in failed",
        position: "top",
      });
    },
  });

  const records: MemberAttendanceIndividual[] = data?.records ?? [];
  const streak = data?.streak ?? { current: 0, longest: 0, total: 0 };
  const checkedInToday = data?.checkedInToday ?? false;
  const thisMonth = data?.thisMonth ?? 0;

  // Build a set of unique attended date strings from all records
  const attendedDates = useMemo(() => {
    const s = new Set<string>();
    for (const r of records) {
      s.add(toDateStr(new Date(r.checkInTime)));
    }
    return s;
  }, [records]);

  // Calendar grid cells for the viewed month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<number | null> = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );

  const currentMonthLabel = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const todayStr = toDateStr(now);
  const isViewingCurrentMonth =
    calYear === now.getFullYear() && calMonth === now.getMonth();
  const canGoNext = !isViewingCurrentMonth;

  // Stats for the viewed month
  const monthStats = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const lastDay = isViewingCurrentMonth ? now.getDate() : daysInMonth;
    let present = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (attendedDates.has(dateStr)) present++;
    }
    const absent = lastDay - present;
    const rate = lastDay > 0 ? Math.round((present / lastDay) * 100) : 0;
    return { present, absent, rate };
  }, [calYear, calMonth, attendedDates, isViewingCurrentMonth, now]);

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (!canGoNext) return;
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  const checkInRight = checkedInToday ? (
    <View style={st.checkedInBadge}>
      <Icon name="check-circle-outline" size={13} color={Colors.success} />
      <Text style={st.checkedInText}>Checked in today</Text>
    </View>
  ) : (
    <TouchableOpacity
      style={st.checkInBtn}
      onPress={() => checkInMutation.mutate()}
      disabled={checkInMutation.isPending}
      activeOpacity={0.8}
    >
      {checkInMutation.isPending ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Icon name="lightning-bolt" size={13} color={Colors.primary} />
      )}
      <Text style={st.checkInBtnText}>
        {checkInMutation.isPending ? "Checking in…" : "Check In"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <View style={st.headerWrap}>
        <Header
          title="Attendance"
          subtitle={currentMonthLabel}
          menu
          right={isLoading ? undefined : checkInRight}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Stats row ── */}
        {isLoading ? (
          <Skeleton height={96} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.statsRow}
          >
            <StatCard
              style={{ marginRight: Spacing.sm }}
              icon="fire"
              value={streak.current}
              label="Current Streak"
              sub="days"
              color={Colors.primary}
              bg={Colors.primaryFaded}
            />
            <StatCard
              style={{ marginRight: Spacing.sm }}
              icon="star"
              value={streak.longest}
              label="Longest Streak"
              sub="days"
              color={Colors.warning}
              bg={Colors.warningFaded}
            />
            <StatCard
              style={{ marginRight: Spacing.sm }}
              icon="calendar-check"
              value={thisMonth}
              label="This Month"
              sub={`${monthStats.rate}% rate`}
              color="#3b82f6"
              bg="rgba(59,130,246,0.12)"
            />
            <StatCard
              style={{ marginRight: Spacing.sm }}
              icon="trophy-outline"
              value={streak.total}
              label="All Time"
              sub="total check-ins"
              color="#a855f7"
              bg="rgba(168,85,247,0.12)"
            />
          </ScrollView>
        )}

        {/* ── Calendar card ── */}
        {isLoading ? (
          <Skeleton height={320} />
        ) : (
          <View style={st.calCard}>
            {/* Title + legend */}
            <View style={st.calTitleRow}>
              <View style={st.calTitleLeft}>
                <Icon
                  name="calendar-month-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={st.calTitle}>{monthLabel}</Text>
              </View>
              <View style={st.legendRow}>
                <View style={st.legendItem}>
                  <View
                    style={[st.legendDot, { backgroundColor: Colors.success }]}
                  />
                  <Text style={st.legendText}>Attended</Text>
                </View>
                <View style={st.legendItem}>
                  <View
                    style={[
                      st.legendDot,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1.5,
                        borderColor: Colors.primary,
                      },
                    ]}
                  />
                  <Text style={st.legendText}>Today</Text>
                </View>
              </View>
            </View>

            {/* Month navigation */}
            <View style={st.calNavRow}>
              <TouchableOpacity onPress={prevMonth} style={st.navBtn}>
                <Icon
                  name="chevron-left"
                  size={20}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={st.monthNavLabel}>{monthLabel}</Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={st.navBtn}
                disabled={!canGoNext}
              >
                <Icon
                  name="chevron-right"
                  size={20}
                  color={canGoNext ? Colors.textPrimary : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={st.weekRow}>
              {DAY_LABELS.map((l) => (
                <Text key={l} style={st.dayLabel}>
                  {l}
                </Text>
              ))}
            </View>

            {/* Day cells */}
            <View style={st.grid}>
              {calendarDays.map((day, i) => {
                if (day === null)
                  return <View key={`e-${i}`} style={st.cell} />;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isAttended = attendedDates.has(dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                return (
                  <View
                    key={dateStr}
                    style={[
                      st.cell,
                      isAttended && st.cellAttended,
                      isToday && !isAttended && st.cellToday,
                    ]}
                  >
                    <Text
                      style={[
                        st.dayNum,
                        isAttended && st.dayNumAttended,
                        isToday && !isAttended && st.dayNumToday,
                        isFuture && st.dayNumFuture,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Present / Absent / Rate */}
            <View style={st.calStatsRow}>
              <View style={st.calStat}>
                <Text style={[st.calStatVal, { color: Colors.success }]}>
                  {monthStats.present}
                </Text>
                <Text style={st.calStatLabel}>Present</Text>
              </View>
              <View style={st.calStatDivider} />
              <View style={st.calStat}>
                <Text style={[st.calStatVal, { color: Colors.error }]}>
                  {monthStats.absent}
                </Text>
                <Text style={st.calStatLabel}>Absent</Text>
              </View>
              <View style={st.calStatDivider} />
              <View style={st.calStat}>
                <Text style={[st.calStatVal, { color: Colors.primary }]}>
                  {monthStats.rate}%
                </Text>
                <Text style={st.calStatLabel}>Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Recent History ── */}
        <View style={st.historyCard}>
          <View style={st.historyHeader}>
            <Icon name="clock-outline" size={15} color={Colors.primary} />
            <Text style={st.historyTitle}>Recent History</Text>
          </View>

          {isLoading ? (
            <SkeletonGroup variant="listRow" count={4} />
          ) : records.length === 0 ? (
            <View style={st.emptyHistory}>
              <Icon
                name="calendar-blank-outline"
                size={32}
                color={Colors.textMuted}
              />
              <Text style={st.emptyHistoryText}>No attendance records yet</Text>
            </View>
          ) : (
            <>
              <View style={st.tableHeader}>
                <Text style={[st.tableHeaderText, { flex: 2 }]}>DATE</Text>
                <Text style={[st.tableHeaderText, { flex: 1.5 }]}>
                  CHECK IN
                </Text>
                <Text
                  style={[
                    st.tableHeaderText,
                    { flex: 1.5, textAlign: "right" },
                  ]}
                >
                  CHECK OUT
                </Text>
              </View>
              <View style={st.tableDivider} />
              {records.map((r, idx) => {
                const cin = new Date(r.checkInTime);
                const cout = r.checkOutTime ? new Date(r.checkOutTime) : null;
                const dateLabel = cin.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const cinLabel = cin
                  .toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .toLowerCase();
                const coutLabel = cout
                  ? cout
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .toLowerCase()
                  : null;

                return (
                  <View key={r.id}>
                    {idx > 0 && <View style={st.rowDivider} />}
                    <View style={st.tableRow}>
                      <Text style={[st.tableCell, { flex: 2 }]}>
                        {dateLabel}
                      </Text>
                      <Text style={[st.tableCell, { flex: 1.5 }]}>
                        {cinLabel}
                      </Text>
                      {coutLabel ? (
                        <Text
                          style={[
                            st.tableCell,
                            { flex: 1.5, textAlign: "right" },
                          ]}
                        >
                          {coutLabel}
                        </Text>
                      ) : (
                        <Text
                          style={[
                            st.tableCellGreen,
                            { flex: 1.5, textAlign: "right" },
                          ]}
                        >
                          In gym
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 42;

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  scroll: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
    gap: Spacing.lg,
  },

  // Check-in header right
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  checkedInText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  checkInBtnText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },

  // Calendar card
  calCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  calTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  calTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  calNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  navBtn: { padding: 4 },
  monthNavLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%` as any,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  cellAttended: {
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
  },
  dayNum: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  dayNumAttended: { color: Colors.success, fontWeight: "700" },
  dayNumToday: { color: Colors.primary, fontWeight: "700" },
  dayNumFuture: { color: Colors.textMuted, opacity: 0.4 },

  // Calendar bottom stats
  calStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  calStat: { flex: 1, alignItems: "center" },
  calStatVal: {
    fontSize: Typography.xl,
    fontWeight: "800",
  },
  calStatLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  calStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Recent history
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  historyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyHistoryText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.sm,
  },
  tableHeaderText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tableDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  tableCell: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  tableCellGreen: {
    color: Colors.success,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
