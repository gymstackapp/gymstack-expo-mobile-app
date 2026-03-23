import {
  gymsApi,
  membersApi,
  membershipPlansApi,
  trainersApi,
} from "@/api/endpoints";
import { Avatar, Badge, Card, Header, ListRow, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
  Gym,
  GymMemberListItem,
  MembershipPlan,
  MembersListResponse,
  Trainer,
} from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

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
        <Icon name="dumbbell" size={36} color={Colors.textMuted} />
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
    bottom: 10,
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

const OwnerGymDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();
  const { gymId } = route.params as { gymId: string };
  const [tab, setTab] = useState<
    "overview" | "members" | "trainers" | "services" | "facilities" | "plans"
  >("overview");
  const {
    data: gym,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Gym>({
    queryKey: ["ownerGym", gymId],
    queryFn: () => gymsApi.get(gymId) as Promise<Gym>,
    enabled: !!gymId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<
    MembershipPlan[]
  >({
    queryKey: ["ownerPlans", gymId],
    queryFn: () => membershipPlansApi.list(gymId) as Promise<MembershipPlan[]>,
    enabled: !!gymId,
  });

  const { data: membersData, isLoading: membersLoading } =
    useQuery<MembersListResponse>({
      queryKey: ["gymMembers", gymId],
      queryFn: () =>
        membersApi.list({ gymId, page: 1 }) as Promise<MembersListResponse>,
      enabled: !!gymId && tab === "members",
    });

  const { data: trainers = [], isLoading: trainersLoading } = useQuery<
    Trainer[]
  >({
    queryKey: ["gymTrainers", gymId],
    queryFn: () => trainersApi.list({ gymId }) as Promise<Trainer[]>,
    enabled: !!gymId && tab === "trainers",
  });

  const toggleMutation = useMutation({
    mutationFn: () => gymsApi.update(gymId, { isActive: !gym?.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerGym", gymId] });
      qc.invalidateQueries({ queryKey: ["ownerGyms"] });
      Toast.show({
        type: "success",
        text1: `Gym ${gym?.isActive ? "deactivated" : "activated"}`,
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => membershipPlansApi.delete(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] });
      Toast.show({ type: "success", text1: "Plan deleted" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const [serviceInput, setServiceInput] = useState("");
  const [facilityInput, setFacilityInput] = useState("");

  const updateGymMutation = useMutation({
    mutationFn: (data: { services?: string[]; facilities?: string[] }) =>
      gymsApi.update(gymId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownerGym", gymId] }),
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const addService = () => {
    const val = serviceInput.trim();
    if (!val || gym?.services?.includes(val)) return;
    updateGymMutation.mutate({ services: [...(gym?.services ?? []), val] });
    setServiceInput("");
  };

  const removeService = (sv: string) =>
    updateGymMutation.mutate({
      services: (gym?.services ?? []).filter((s) => s !== sv),
    });

  const addFacility = () => {
    const val = facilityInput.trim();
    if (!val || gym?.facilities?.includes(val)) return;
    updateGymMutation.mutate({ facilities: [...(gym?.facilities ?? []), val] });
    setFacilityInput("");
  };

  const removeFacility = (f: string) =>
    updateGymMutation.mutate({
      facilities: (gym?.facilities ?? []).filter((fac) => fac !== f),
    });

  const confirmDeletePlan = (planId: string, planName: string) => {
    Alert.alert("Delete Plan", `Delete "${planName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlanMutation.mutate(planId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Gym Details" back />
          <Skeleton height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym) return null;
  return (
    <SafeAreaView style={styles.safe}>
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
        <Header
          title={gym.name}
          subtitle={gym.city ?? undefined}
          back
          right={
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  borderColor: gym.isActive
                    ? Colors.success + "40"
                    : Colors.border,
                },
              ]}
              onPress={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? (
                <ActivityIndicator size={16} color={Colors.textMuted} />
              ) : (
                <Icon
                  name={gym.isActive ? "toggle-switch" : "toggle-switch-off"}
                  size={22}
                  color={gym.isActive ? Colors.success : Colors.textMuted}
                />
              )}
            </TouchableOpacity>
          }
        />

        <View style={styles.cover}>
          <GymImageCarousel images={gym.gymImages ?? []} height={300} />
        </View>
        <View style={styles.badges}>
          <Badge
            label={gym.isActive ? "Active" : "Inactive"}
            variant={gym.isActive ? "success" : "default"}
          />
          {gym.city ? <Badge label={gym.city} /> : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          style={styles.tabsContainer}
        >
          {(
            [
              { key: "overview", label: "Overview" },
              {
                key: "members",
                label: `Members (${gym._count?.members ?? 0})`,
              },
              {
                key: "trainers",
                label: `Trainers (${gym._count?.trainers ?? 0})`,
              },
              {
                key: "services",
                label: `Services (${gym.services?.length ?? 0})`,
              },
              {
                key: "facilities",
                label: `Facilities (${gym.facilities?.length ?? 0})`,
              },
              { key: "plans", label: `Plans (${plans.length})` },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, tab === t.key && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {tab === "overview" && (
          <View style={styles.section}>
            <Card>
              <ListRow
                icon="account-group-outline"
                label="Total Members"
                value={String(gym._count?.members ?? 0)}
                iconColor={Colors.primary}
                iconBg={Colors.primaryFaded}
                bordered
              />
              <ListRow
                icon="account-tie-outline"
                label="Trainers"
                value={String(gym._count?.trainers ?? 0)}
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
                bordered
              />
              {gym.contactNumber ? (
                <ListRow
                  icon="phone-outline"
                  label="Contact"
                  value={gym.contactNumber}
                  iconColor={Colors.success}
                  iconBg={Colors.successFaded}
                  bordered
                />
              ) : null}
              {gym.address ? (
                <ListRow
                  icon="map-marker-outline"
                  label="Address"
                  value={gym.address}
                />
              ) : null}
            </Card>
          </View>
        )}

        {tab === "members" && (
          <View style={styles.section}>
            {membersLoading ? (
              <Skeleton height={60} />
            ) : (membersData?.members ?? []).length === 0 ? (
              <View style={styles.emptyTab}>
                <Icon
                  name="account-group-outline"
                  size={32}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTabText}>No members in this gym</Text>
              </View>
            ) : (
              membersData!.members.map((m: GymMemberListItem) => {
                const statusColor =
                  m.status === "ACTIVE"
                    ? Colors.success
                    : m.status === "EXPIRED"
                      ? Colors.error
                      : m.status === "SUSPENDED"
                        ? Colors.warning
                        : Colors.textMuted;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.listItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      (navigation as any).navigate("Members", {
                        screen: "OwnerMemberDetail",
                        params: { memberId: m.id },
                      })
                    }
                  >
                    <Avatar
                      name={m.profile.fullName}
                      url={m.profile.avatarUrl}
                      size={44}
                    />
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>
                        {m.profile.fullName}
                      </Text>
                      <Text style={styles.listItemSub} numberOfLines={1}>
                        {m.membershipPlan?.name ?? "No plan"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Icon
                      name="chevron-right"
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {tab === "trainers" && (
          <View style={styles.section}>
            {trainersLoading ? (
              <Skeleton height={60} />
            ) : trainers.length === 0 ? (
              <View style={styles.emptyTab}>
                <Icon
                  name="account-tie-outline"
                  size={32}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTabText}>No trainers in this gym</Text>
              </View>
            ) : (
              trainers.map((t: Trainer) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.listItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    (navigation as any).navigate("OwnerTrainers", { gymId })
                  }
                >
                  <Avatar
                    name={t.profile.fullName}
                    url={t.profile.avatarUrl}
                    size={44}
                  />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>
                      {t.profile.fullName}
                    </Text>
                    <Text style={styles.listItemSub}>
                      {t._count.assignedMembers} member
                      {t._count.assignedMembers !== 1 ? "s" : ""} assigned
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {tab === "services" && (
          <View style={styles.section}>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Add a service..."
                placeholderTextColor={Colors.textMuted}
                value={serviceInput}
                onChangeText={setServiceInput}
                onSubmitEditing={addService}
                returnKeyType="done"
                editable={!updateGymMutation.isPending}
              />
              <TouchableOpacity
                style={[
                  styles.addRowBtn,
                  (!serviceInput.trim() || updateGymMutation.isPending) &&
                    styles.addRowBtnDisabled,
                ]}
                onPress={addService}
                disabled={!serviceInput.trim() || updateGymMutation.isPending}
              >
                {updateGymMutation.isPending ? (
                  <ActivityIndicator size={14} color="#fff" />
                ) : (
                  <Icon name="plus" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            {(gym.services?.length ?? 0) === 0 ? (
              <View style={styles.emptyTab}>
                <Icon name="tag-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTabText}>No services yet</Text>
              </View>
            ) : (
              <View style={styles.chipGrid}>
                {gym.services.map((sv: string) => (
                  <View key={sv} style={styles.chip}>
                    <Icon name="check-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.chipText}>{sv}</Text>
                    <TouchableOpacity
                      onPress={() => removeService(sv)}
                      disabled={updateGymMutation.isPending}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {updateGymMutation.isPending ? (
                        <ActivityIndicator size={12} color={Colors.textMuted} />
                      ) : (
                        <Icon name="close" size={14} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === "facilities" && (
          <View style={styles.section}>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Add a facility..."
                placeholderTextColor={Colors.textMuted}
                value={facilityInput}
                onChangeText={setFacilityInput}
                onSubmitEditing={addFacility}
                returnKeyType="done"
                editable={!updateGymMutation.isPending}
              />
              <TouchableOpacity
                style={[
                  styles.addRowBtn,
                  (!facilityInput.trim() || updateGymMutation.isPending) &&
                    styles.addRowBtnDisabled,
                ]}
                onPress={addFacility}
                disabled={!facilityInput.trim() || updateGymMutation.isPending}
              >
                {updateGymMutation.isPending ? (
                  <ActivityIndicator size={14} color="#fff" />
                ) : (
                  <Icon name="plus" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            {(gym.facilities?.length ?? 0) === 0 ? (
              <View style={styles.emptyTab}>
                <Icon name="office-building-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTabText}>No facilities yet</Text>
              </View>
            ) : (
              <View style={styles.chipGrid}>
                {gym.facilities.map((f: string) => (
                  <View key={f} style={styles.chip}>
                    <Icon name="check-circle-outline" size={14} color={Colors.info} />
                    <Text style={styles.chipText}>{f}</Text>
                    <TouchableOpacity
                      onPress={() => removeFacility(f)}
                      disabled={updateGymMutation.isPending}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {updateGymMutation.isPending ? (
                        <ActivityIndicator size={12} color={Colors.textMuted} />
                      ) : (
                        <Icon name="close" size={14} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === "plans" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addPlanBtn}
              onPress={() =>
                (navigation as any).navigate("OwnerPlans", { gymId })
              }
            >
              <Icon name="plus" size={16} color={Colors.primary} />
              <Text style={styles.addPlanText}>Add Membership Plan</Text>
            </TouchableOpacity>

            {plansLoading ? (
              <Skeleton height={80} />
            ) : plans.length === 0 ? (
              <View style={styles.emptyPlans}>
                <Icon name="tag-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyPlansText}>No plans yet</Text>
              </View>
            ) : (
              plans.map((plan: MembershipPlan) => (
                <Card key={plan.id} style={{ marginBottom: Spacing.sm }}>
                  <View style={styles.planRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planMeta}>
                        {plan.durationMonths} month
                        {plan.durationMonths !== 1 ? "s" : ""} ·{" "}
                        {fmt(plan.price)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDeletePlan(plan.id, plan.name)}
                      disabled={deletePlanMutation.isPending}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {deletePlanMutation.isPending &&
                      deletePlanMutation.variables === plan.id ? (
                        <ActivityIndicator size={18} color={Colors.error} />
                      ) : (
                        <Icon
                          name="trash-can-outline"
                          size={18}
                          color={
                            deletePlanMutation.isPending
                              ? Colors.textMuted
                              : Colors.error
                          }
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  {plan.features?.length > 0 && (
                    <View style={styles.features}>
                      {plan.features.slice(0, 3).map((f: string) => (
                        <View key={f} style={styles.featureRow}>
                          <Icon name="check" size={12} color={Colors.success} />
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OwnerGymDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  toggleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  badges: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  tabs: {},
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 0,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: -1,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  section: { gap: Spacing.md },
  tagsSection: { gap: Spacing.sm },
  tagSectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  tag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { color: Colors.textSecondary, fontSize: Typography.xs },
  actions: { flexDirection: "row", gap: Spacing.sm },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  addPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    paddingVertical: Spacing.md,
    justifyContent: "center",
  },
  addPlanText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  emptyPlans: { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyPlansText: { color: Colors.textMuted, fontSize: Typography.sm },
  planRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  planName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  features: { marginTop: Spacing.sm, gap: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  featureText: { color: Colors.textSecondary, fontSize: Typography.xs },
  emptyTab: { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTabText: { color: Colors.textMuted, fontSize: Typography.sm },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.textPrimary, fontSize: Typography.sm },
  addRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  addRowBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addRowBtnDisabled: { backgroundColor: Colors.textMuted },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  listItemInfo: { flex: 1 },
  listItemName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  listItemSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
