// app/screens/trainer/MembersScreen.tsx
// Trainer's assigned members list with search, status badges, expiry warnings.

import { trainerMembersApi } from "@/api/endpoints";
import { Avatar, Card, Header, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  endDate: string | null;
  membershipPlan: { name: string } | null;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    mobileNumber: string | null;
  };
  attendance?: { checkInTime: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusStyle(status: string): { bg: string; fg: string } {
  if (status === "ACTIVE") return { bg: Colors.successFaded, fg: Colors.success };
  if (status === "EXPIRED") return { bg: Colors.errorFaded, fg: Colors.error };
  return { bg: Colors.warningFaded, fg: Colors.warning };
}

function daysLeft(endDate: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({ member, onPress }: { member: Member; onPress: () => void }) {
  const days = daysLeft(member.endDate);
  const nearExpiry = days !== null && days <= 7 && member.status === "ACTIVE";
  const lastSeen = member.attendance?.[0]?.checkInTime;
  const ss = statusStyle(member.status);

  return (
    <TouchableOpacity style={mr.row} onPress={onPress} activeOpacity={0.75}>
      <Avatar name={member.profile.fullName} url={member.profile.avatarUrl} size={44} />
      <View style={mr.info}>
        <View style={mr.nameRow}>
          <Text style={mr.name} numberOfLines={1}>{member.profile.fullName}</Text>
          <View style={[mr.badge, { backgroundColor: ss.bg }]}>
            <Text style={[mr.badgeTxt, { color: ss.fg }]}>{member.status}</Text>
          </View>
          {nearExpiry && (
            <View style={[mr.badge, { backgroundColor: Colors.warningFaded }]}>
              <Text style={[mr.badgeTxt, { color: Colors.warning }]}>
                {days === 0 ? "Today" : `${days}d left`}
              </Text>
            </View>
          )}
        </View>
        <View style={mr.metaRow}>
          {member.profile.mobileNumber && (
            <View style={mr.meta}>
              <Icon name="phone-outline" size={11} color={Colors.textMuted} />
              <Text style={mr.metaTxt}>{member.profile.mobileNumber}</Text>
            </View>
          )}
          {member.membershipPlan && (
            <View style={mr.meta}>
              <Icon name="card-outline" size={11} color={Colors.textMuted} />
              <Text style={mr.metaTxt}>{member.membershipPlan.name}</Text>
            </View>
          )}
          {lastSeen && (
            <Text style={mr.metaTxt}>
              Last: {new Date(lastSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </Text>
          )}
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const mr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexWrap: "wrap" },
  name: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  badge: { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 3, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaTxt: { color: Colors.textMuted, fontSize: Typography.xs },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading, refetch, isRefetching } = useQuery<Member[]>({
    queryKey: ["trainerMembers"],
    queryFn: () => trainerMembersApi.list() as Promise<Member[]>,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.profile.fullName.toLowerCase().includes(q) ||
        m.profile.mobileNumber?.includes(q) ||
        m.membershipPlan?.name.toLowerCase().includes(q),
    );
  }, [members, search]);

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const expiringCount = members.filter((m) => {
    const d = daysLeft(m.endDate);
    return d !== null && d <= 7 && m.status === "ACTIVE";
  }).length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          menu
          title="My Members"
          subtitle={`${members.length} assigned · ${activeCount} active`}
        />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search members…"
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {expiringCount > 0 && (
          <View style={s.expiryBadge}>
            <Icon name="clock-alert-outline" size={12} color={Colors.warning} />
            <Text style={s.expiryTxt}>{expiringCount} expiring soon</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: Spacing.md, alignItems: "center" }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={13} width="55%" />
                <Skeleton height={10} width="35%" />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Icon name="account-group-outline" size={48} color={Colors.border} />
          <Text style={s.emptyTitle}>{search ? `No results for "${search}"` : "No clients yet"}</Text>
          {!search && (
            <Text style={s.emptySub}>
              Ask the gym owner to assign members to you to start training them.
            </Text>
          )}
        </View>
      ) : (
        <Card style={{ flex: 1, padding: 0, margin: Spacing.lg, marginTop: 0 }}>
          <FlatList
            data={filtered}
            keyExtractor={(m) => m.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <MemberRow
                member={item}
                onPress={() =>
                  navigation.navigate("TrainerMemberDetail", {
                    memberId: item.id,
                    memberName: item.profile.fullName,
                  })
                }
              />
            )}
          />
        </Card>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  expiryTxt: { color: Colors.warning, fontSize: 10, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "700", textAlign: "center" },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: "center", maxWidth: 280 },
});
