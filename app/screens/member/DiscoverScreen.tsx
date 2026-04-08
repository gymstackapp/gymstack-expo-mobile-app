// mobile/src/screens/member/DiscoverScreen.tsx
// Shows gyms to discover. Members with an ACTIVE membership see a banner
// but can still browse all gyms. Members with no gym get a full search experience.
import { discoverApi } from "@/api/endpoints";
import { Card, EmptyState, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
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

interface DiscoverGym {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  services: string[];
  facilities: string[];
  gymImages: string[];
  isEnrolled: boolean;
  isActive: boolean;
  contactNumber: string | null;
  owner: {
    fullName: string;
    avatarUrl: string | null;
    mobileNumber: string | null;
  };
  membershipPlans: {
    id: string;
    name: string;
    price: number;
    durationMonths: number;
  }[];
  _count: { members: number };
}

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function GymCard({ gym, onPress }: { gym: DiscoverGym; onPress: () => void }) {
  const lowestPlan = gym.membershipPlans?.[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={gc.card}>
        {/* Name + enrolled badge */}
        <View style={gc.top}>
          <View style={{ flex: 1 }}>
            <View style={gc.nameRow}>
              <Text style={gc.name} numberOfLines={1}>
                {gym.name}
              </Text>
              {gym.isEnrolled && (
                <View style={gc.enrolledBadge}>
                  <Icon
                    name="check-circle-outline"
                    size={11}
                    color={Colors.success}
                  />
                  <Text style={gc.enrolledText}>Joined</Text>
                </View>
              )}
            </View>
            {gym.city && (
              <View style={gc.cityRow}>
                <Icon
                  name="map-marker-outline"
                  size={12}
                  color={Colors.textMuted}
                />
                <Text style={gc.city}>{gym.city}</Text>
              </View>
            )}
          </View>
          <Icon name="chevron-right" size={20} color={Colors.textMuted} />
        </View>

        {/* Members count */}
        <View style={gc.metaRow}>
          <View style={gc.metaItem}>
            <Icon
              name="account-group-outline"
              size={13}
              color={Colors.textMuted}
            />
            <Text style={gc.metaText}>{gym._count?.members ?? 0} members</Text>
          </View>
          {gym.owner?.fullName && (
            <View style={gc.metaItem}>
              <Icon
                name="shield-account-outline"
                size={13}
                color={Colors.textMuted}
              />
              <Text style={gc.metaText} numberOfLines={1}>
                {gym.owner.fullName}
              </Text>
            </View>
          )}
        </View>

        {/* Services chips */}
        {gym.services?.length > 0 && (
          <View style={gc.chips}>
            {gym.services.slice(0, 3).map((s) => (
              <View key={s} style={gc.chip}>
                <Text style={gc.chipText}>{s}</Text>
              </View>
            ))}
            {gym.services.length > 3 && (
              <View style={gc.chip}>
                <Text style={gc.chipText}>+{gym.services.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Lowest plan price */}
        {lowestPlan && (
          <View style={gc.priceRow}>
            <Text style={gc.priceLabel}>Starting from</Text>
            <Text style={gc.price}>{fmt(lowestPlan.price)}</Text>
            <Text style={gc.pricePer}>/ {lowestPlan.durationMonths}mo</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const gc = StyleSheet.create({
  card: {},
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    flex: 1,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  enrolledText: { color: Colors.success, fontSize: 10, fontWeight: "700" },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  city: { color: Colors.textMuted, fontSize: Typography.xs },
  metaRow: { flexDirection: "row", gap: Spacing.lg, marginBottom: Spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: Typography.xs },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: { color: Colors.primary, fontSize: 10, fontWeight: "600" },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  priceLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  price: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  pricePer: { color: Colors.textMuted, fontSize: Typography.xs },
});

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery<{
    gyms: DiscoverGym[];
    memberCity: string | null;
    hasActiveGym: boolean;
  }>({
    queryKey: ["discoverGyms", searchQ],
    queryFn: () =>
      discoverApi.list({ search: searchQ || undefined }) as Promise<any>,
    staleTime: 5 * 60_000,
  });

  const gyms = data?.gyms ?? [];
  const hasActiveGym = data?.hasActiveGym ?? false;

  const onSearch = () => setSearchQ(search.trim());

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Discover Gyms</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          {data?.memberCity && (
            <View style={s.cityChip}>
              <Icon name="map-marker-outline" size={12} color={Colors.primary} />
              <Text style={s.cityChipText}>{data.memberCity}</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search gym name or city…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setSearchQ("");
              }}
            >
              <Icon name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={onSearch}>
          <Text style={s.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Already enrolled banner */}
      {hasActiveGym && (
        <View style={s.enrolledBanner}>
          <Icon name="check-circle-outline" size={16} color={Colors.success} />
          <Text style={s.enrolledBannerText}>
            You have an active gym membership. Browse more gyms below.
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup
            variant="card"
            count={4}
            itemHeight={140}
            gap={Spacing.md}
          />
        </View>
      ) : gyms.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title={searchQ ? `No gyms found for "${searchQ}"` : "No gyms found"}
          subtitle="Try a different city or search term"
        />
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
            gap: Spacing.md,
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
          renderItem={({ item: gym }) => (
            <GymCard
              gym={gym}
              onPress={() =>
                navigation.navigate("GymDetail", { gymId: gym.id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  menuBtn: { padding: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cityChipText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  searchWrap: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
  enrolledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.successFaded,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.success + "30",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  enrolledBannerText: {
    color: Colors.success,
    fontSize: Typography.xs,
    flex: 1,
    lineHeight: 18,
  },
});
