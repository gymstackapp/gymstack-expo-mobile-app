import { gymsApi } from "@/api/endpoints";
import { EmptyState, Header, SkeletonGroup } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym } from "@/types/api";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
function GymImageCarousel({
  images,
  height,
}: {
  images: string[];
  height: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const extData = images.length > 1 ? [...images, images[0]] : images;

  useEffect(() => {
    if (images.length <= 1 || containerWidth === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= images.length) {
          scrollRef.current?.scrollTo({
            x: images.length * containerWidth,
            animated: true,
          });
          setTimeout(
            () => scrollRef.current?.scrollTo({ x: 0, animated: false }),
            350,
          );
          return 0;
        }
        scrollRef.current?.scrollTo({
          x: next * containerWidth,
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length, containerWidth]);

  if (images.length === 0) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Icon name="dumbbell" size={28} color={Colors.textMuted} />
      </View>
    );
  }

  return (
    <View
      style={{ height }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {extData.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={{ width: containerWidth, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      {images.length > 1 && (
        <View style={carouselStyles.dots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                carouselStyles.dot,
                i === activeIndex && carouselStyles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  dots: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { width: 16, backgroundColor: "#fff" },
});

function GymCard({ gym, onPress }: { gym: Gym; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.gymCard}
    >
      <View style={styles.gymCover}>
        <GymImageCarousel images={gym.gymImages ?? []} height={300} />
        <View
          style={[
            styles.activePill,
            {
              backgroundColor: gym.isActive
                ? Colors.success + "cc"
                : Colors.textMuted + "80",
            },
          ]}
        >
          <Text style={styles.activePillText}>
            {gym.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
      <View style={styles.gymBody}>
        <Text style={styles.gymName} numberOfLines={1}>
          {gym.name}
        </Text>
        {gym.city ? (
          <View style={styles.locationRow}>
            <Icon
              name="map-marker-outline"
              size={12}
              color={Colors.textMuted}
            />
            <Text style={styles.locationRow}>{gym.city}</Text>
          </View>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon
              name="account-group-outline"
              size={13}
              color={Colors.textSecondary}
            />
            <Text style={styles.statText}>{gym._count.members} members</Text>
          </View>
          <View style={styles.stat}>
            <Icon
              name="account-tie-outline"
              size={13}
              color={Colors.textSecondary}
            />
            <Text style={styles.statText}>{gym._count.trainers} trainers</Text>
          </View>
        </View>
        {gym.membershipPlans?.length > 0 ? (
          <View style={styles.plans}>
            {gym.membershipPlans.slice(0, 2).map((p) => (
              <View key={p.id} style={styles.planChip}>
                <Text style={styles.planChipText} numberOfLines={1}>
                  {p.name}
                </Text>
              </View>
            ))}
            {gym.membershipPlans.length > 2 && (
              <View style={styles.planChip}>
                <Text style={styles.planChipText}>
                  +{gym.membershipPlans.length - 2}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
const OwnerGymsScreen = () => {
  const navigation = useNavigation();
  const { canAddGym, usage, limits } = useSubscription();

  const {
    data: gyms = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 2 * 60_000,
  });

  const atLimit = !canAddGym && limits?.maxGyms !== null;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerWrap}>
        <Header
          title="My Gyms"
          subtitle={`${gyms.length} location${gyms.length !== 1 ? "s" : ""}`}
          right={
            atLimit ? (
              <TouchableOpacity
                style={styles.limitBadge}
                onPress={() => (navigation as any).navigate("OwnerBilling")}
              >
                <Icon name="lock-outline" size={13} color={Colors.warning} />
                <Text style={styles.limitText}>
                  {usage?.gyms}/{limits?.maxGyms}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => (navigation as any).navigate("OwnerAddGym")}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            )
          }
        />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <SkeletonGroup
            variant="card"
            count={3}
            itemHeight={200}
            gap={Spacing.md}
          />
        </View>
      ) : gyms.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No gyms yet"
          subtitle="Add your first gym to start managing members and trainers."
          action={
            !atLimit ? (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => (navigation as any).navigate("OwnerAddGym")}
              >
                <Icon name="plus" size={16} color="#fff" />
                <Text style={styles.emptyActionText}>Add First Gym</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      ) : (
        <FlatList<Gym>
          data={gyms}
          keyExtractor={(g) => g.id}
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
            <GymCard
              gym={item}
              onPress={() =>
                (navigation as any).navigate("OwnerGymDetail", {
                  gymId: item.id,
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
};

export default OwnerGymsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  list: { padding: Spacing.lg, paddingBottom: 32 },
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
  gymCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  gymCover: {
    height: 300,
    backgroundColor: Colors.surfaceRaised,
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activePillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  gymBody: { padding: Spacing.lg, gap: Spacing.sm },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    color: "#fff",
  },
  locationText: { color: Colors.textMuted, fontSize: Typography.xs },
  statsRow: { flexDirection: "row", gap: Spacing.lg },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: Colors.textSecondary, fontSize: Typography.xs },
  plans: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  planChip: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planChipText: { color: Colors.textMuted, fontSize: 10 },
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
});
