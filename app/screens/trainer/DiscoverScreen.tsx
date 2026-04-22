// app/screens/trainer/DiscoverScreen.tsx
// Trainer can search and discover gyms to join.

import { trainerDiscoverApi } from "@/api/endpoints";
import { Avatar, Card, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Gym card ───────────────────────────────────────────────────────────────────

function GymCard({ gym, onPress }: { gym: any; onPress: () => void }) {
  const coverImage = gym.gymImages?.[0] ?? null;
  return (
    <TouchableOpacity style={gc.card} onPress={onPress} activeOpacity={0.8}>
      {/* Cover image */}
      <View style={gc.imageWrap}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={gc.image} resizeMode="cover" />
        ) : (
          <View style={gc.imagePlaceholder}>
            <Icon name="image-outline" size={28} color={Colors.border} />
          </View>
        )}
        {gym.gymImages?.length > 1 && (
          <View style={gc.imgCount}>
            <Icon name="image-multiple-outline" size={10} color="#fff" />
            <Text style={gc.imgCountTxt}>{gym.gymImages.length}</Text>
          </View>
        )}
        {gym.isJoined && (
          <View style={gc.joinedBadge}>
            <Icon name="check-circle-outline" size={10} color="#fff" />
            <Text style={gc.joinedTxt}>Joined</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={gc.body}>
        <View style={gc.nameRow}>
          <Text style={gc.name} numberOfLines={1}>{gym.name}</Text>
          <Icon name="chevron-right" size={16} color={Colors.textMuted} />
        </View>
        <Text style={gc.location} numberOfLines={1}>
          <Icon name="map-marker-outline" size={11} color={Colors.textMuted} />
          {" "}{[gym.address, gym.city].filter(Boolean).join(", ") || "Location not listed"}
        </Text>

        <View style={gc.counts}>
          <View style={gc.countItem}>
            <Icon name="account-group-outline" size={11} color={Colors.textMuted} />
            <Text style={gc.countTxt}>{gym._count?.trainers ?? 0} trainers</Text>
          </View>
          <View style={gc.countItem}>
            <Icon name="account-multiple-outline" size={11} color={Colors.textMuted} />
            <Text style={gc.countTxt}>{gym._count?.members ?? 0} members</Text>
          </View>
        </View>

        {gym.owner && (
          <View style={gc.owner}>
            <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={20} />
            <Text style={gc.ownerTxt} numberOfLines={1}>{gym.owner.fullName}</Text>
          </View>
        )}

        {gym.services?.length > 0 && (
          <View style={gc.tags}>
            {gym.services.slice(0, 3).map((s: string) => (
              <View key={s} style={gc.tag}><Text style={gc.tagTxt}>{s}</Text></View>
            ))}
            {gym.services.length > 3 && <Text style={gc.tagMore}>+{gym.services.length - 3}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const gc = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", marginBottom: Spacing.md },
  imageWrap: { height: 140, backgroundColor: Colors.surfaceRaised },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imgCount: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3 },
  imgCountTxt: { color: "#fff", fontSize: 10 },
  joinedBadge: { position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.success + "CC", borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3 },
  joinedTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  body: { padding: Spacing.md, gap: Spacing.xs },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700", flex: 1, marginRight: Spacing.xs },
  location: { color: Colors.textMuted, fontSize: Typography.xs },
  counts: { flexDirection: "row", gap: Spacing.md },
  countItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  countTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  owner: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  ownerTxt: { color: Colors.textMuted, fontSize: Typography.xs, flex: 1 },
  tags: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  tag: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt: { color: Colors.textMuted, fontSize: 10 },
  tagMore: { color: Colors.textMuted, fontSize: 10, alignSelf: "center" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [city, setCity]     = useState("");
  const [queryParams, setQueryParams] = useState<{ search?: string; city?: string }>({});

  const { data, isLoading, isFetching } = useQuery<{ gyms: any[]; trainerCity?: string }>({
    queryKey: ["trainerDiscover", queryParams],
    queryFn: () => trainerDiscoverApi.list(queryParams) as Promise<any>,
    staleTime: 60_000,
  });

  const gyms = data?.gyms ?? [];

  const handleSearch = () => {
    setQueryParams({
      search: search.trim() || undefined,
      city: city.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header menu title="Discover Gyms" subtitle="Find gyms to join as a trainer" />
      </View>

      {/* Search bar */}
      <View style={s.searchArea}>
        <View style={s.searchBar}>
          <Icon name="magnify" size={17} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search gyms by name…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        <View style={[s.searchBar, { flex: 0, width: 120 }]}>
          <Icon name="map-marker-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={city}
            onChangeText={setCity}
            placeholder={data?.trainerCity || "City"}
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
          <Text style={s.searchBtnTxt}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading || isFetching ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : gyms.length === 0 ? (
        <View style={s.empty}>
          <Icon name="office-building-outline" size={48} color={Colors.border} />
          <Text style={s.emptyTitle}>No gyms found{city ? ` in ${city}` : ""}</Text>
          <Text style={s.emptySub}>Try a different search or city</Text>
        </View>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={s.resultCount}>
              {gyms.length} gym{gyms.length !== 1 ? "s" : ""} found{city ? ` in ${city}` : ""}
            </Text>
          }
          renderItem={({ item }) => (
            <GymCard
              gym={item}
              onPress={() => navigation.navigate("TrainerDiscoverDetail", { gymId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  searchArea: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.lg, paddingTop: Spacing.md },
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
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
  searchBtnTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "700", textAlign: "center" },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: "center" },
  resultCount: { color: Colors.textMuted, fontSize: Typography.sm, marginBottom: Spacing.md },
});
