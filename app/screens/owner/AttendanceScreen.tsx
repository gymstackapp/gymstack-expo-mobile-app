// mobile/src/screens/owner/AttendanceScreen.tsx
import { gymsApi, ownerAttendanceApi } from "@/api/endpoints";
import {
  Avatar,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, OwnerAttendanceRecord } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { startDate: toDateStr(start), endDate: toDateStr(end) };
}

export default function OwnerAttendanceScreen() {
  const { hasAttendance } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  // Fetch all records for the calendar month (no search) to build day counts
  const { startDate, endDate } = monthRange(calYear, calMonth);
  const { data: monthRecords = [] } = useQuery<OwnerAttendanceRecord[]>({
    queryKey: ["ownerAttendanceMonth", gymId, calYear, calMonth],
    queryFn: async () => {
      const res = (await ownerAttendanceApi.list({
        gymId: gymId || undefined,
        startDate,
        endDate,
      })) as OwnerAttendanceRecord[] | { records: OwnerAttendanceRecord[] };
      return Array.isArray(res) ? res : (res.records ?? []);
    },
    enabled: hasAttendance,
    staleTime: 60_000,
  });

  // Fetch records for the list (filtered by selectedDate or today, with search)
  const listDate = selectedDate ?? toDateStr(now);
  const {
    data: listRecords = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<OwnerAttendanceRecord[]>({
    queryKey: ["ownerAttendanceDay", gymId, listDate, search],
    queryFn: async () => {
      const res = (await ownerAttendanceApi.list({
        gymId: gymId || undefined,
        date: listDate,
        search: search || undefined,
      })) as OwnerAttendanceRecord[] | { records: OwnerAttendanceRecord[] };
      return Array.isArray(res) ? res : (res.records ?? []);
    },
    enabled: hasAttendance,
    staleTime: 30_000,
  });

  // Build a map of date -> count from monthRecords
  const dayCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of monthRecords) {
      const d = toDateStr(new Date(r.checkInTime));
      map[d] = (map[d] ?? 0) + 1;
    }
    return map;
  }, [monthRecords]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<number | null> = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  const todayStr = toDateStr(now);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.top}>
        <Header title="Attendance" back />
        {gyms.length > 1 && (
          <View style={st.pills}>
            {[{ id: "", name: "All" } as Gym, ...gyms].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[st.pill, gymId === g.id && st.pillA]}
              >
                <Text style={[st.pillT, gymId === g.id && st.pillTA]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PlanGate allowed={hasAttendance} featureLabel="Attendance Tracking">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* ── Calendar ── */}
          <View style={st.calCard}>
            {/* Month navigation */}
            <View style={st.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={st.navBtn}>
                <Icon
                  name="chevron-left"
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={st.monthLabel}>{monthLabel}</Text>
              <TouchableOpacity onPress={nextMonth} style={st.navBtn}>
                <Icon
                  name="chevron-right"
                  size={22}
                  color={Colors.textPrimary}
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
                if (day === null) {
                  return <View key={`e-${i}`} style={st.cell} />;
                }
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const count = dayCounts[dateStr] ?? 0;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isFuture = dateStr > todayStr;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      st.cell,
                      isSelected && st.cellSelected,
                      isToday && !isSelected && st.cellToday,
                    ]}
                    onPress={() =>
                      setSelectedDate(isSelected ? null : dateStr)
                    }
                    disabled={isFuture}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        st.dayNum,
                        isSelected && st.dayNumSelected,
                        isToday && !isSelected && st.dayNumToday,
                        isFuture && st.dayNumFuture,
                      ]}
                    >
                      {day}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          st.countBadge,
                          isSelected && st.countBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            st.countText,
                            isSelected && st.countTextSelected,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── List section ── */}
          <View style={st.listHeader}>
            <Text style={st.listTitle}>
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    { weekday: "long", day: "numeric", month: "long" }
                  )
                : "Today"}
            </Text>
            <Text style={st.listCount}>
              {listRecords.length} check-ins
            </Text>
          </View>

          {/* Search */}
          <View
            style={[st.searchBox, { marginHorizontal: Spacing.lg, marginBottom: Spacing.md }]}
          >
            <Icon name="magnify" size={18} color={Colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search member..."
              placeholderTextColor={Colors.textMuted}
              style={st.searchInput}
            />
          </View>

          {isLoading ? (
            <View style={{ paddingHorizontal: Spacing.lg }}>
              <SkeletonGroup variant="listRow" count={5} />
            </View>
          ) : listRecords.length === 0 ? (
            <EmptyState
              icon="calendar-check-outline"
              title="No check-ins"
              subtitle={
                selectedDate
                  ? "No attendance recorded for this day"
                  : "No check-ins today"
              }
            />
          ) : (
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: 32 }}>
              {listRecords.map((r, idx) => {
                const cin = new Date(r.checkInTime);
                const cout = r.checkOutTime
                  ? new Date(r.checkOutTime)
                  : null;
                const dur = cout
                  ? Math.round((cout.getTime() - cin.getTime()) / 60000)
                  : null;
                const isLive = !cout && toDateStr(cin) === todayStr;

                return (
                  <View key={r.id}>
                    {idx > 0 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: Colors.border,
                        }}
                      />
                    )}
                    <View style={st.row}>
                      <Avatar
                        name={r.member?.profile?.fullName ?? "?"}
                        url={r.member?.profile?.avatarUrl}
                        size={38}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text style={st.name}>
                          {r.member?.profile?.fullName}
                        </Text>
                        <Text style={st.sub}>
                          {cin.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {cout
                            ? ` – ${cout.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        {dur !== null && dur > 0 ? (
                          <Text style={st.dur}>{dur}m</Text>
                        ) : null}
                        {isLive ? (
                          <View style={st.activeDot}>
                            <Text style={st.activeTxt}>Live</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  pills: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillA: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  pillT: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTA: { color: Colors.primary, fontWeight: "700" },

  // Calendar
  calCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  navBtn: { padding: 6 },
  monthLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
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
    gap: 2,
  },
  cellToday: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.md,
  },
  cellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  dayNum: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  dayNumToday: { color: Colors.primary, fontWeight: "700" },
  dayNumSelected: { color: "#fff", fontWeight: "700" },
  dayNumFuture: { color: Colors.textMuted, opacity: 0.4 },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    minWidth: 16,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  countBadgeSelected: { backgroundColor: "rgba(255,255,255,0.3)" },
  countText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  countTextSelected: { color: "#fff" },

  // List
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  listTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  listCount: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    paddingVertical: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  sub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  dur: { color: Colors.textMuted, fontSize: Typography.xs },
  activeDot: {
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeTxt: { color: Colors.success, fontSize: 10, fontWeight: "700" },
});
