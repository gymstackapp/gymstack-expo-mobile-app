import { discoverApi } from "@/api/endpoints";
import { Avatar, Card, Header } from "@/components";
import ImageCarousel from "@/components/ImageCarousel";
import { Skeleton } from "@/components/Skeleton";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DiscoverGym } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
const GymDetailScreen = () => {
  const qc = useQueryClient();
  const navigation = useNavigation();
  const route = useRoute();
  const { gymId } = route.params as { gymId: string };

  const {
    data: gym,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<DiscoverGym>({
    queryKey: ["gym", gymId],
    queryFn: () => discoverApi.getGym(gymId) as Promise<DiscoverGym>,
    enabled: !!gymId,
  });

  console.log("gym", gym);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Gym Details" back />
          <Skeleton height={300} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={{ flex: 1, padding: Spacing.lg }}>
        <Header title={gym?.name} subtitle={gym?.city ?? undefined} back />
        <ScrollView
          contentContainerStyle={styles.scroll}
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
          <View style={styles.cover}>
            <ImageCarousel images={gym?.gymImages ?? []} height={300} />
          </View>
          {/* Gym details */}
          {/* <View style={styles.badges}>
          <Badge
            label={gym.isActive ? "Active" : "Inactive"}
            variant={gym.isActive ? "success" : "default"}
          />
          {gym.city ? <Badge label={gym.city} /> : null}
        </View> */}
          <Card>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                  flexWrap: "wrap",
                }}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {gym.name}
                </Text>
                {gym.isEnrolled && (
                  <View style={styles.enrolledBadge}>
                    <Icon
                      name="check-circle"
                      size={14}
                      color={Colors.success}
                    />
                    <Text style={styles.enrolledText}>Active Member</Text>
                  </View>
                )}
              </View>
              {gym.city && (
                <View style={styles.cityRow}>
                  <Icon
                    name="map-marker-outline"
                    size={12}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.city}>
                    {[gym.address, gym.city, gym.state]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              )}
              <View style={styles.metaRow}>
                {/* <View style={styles.metaItem}>
                <Icon
                  name="account-group-outline"
                  size={13}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {gym._count.members} members
                </Text>
              </View> */}
                <View style={styles.metaItem}>
                  <Icon name="phone-outline" size={13} color={Colors.success} />
                  <Text style={styles.enrolledText}>{gym.contactNumber}</Text>
                </View>
              </View>
            </View>
          </Card>
          <Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: Spacing.sm,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                }}
              >
                <View>
                  {/* <Image
                  source={{ uri: gym.owner.avatarUrl }}
                  style={{ width: 50, height: 50, borderRadius: Radius.full }}
                  resizeMode="cover"
                /> */}
                  <Avatar
                    name={gym.owner.fullName}
                    url={gym.owner.avatarUrl}
                    size={44}
                  />
                </View>
                <View>
                  <Text style={styles.metaText}>Gym Owner</Text>
                  <Text style={styles.name}>{gym.owner.fullName}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.enrolledBadge}
                onPress={() => {
                  if (gym.owner.mobileNumber) {
                    Linking.openURL(`tel:${gym.owner.mobileNumber}`);
                  }
                }}
                disabled={!gym.owner.mobileNumber}
              >
                <Icon name="phone-outline" size={13} color={Colors.success} />
                <Text style={styles.enrolledText}>Call Owner</Text>
              </TouchableOpacity>
            </View>
          </Card>
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Membership Plans
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.membershipPlans.map((plan: any) => (
                  <View
                    style={{
                      width: "100%",
                      paddingVertical: Spacing.lg,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.surfaceRaised,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: "row",
                      }}
                    >
                      <Text
                        style={{
                          color: Colors.textPrimary,
                          fontSize: Typography.lg,
                          fontWeight: Typography.semibold,
                        }}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: Typography.lg,
                          fontWeight: Typography.semibold,
                          color: Colors.primary,
                        }}
                      >
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <Text
                      style={{
                        marginVertical: Spacing.xs,
                        color: Colors.textSecondary,
                        fontSize: Typography.lg,
                        fontWeight: Typography.regular,
                      }}
                    >
                      {plan.durationMonths} month
                      {plan.durationMonths > 1 ? "s" : ""}
                    </Text>

                    {plan.features.slice(0, 4).map((feature: string) => (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          marginVertical: Spacing.xs,
                        }}
                      >
                        <Icon
                          name="star-outline"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text
                          style={{
                            color: Colors.textSecondary,
                            fontSize: Typography.sm,
                            fontWeight: Typography.regular,
                          }}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Card>
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Services
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.services.map((ser: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.primaryFaded,
                      borderRadius: Radius.full,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: Typography.sm,
                      }}
                    >
                      {ser}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Facilities
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.facilities.map((fac: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.primaryFaded,
                      borderRadius: Radius.full,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: Typography.sm,
                      }}
                    >
                      {fac}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default GymDetailScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: { paddingBottom: 40, gap: Spacing.md },
  cover: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  badges: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  enrolledText: { color: Colors.success, fontSize: 10, fontWeight: "700" },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: Spacing.md,
  },
  city: { color: Colors.textMuted, fontSize: Typography.xs },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginVertical: Spacing.sm,
    alignItems: "center",
  },
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  priceLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  price: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  pricePer: { color: Colors.textMuted, fontSize: Typography.xs },
});
