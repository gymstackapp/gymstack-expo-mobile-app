import { gymsApi, membersApi } from "@/api/endpoints";
import {
  Avatar,
  Badge,
  Dropdown,
  EmptyState,
  Header,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, GymMemberListItem, MembersListResponse } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
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

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "All" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Suspended", value: "SUSPENDED" },
];

function MemberRow({
  member,
  onPress,
}: {
  member: GymMemberListItem;
  onPress: () => void;
}) {
  const expiring = member.endDate
    ? Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const statusVariant =
    member.status === "ACTIVE"
      ? ("success" as const)
      : member.status === "EXPIRED"
        ? ("error" as const)
        : ("default" as const);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <Avatar
        name={member.profile.fullName}
        url={member.profile.avatarUrl}
        size={44}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {member.profile.fullName}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {member.gym.name} · {member.membershipPlan?.name ?? "No plan"}
        </Text>
      </View>
      {/* {expiring !== null && expiring <= 7 && expiring >= 0 && (
        <Text style={styles.expiryWarning}>
          ⚠ {expiring === 0 ? "Expires today" : `${expiring}d left`}
        </Text>
      )} */}
      {expiring !== null && expiring < 0 ? (
        <Text
          style={{ color: Colors.error, fontSize: Typography.xs }}
        >{`${Math.abs(expiring)} days ago expired`}</Text>
      ) : expiring !== null && expiring <= 7 ? (
        <Text style={styles.expiryWarning}>{`⚠ ${expiring}d left`}</Text>
      ) : (
        <Text style={{ fontSize: Typography.xs, color: Colors.textPrimary }}>
          {`${new Date(member?.endDate ?? "").toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`}
        </Text>
      )}
      <View style={styles.rowRight}>
        <Badge label={member.status} variant={statusVariant} />
        <Icon
          name="chevron-right"
          size={16}
          color={Colors.textMuted}
          style={{ marginTop: 4 }}
        />
      </View>
    </TouchableOpacity>
  );
}
const OwnerMembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialGymId = (route.params as { gymId?: string })?.gymId ?? "";
  const { canAddMember, usage, limits } = useSubscription();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [gymId, setGymId] = useState(initialGymId);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [gymId, status, search]);

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_0000,
  });

  const { data, isLoading, refetch, isRefetching } =
    useQuery<MembersListResponse>({
      queryKey: ["ownerMembers", gymId, status, search, page],
      queryFn: () =>
        membersApi.list({
          gymId: gymId || undefined,
          status: status === "All" ? undefined : status,
          search: search || undefined,
          page,
        }) as Promise<MembersListResponse>,
      staleTime: 60_000,
    });

  const members: GymMemberListItem[] = data?.members ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const atLimit = !canAddMember && limits?.maxMembers !== null;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Header
          menu
          title="Members"
          subtitle={`${total} total`}
          right={
            atLimit ? (
              <TouchableOpacity
                style={styles.limitBadge}
                onPress={() => (navigation as any).navigate("OwnerBilling")}
              >
                <Icon name="lock-outline" size={13} color={Colors.warning} />
                <Text style={styles.limitText}>
                  {usage?.members}/{limits?.maxMembers}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.addBtnSecondary}
                  onPress={() =>
                    (navigation as any).navigate("OwnerBulkAddMember")
                  }
                >
                  <Icon
                    name="account-multiple-plus-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => (navigation as any).navigate("OwnerAddMember")}
                >
                  <Icon name="account-plus-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          }
        />
        <View style={styles.searchBox}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email or phone..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Dropdown
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          placeholder="Filter by status"
          leftIcon="filter-outline"
          containerStyle={{ marginBottom: 0 }}
        />

        {gyms.length > 1 && (
          <View style={styles.filterRow}>
            {[{ id: "", name: "All Gyms" } as Gym, ...gyms].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[
                  styles.filterPill,
                  gymId === g.id && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    gymId === g.id && styles.filterTextActive,
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="listRow" count={6} />
        </View>
      ) : members.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="No members found"
          subtitle={
            search
              ? "Try a different search"
              : "Add your first member to get started"
          }
          action={
            !atLimit && !search ? (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => (navigation as any).navigate("OwnerAddMember")}
              >
                <Icon name="account-plus-outline" size={16} color="#fff" />
                <Text style={styles.emptyActionText}>Add Member</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      ) : (
        <FlatList<GymMemberListItem>
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
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
                (navigation as any).navigate("OwnerMemberDetail", {
                  memberId: item.id,
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Icon
                    name="chevron-left"
                    size={16}
                    color={page === 1 ? Colors.textMuted : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      page === 1 && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    page === totalPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      page === totalPages && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={16}
                    color={
                      page === totalPages ? Colors.textMuted : Colors.primary
                    }
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default OwnerMembersScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnSecondary: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  limitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  limitText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: "600",
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
  filterRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  filterTextActive: { color: Colors.primary, fontWeight: "700" },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowInfo: { flex: 1 },
  rowName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  rowSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  expiryWarning: {
    color: Colors.warning,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  rowRight: { alignItems: "flex-end", gap: 2, flexDirection: "row" },
  separator: { height: 1, backgroundColor: Colors.border },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.sm,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  pageBtnDisabled: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  pageBtnText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  pageBtnTextDisabled: { color: Colors.textMuted },
  pageInfo: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
