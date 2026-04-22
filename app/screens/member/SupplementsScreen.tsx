// mobile/src/screens/member/SupplementsScreen.tsx
// Member-facing supplement store — browse what's available in their gym.
// Members can't purchase directly (no payment yet) but can see stock & prices.
import { memberSupplementsApi } from "@/api/endpoints";
import { EmptyState, Header, NoGymState, SkeletonGroup } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { Colors, Radius, Spacing, Typography } from "@/theme";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const CATEGORY_ICONS: Record<string, string> = {
  Protein: "arm-flex-outline",
  Creatine: "lightning-bolt-outline",
  Vitamins: "pill",
  "Pre-Workout": "flash-outline",
  BCAA: "molecule",
  "Fat Burner": "fire-outline",
  "Mass Gainer": "scale-outline",
  Other: "package-variant-outline",
};

function fmt(n: number | string) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function StockBadge({ qty, low }: { qty: number; low: number }) {
  if (qty === 0)
    return (
      <View style={[sb.badge, { backgroundColor: Colors.errorFaded }]}>
        <Text style={[sb.txt, { color: Colors.error }]}>Out of stock</Text>
      </View>
    );
  // if (qty <= low)
  //   return (
  //     <View style={[sb.badge, { backgroundColor: Colors.warningFaded }]}>
  //       <Text style={[sb.txt, { color: Colors.warning }]}>
  //         Low stock · {qty} left
  //       </Text>
  //     </View>
  //   );
  // return (
  //   <View style={[sb.badge, { backgroundColor: Colors.successFaded }]}>
  //     <Text style={[sb.txt, { color: Colors.success }]}>
  //       In stock · {qty} units
  //     </Text>
  //   </View>
  // );
  return (
    <View style={[sb.badge, { backgroundColor: Colors.successFaded }]}>
      <Text style={[sb.txt, { color: Colors.success }]}>In stock</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  txt: { fontSize: Typography.xs, fontWeight: "700" },
});

export default function SupplementsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery<{
    supplements: any[];
    categories: string[];
  }>({
    queryKey: ["memberSupplements", searchQ, category],
    queryFn: () =>
      memberSupplementsApi.list({
        search: searchQ || undefined,
        category: category || undefined,
      }) as Promise<any>,
    staleTime: 2 * 60_000,
  });

  const supplements = data?.supplements ?? [];
  const categories = data?.categories ?? [];

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Store" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <Header menu title="Store" subtitle="Supplements at your gym" />

        {/* Search */}
        <View>
          <View style={s.searchBox}>
            <Icon name="magnify" size={18} color={Colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search supplements…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => setSearchQ(search.trim())}
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
        </View>

        {/* Category filter */}
        {categories.length > 0 && (
          <View style={{ paddingBottom: Spacing.sm }}>
            <FlatList
              horizontal
              data={["All", ...categories]}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catScroll}
              renderItem={({ item: cat }) => {
                const isActive =
                  (cat === "All" && !category) || cat === category;
                const icon =
                  cat === "All"
                    ? "view-grid-outline"
                    : (CATEGORY_ICONS[cat] ?? "package-variant-outline");
                return (
                  <TouchableOpacity
                    style={[s.catPill, isActive && s.catPillActive]}
                    onPress={() => setCategory(cat === "All" ? "" : cat)}
                  >
                    <Icon
                      name={icon}
                      size={13}
                      color={isActive ? "#fff" : Colors.textMuted}
                    />
                    <Text style={[s.catTxt, isActive && s.catTxtActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Info banner */}
        <View style={s.infoBanner}>
          <Icon name="information-outline" size={14} color={Colors.textMuted} />
          <Text style={s.infoTxt}>
            Contact your trainer or gym desk to purchase
          </Text>
        </View>

        {isLoading || gymLoading ? (
          <View>
            <SkeletonGroup
              variant="card"
              count={4}
              itemHeight={120}
              gap={Spacing.md}
            />
          </View>
        ) : supplements.length === 0 ? (
          <EmptyState
            icon="package-variant-outline"
            title={
              searchQ || category
                ? "No results found"
                : "No supplements available"
            }
            subtitle={
              searchQ || category
                ? "Try a different search or category"
                : "Your gym hasn't added any supplements yet"
            }
          />
        ) : (
          <FlatList
            data={supplements}
            keyExtractor={(s) => s.id}
            numColumns={2}
            columnWrapperStyle={{ gap: Spacing.sm }}
            contentContainerStyle={{
              paddingBottom: 40,
              gap: Spacing.sm,
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
            renderItem={({ item: sup }) => {
              const icon =
                CATEGORY_ICONS[sup.category ?? ""] ?? "package-variant-outline";
              return (
                <View style={s.supCard}>
                  {/* Icon */}
                  <View style={s.supIcon}>
                    <Icon name={icon} size={26} color={Colors.primary} />
                  </View>

                  {/* Name + brand */}
                  <Text style={s.supName} numberOfLines={2}>
                    {sup.name}
                  </Text>
                  {sup.brand && (
                    <Text style={s.supBrand} numberOfLines={1}>
                      {sup.brand}
                    </Text>
                  )}

                  {/* Category */}
                  {sup.category && (
                    <View style={s.catTag}>
                      <Text style={s.catTagTxt}>{sup.category}</Text>
                    </View>
                  )}

                  {/* Unit size */}
                  {sup.unitSize && (
                    <Text style={s.supUnit}>{sup.unitSize}</Text>
                  )}

                  {/* Price */}
                  <Text style={s.supPrice}>{fmt(sup.price)}</Text>

                  {/* Stock */}
                  <StockBadge qty={sup.stockQty} low={sup.lowStockAt} />

                  {/* Gym name if member is in multiple gyms */}
                  {sup.gym?.name && (
                    <Text style={s.supGym} numberOfLines={1}>
                      {sup.gym.name}
                    </Text>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  screenSub: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
  catScroll: { gap: Spacing.xs },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  catTxtActive: { color: "#fff" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  infoTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  // Supplement card (2-column grid)
  supCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 5,
  },
  supIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  supName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    lineHeight: 18,
  },
  supBrand: { color: Colors.textMuted, fontSize: Typography.xs },
  catTag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  catTagTxt: { color: Colors.textSecondary, fontSize: 10 },
  supUnit: { color: Colors.textMuted, fontSize: Typography.xs },
  supPrice: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  supGym: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
});
