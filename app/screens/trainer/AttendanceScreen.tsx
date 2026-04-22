// app/screens/trainer/AttendanceScreen.tsx
// Members attendance for a selected date + monthly check-in summary per member.

import { trainerAttendanceApi } from "@/api/endpoints";
import { Avatar, Card, Header, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { timeStyle: "short" });
}

function duration(ci: string, co: string | null) {
  if (!co) return null;
  const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60_000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function prevDate(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function nextDate(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const days = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(days).padStart(2, "0")}`,
  };
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function AttendanceScreen() {
  const [date, setDate] = useState(todayISO());
  const isToday = date === todayISO();

  const { data, isLoading, refetch, isRefetching } = useQuery<{
    records: any[];
    members: any[];
  }>({
    queryKey: ["trainerAttendance", date],
    queryFn: () => trainerAttendanceApi.list({ date }) as Promise<any>,
    staleTime: 30_000,
  });

  const records = data?.records ?? [];
  const members = data?.members ?? [];

  const { start, end } = monthRange();
  const { data: monthData } = useQuery<{ records: any[] }>({
    queryKey: ["trainerAttendanceMonth"],
    queryFn: () => trainerAttendanceApi.list({ date: start, endDate: end }) as Promise<any>,
    staleTime: 60_000,
    enabled: members.length > 0,
  });

  const monthlyCounts: Record<string, number> = {};
  (monthData?.records ?? []).forEach((r: any) => {
    monthlyCounts[r.memberId] = (monthlyCounts[r.memberId] ?? 0) + 1;
  });

  const checkedInIds = new Set(records.map((r: any) => r.memberId));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header menu title="Attendance" />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
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
        {/* ── Date navigator ─────────────────────────────────── */}
        <View style={s.datePicker}>
          <TouchableOpacity style={s.dateArrow} onPress={() => setDate(prevDate(date))}>
            <Icon name="chevron-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.dateCenter}>
            <Text style={s.dateTxt}>{isToday ? "Today" : fmtDate(date)}</Text>
            <Text style={s.dateSub}>{fmtDate(date)}</Text>
          </View>
          <TouchableOpacity
            style={[s.dateArrow, isToday && s.dateArrowDisabled]}
            onPress={() => { if (!isToday) setDate(nextDate(date)); }}
            disabled={isToday}
          >
            <Icon name="chevron-right" size={22} color={isToday ? Colors.textMuted : Colors.textPrimary} />
          </TouchableOpacity>
          {!isToday && (
            <TouchableOpacity style={s.todayBtn} onPress={() => setDate(todayISO())}>
              <Text style={s.todayBtnTxt}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Summary chips ──────────────────────────────────── */}
        <View style={s.chips}>
          <View style={[s.chip, { backgroundColor: Colors.primaryFaded }]}>
            <Icon name="calendar-check-outline" size={14} color={Colors.primary} />
            <Text style={[s.chipTxt, { color: Colors.primary }]}>
              {records.length} check-in{records.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={[s.chip, { backgroundColor: Colors.successFaded }]}>
            <Icon name="account-group-outline" size={14} color={Colors.success} />
            <Text style={[s.chipTxt, { color: Colors.success }]}>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* ── Check-ins for selected date ────────────────────── */}
        <Card>
          <View style={s.cardHeader}>
            <Icon name="calendar-check-outline" size={15} color={Colors.primary} />
            <Text style={s.cardTitle}>
              {isToday ? "Today's Check-Ins" : `Check-Ins · ${fmtDate(date)}`}
            </Text>
            <View style={s.countBadge}>
              <Text style={s.countTxt}>{records.length}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={{ gap: Spacing.md }}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={{ flexDirection: "row", gap: Spacing.md, alignItems: "center" }}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton height={13} width="55%" />
                    <Skeleton height={10} width="35%" />
                  </View>
                </View>
              ))}
            </View>
          ) : records.length === 0 ? (
            <View style={s.empty}>
              <Icon name="calendar-blank-outline" size={36} color={Colors.border} />
              <Text style={s.emptyTxt}>No check-ins{isToday ? " today" : ` on ${fmtDate(date)}`}</Text>
            </View>
          ) : (
            <View style={{ gap: 0 }}>
              {records.map((r: any, i: number) => {
                const dur = duration(r.checkInTime, r.checkOutTime);
                return (
                  <View
                    key={r.id}
                    style={[s.row, i < records.length - 1 && s.rowBorder]}
                  >
                    <Avatar
                      name={r.member?.profile?.fullName ?? "?"}
                      url={r.member?.profile?.avatarUrl}
                      size={40}
                    />
                    <View style={s.rowInfo}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {r.member?.profile?.fullName}
                      </Text>
                      <Text style={s.rowSub}>
                        In: {fmtTime(r.checkInTime)}
                        {r.checkOutTime ? ` · Out: ${fmtTime(r.checkOutTime)}` : ""}
                      </Text>
                    </View>
                    {r.checkOutTime ? (
                      <Text style={s.durTxt}>{dur}</Text>
                    ) : (
                      <View style={s.inGymBadge}>
                        <View style={s.inGymDot} />
                        <Text style={s.inGymTxt}>In gym</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* ── Monthly summary ────────────────────────────────── */}
        {members.length > 0 && (
          <Card>
            <View style={s.cardHeader}>
              <Icon name="chart-bar" size={15} color={Colors.primary} />
              <Text style={s.cardTitle}>This Month</Text>
              <Text style={s.cardSub}>
                {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </Text>
            </View>
            <View style={{ gap: 0 }}>
              {members.map((m: any, i: number) => {
                const count = monthlyCounts[m.id] ?? 0;
                const checkedToday = checkedInIds.has(m.id);
                return (
                  <View
                    key={m.id}
                    style={[s.row, i < members.length - 1 && s.rowBorder]}
                  >
                    <Avatar name={m.profile?.fullName ?? "?"} url={m.profile?.avatarUrl} size={36} />
                    <View style={s.rowInfo}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {m.profile?.fullName}
                      </Text>
                      <Text style={s.rowSub}>{count} day{count !== 1 ? "s" : ""} this month</Text>
                    </View>
                    {checkedToday ? (
                      <Icon name="check-circle" size={18} color={Colors.success} />
                    ) : (
                      <View style={s.absentDot} />
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── No members empty state ─────────────────────────── */}
        {!isLoading && members.length === 0 && (
          <View style={s.noMembers}>
            <Icon name="account-group-outline" size={48} color={Colors.border} />
            <Text style={s.noMembersTitle}>No clients yet</Text>
            <Text style={s.noMembersSub}>
              Ask the gym owner to assign members to you to track their attendance.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  // Date picker
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  dateArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
  },
  dateArrowDisabled: { opacity: 0.3 },
  dateCenter: { flex: 1, alignItems: "center" },
  dateTxt: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  dateSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  todayBtn: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + "50",
  },
  todayBtnTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  // Chips
  chips: { flexDirection: "row", gap: Spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  chipTxt: { fontSize: Typography.xs, fontWeight: "600" },
  // Card header
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md },
  cardTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700", flex: 1 },
  cardSub: { color: Colors.textMuted, fontSize: Typography.xs },
  countBadge: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  // Rows
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  rowSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  durTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  inGymBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inGymDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  inGymTxt: { color: Colors.success, fontSize: 10, fontWeight: "700" },
  absentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  // Empty
  empty: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  noMembers: { alignItems: "center", paddingVertical: Spacing.xxxl, gap: Spacing.md },
  noMembersTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "700" },
  noMembersSub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: "center", maxWidth: 280 },
});
