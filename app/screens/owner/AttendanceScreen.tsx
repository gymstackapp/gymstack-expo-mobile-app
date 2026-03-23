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
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function OwnerAttendanceScreen() {
  const { hasAttendance } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [search, setSearch] = useState("");

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<OwnerAttendanceRecord[]>({
    queryKey: ["ownerAttendance", gymId, search],
    queryFn: async () => {
      const res = (await ownerAttendanceApi.list({
        gymId: gymId || undefined,
        search: search || undefined,
      })) as OwnerAttendanceRecord[] | { records: OwnerAttendanceRecord[] };
      return Array.isArray(res) ? res : (res.records ?? []);
    },
    enabled: hasAttendance,
    staleTime: 30_000,
  });

  const today = new Date().toDateString();

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.top}>
        <Header
          title="Attendance"
          // subtitle={`${data.length} records`}
          subtitle="10 recors"
          back
        />
        <View style={st.searchBox}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search member..."
            placeholderTextColor={Colors.textMuted}
            style={st.searchInput}
          />
        </View>
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
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup variant="listRow" count={5} />
          </View>
        ) : data.length === 0 ? (
          <EmptyState
            icon="calendar-check-outline"
            title="No attendance records"
            subtitle="Check-ins will appear here"
          />
        ) : (
          <FlatList<OwnerAttendanceRecord>
            data={data}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: Colors.border }} />
            )}
            renderItem={({ item: r }) => {
              const cin = new Date(r.checkInTime);
              const cout = r.checkOutTime ? new Date(r.checkOutTime) : null;
              const dur = cout
                ? Math.round((cout.getTime() - cin.getTime()) / 60000)
                : null;
              const isToday = cin.toDateString() === today;

              return (
                <View style={st.row}>
                  <Avatar
                    name={r.member?.profile?.fullName ?? "?"}
                    url={r.member?.profile?.avatarUrl}
                    size={38}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={st.name}>{r.member?.profile?.fullName}</Text>
                    <Text style={st.sub}>
                      {isToday
                        ? "Today"
                        : cin.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                      {" · "}
                      {cin.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    {dur ? <Text style={st.dur}>{dur}m</Text> : null}
                    {!cout && isToday ? (
                      <View style={st.activeDot}>
                        <Text style={st.activeTxt}>Live</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}
        <Text>Plan Gate</Text>
      </PlanGate>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
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
