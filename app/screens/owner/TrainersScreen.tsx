// mobile/src/screens/owner/TrainersScreen.tsx
import { gymsApi, trainersApi } from "@/api/endpoints";
import { Avatar, EmptyState, Header, SkeletonGroup } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { Gym, Trainer } from "@/types/api";
import { useNavigation } from "@react-navigation/native";
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
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function TrainersScreen() {
  const navigation = useNavigation();
  const { canAddTrainer, usage, limits } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [search, setSearch] = useState("");

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: trainers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Trainer[]>({
    queryKey: ["ownerTrainers", gymId],
    queryFn: () =>
      trainersApi.list({ gymId: gymId || undefined }) as Promise<Trainer[]>,
    staleTime: 60_000,
  });

  const filtered = (trainers as Trainer[]).filter(
    (t) =>
      !search ||
      t.profile?.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const atLimit = !canAddTrainer && limits?.maxTrainers !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Header
          title="Trainers"
          subtitle={`${(trainers as Trainer[]).length} total`}
          menu
          right={
            atLimit ? (
              <TouchableOpacity
                style={styles.limitBadge}
                onPress={() =>
                  Toast.show({
                    type: "error",
                    text1: `Trainer limit reached (${usage?.trainers ?? 0}/${limits?.maxTrainers}). Upgrade your plan.`,
                  })
                }
              >
                <Icon name="lock-outline" size={13} color={Colors.warning} />
                <Text style={styles.limitText}>
                  {usage?.trainers}/{limits?.maxTrainers}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => (navigation as any).navigate("OwnerAddTrainer")}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            )
          }
        />

        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search trainers..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Gym filter pills */}
        {(gyms as Gym[]).length > 1 && (
          <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
            {[{ id: "", name: "All Gyms" } as Gym, ...(gyms as Gym[])].map(
              (g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGymId(g.id)}
                  style={[
                    styles.pill,
                    gymId === g.id ? styles.pillActive : styles.pillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: gymId === g.id ? Colors.primary : Colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={4} itemHeight={72} gap={Spacing.sm} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="account-tie-outline"
          title="No trainers yet"
          subtitle="Add your first trainer to get started"
        />
      ) : (
        <FlatList<Trainer>
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                (navigation as any).navigate("OwnerTrainerDetail", {
                  trainerId: t.id,
                })
              }
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Avatar name={t.profile?.fullName} url={t.profile?.avatarUrl} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.profile?.fullName}</Text>
                  <Text style={styles.gym}>{t.gym?.name}</Text>
                </View>
                <View
                  style={[
                    styles.availBadge,
                    t.isAvailable
                      ? styles.availBadgeOn
                      : styles.availBadgeOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.availText,
                      { color: t.isAvailable ? Colors.success : Colors.textMuted },
                    ]}
                  >
                    {t.isAvailable ? "Available" : "Busy"}
                  </Text>
                </View>
              </View>

              {/* Specializations */}
              {t.specializations?.length > 0 && (
                <View style={styles.specs}>
                  {t.specializations.slice(0, 3).map((s) => (
                    <View key={s} style={styles.specPill}>
                      <Text style={styles.specText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer stats */}
              <View style={styles.cardFooter}>
                <View style={styles.stat}>
                  <Icon name="account-multiple-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.statText}>
                    {t._count?.assignedMembers ?? 0} members
                  </Text>
                </View>
                {Number(t.rating) > 0 && (
                  <View style={styles.ratingBadge}>
                    <Icon name="star" size={12} color={Colors.warning} />
                    <Text style={styles.ratingText}>
                      {Number(t.rating).toFixed(1)}
                    </Text>
                  </View>
                )}
                <Text style={styles.statText}>{t.experienceYears}y exp</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: {
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
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  pillText: { fontSize: Typography.xs },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  gym: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  availBadgeOn: { backgroundColor: Colors.successFaded },
  availBadgeOff: { backgroundColor: Colors.surfaceRaised },
  availText: { fontSize: Typography.xs, fontWeight: "600" },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  specPill: {
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: 2,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: Colors.textMuted, fontSize: Typography.xs },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.warningFaded,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  ratingText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
});
