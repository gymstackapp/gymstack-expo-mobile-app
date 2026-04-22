import {
  gymsApi,
  membersApi,
  membershipPlansApi,
  paymentsApi,
  trainersApi,
} from "@/api/endpoints";
import {
  Avatar,
  Badge,
  Card,
  Header,
  Input,
  MultiImageUpload,
  Skeleton,
  StatCard,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICES = [
  "Weight Training",
  "Cardio",
  "Yoga",
  "Zumba",
  "CrossFit",
  "Boxing",
  "Swimming",
  "Cycling",
  "Pilates",
  "HIIT",
  "Personal Training",
  "Massage",
  "Diet Planning",
  "Supplements",
  "Sports Training",
];
const FACILITIES = [
  "Locker Room",
  "Shower",
  "Parking",
  "AC",
  "WiFi",
  "Cafeteria",
  "Steam Room",
  "Sauna",
  "Pro Shop",
  "Child Care",
  "Changing Room",
  "Water Cooler",
  "First Aid",
  "CCTV",
  "Music System",
];

const TABS = [
  { key: "details", label: "Details" },
  { key: "members", label: "Members" },
  { key: "trainers", label: "Trainers" },
  { key: "facilities", label: "Facilities" },
  { key: "services", label: "Services" },
  { key: "plans", label: "Plans" },
  { key: "photos", label: "Photos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function GymImageCarousel({
  images,
  height,
  onPress,
}: {
  images: string[];
  height: number;
  onPress?: (index: number) => void;
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
      <View
        style={{
          height,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.surface,
        }}
      >
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
      {/* Tap overlay — sits above images, below dots */}
      {onPress && (
        <TouchableOpacity
          style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}
          activeOpacity={0.85}
          onPress={() => onPress(activeIndex)}
        />
      )}
      {images.length > 1 && (
        <View style={cs.dots}>
          {images.map((_, i) => (
            <View key={i} style={[cs.dot, i === activeIndex && cs.dotActive]} />
          ))}
        </View>
      )}
      <View style={cs.counter}>
        <Text style={cs.counterText}>
          {activeIndex + 1}/{images.length}
        </Text>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
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
  counter: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: { color: "#fff", fontSize: 11 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const OwnerGymDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();
  const { gymId } = route.params as { gymId: string };

  const [tab, setTab] = useState<TabKey>("details");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Gym>>({});

  // Custom service / facility input state
  const [serviceInput, setServiceInput] = useState("");
  const [facilityInput, setFacilityInput] = useState("");

  // Plan form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    durationMonths: "1",
    price: "",
    features: "",
  });
  const [planSaving, setPlanSaving] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

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

  const { data: payStats } = useQuery<any>({
    queryKey: ["gymPayStats", gymId],
    queryFn: () => paymentsApi.list({ gymId, page: 1 }),
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateGymMutation = useMutation({
    mutationFn: (data: object) => gymsApi.update(gymId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerGym", gymId] });
      qc.invalidateQueries({ queryKey: ["ownerGyms"] });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => membershipPlansApi.delete(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] });
      Toast.show({ type: "success", text1: "Plan deactivated" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const startEdit = () => {
    setEditForm({ ...(gym ?? {}) });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const saveDetails = async () => {
    const { name, address, city, state, pincode, contactNumber } = editForm;
    await updateGymMutation.mutateAsync({
      name,
      address,
      city,
      state,
      pincode,
      contactNumber,
    });
    Toast.show({ type: "success", text1: "Gym updated" });
    setEditing(false);
  };

  const savePhotos = async () => {
    await updateGymMutation.mutateAsync({
      gymImages: editForm.gymImages ?? [],
    });
    Toast.show({ type: "success", text1: "Photos saved" });
    setEditing(false);
  };

  const toggleFacility = (v: string) => {
    if (!gym) return;
    const current = gym.facilities ?? [];
    const updated = current.includes(v)
      ? current.filter((x) => x !== v)
      : [...current, v];
    updateGymMutation.mutate({ facilities: updated });
  };

  const addFacility = () => {
    const val = facilityInput.trim();
    if (!val || !gym || gym.facilities?.includes(val)) return;
    updateGymMutation.mutate({ facilities: [...(gym.facilities ?? []), val] });
    setFacilityInput("");
  };

  const removeFacility = (v: string) => {
    if (!gym) return;
    updateGymMutation.mutate({
      facilities: (gym.facilities ?? []).filter((f) => f !== v),
    });
  };

  const toggleService = (v: string) => {
    if (!gym) return;
    const current = gym.services ?? [];
    const updated = current.includes(v)
      ? current.filter((x) => x !== v)
      : [...current, v];
    updateGymMutation.mutate({ services: updated });
  };

  const addService = () => {
    const val = serviceInput.trim();
    if (!val || !gym || gym.services?.includes(val)) return;
    updateGymMutation.mutate({ services: [...(gym.services ?? []), val] });
    setServiceInput("");
  };

  const removeService = (v: string) => {
    if (!gym) return;
    updateGymMutation.mutate({
      services: (gym.services ?? []).filter((s) => s !== v),
    });
  };

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      description: "",
      durationMonths: "1",
      price: "",
      features: "",
    });
    setShowPlanForm(true);
  };

  const openEditPlan = (p: MembershipPlan) => {
    setEditingPlan(p);
    setPlanForm({
      name: p.name,
      description: p.description ?? "",
      durationMonths: String(p.durationMonths),
      price: String(p.price),
      features: p.features.join(", "),
    });
    setShowPlanForm(true);
  };

  const savePlan = async () => {
    if (!planForm.name || !planForm.price) {
      Toast.show({ type: "error", text1: "Name and price are required" });
      return;
    }
    setPlanSaving(true);
    const payload = {
      gymId,
      name: planForm.name,
      description: planForm.description || null,
      durationMonths: parseInt(planForm.durationMonths) || 1,
      price: parseFloat(planForm.price),
      features: planForm.features
        ? planForm.features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    try {
      if (editingPlan) {
        await membershipPlansApi.update(editingPlan.id, payload);
        Toast.show({ type: "success", text1: "Plan updated" });
      } else {
        await membershipPlansApi.create(payload);
        Toast.show({ type: "success", text1: "Plan added" });
      }
      qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] });
      setShowPlanForm(false);
    } catch {
      Toast.show({ type: "error", text1: "Failed to save plan" });
    } finally {
      setPlanSaving(false);
    }
  };

  const confirmDeletePlan = (planId: string, planName: string) => {
    showAlert("Deactivate Plan", `Deactivate "${planName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: () => deletePlanMutation.mutate(planId),
      },
    ]);
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Header title="Gym Details" back />
          <Skeleton height={200} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym) return null;

  const monthRevenue = payStats?.monthTotal ?? 0;
  const totalRevenue = payStats?.allTimeRevenue ?? 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
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
        {/* ── Header ─────────────────────────────────────────────── */}
        <Header
          title={gym.name}
          subtitle={
            [gym.address, gym.city, gym.state].filter(Boolean).join(", ") ||
            undefined
          }
          back
        />

        {/* ── Carousel ───────────────────────────────────────────── */}
        <View style={s.cover}>
          <GymImageCarousel
            images={gym.gymImages ?? []}
            height={220}
            onPress={(index) =>
              (navigation as any).navigate("GymImageViewer", {
                gymName: gym.name,
                images: gym.gymImages ?? [],
                initialIndex: index,
              })
            }
          />
        </View>

        {/* ── Status badge ───────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <Badge
            label={gym.isActive ? "Active" : "Inactive"}
            variant={gym.isActive ? "success" : "default"}
          />
        </View>

        {/* ── Stats grid (2 × 2) ─────────────────────────────────── */}
        <View style={s.statsGrid}>
          <StatCard
            icon="account-group-outline"
            label="Members"
            value={gym._count?.members ?? 0}
            style={{ flex: 1 }}
          />
          <StatCard
            icon="account-check-outline"
            label="Trainers"
            value={gym._count?.trainers ?? 0}
            style={{ flex: 1 }}
            color="#60a5fa"
            bg="#60a5fa22"
          />
        </View>
        <View style={s.statsGrid}>
          <StatCard
            icon="credit-card-outline"
            label="This Month"
            value={fmt(monthRevenue)}
            style={{ flex: 1 }}
            color={Colors.success}
            bg={Colors.successFaded}
          />
          <StatCard
            icon="trending-up"
            label="Total Revenue"
            value={fmt(totalRevenue)}
            style={{ flex: 1 }}
            color="#fb923c"
            bg="#fb923c22"
          />
        </View>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
          style={s.tabsContainer}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => {
                setTab(t.key);
                setEditing(false);
              }}
              style={[s.tab, tab === t.key && s.tabActive]}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Details ────────────────────────────────────────────── */}
        {tab === "details" && (
          <Card>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>Basic Information</Text>
              {!editing && (
                <TouchableOpacity onPress={startEdit}>
                  <Icon
                    name="pencil-outline"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
            {editing ? (
              <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                {(
                  [
                    "name",
                    "address",
                    "city",
                    "state",
                    "pincode",
                    "contactNumber",
                  ] as const
                ).map((field) => (
                  <Input
                    key={field}
                    label={
                      field === "contactNumber"
                        ? "Contact Number"
                        : field.charAt(0).toUpperCase() + field.slice(1)
                    }
                    value={(editForm as any)[field] ?? ""}
                    onChangeText={(v) =>
                      setEditForm((p) => ({ ...p, [field]: v }))
                    }
                    autoCapitalize="words"
                    keyboardType={
                      field === "contactNumber" || field === "pincode"
                        ? "phone-pad"
                        : "default"
                    }
                  />
                ))}
                <View style={s.formActions}>
                  <TouchableOpacity
                    style={[s.saveBtn]}
                    onPress={saveDetails}
                    disabled={updateGymMutation.isPending}
                  >
                    {updateGymMutation.isPending ? (
                      <ActivityIndicator size={14} color="#fff" />
                    ) : (
                      <Text style={s.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                {(
                  [
                    ["Address", gym.address],
                    ["City", gym.city],
                    ["State", gym.state],
                    ["Pincode", gym.pincode],
                    ["Contact", gym.contactNumber],
                  ] as [string, string | null][]
                ).map(([label, value]) =>
                  value ? (
                    <View key={label} style={s.detailRow}>
                      <Text style={s.detailLabel}>{label}</Text>
                      <Text style={s.detailValue}>{value}</Text>
                    </View>
                  ) : null,
                )}
              </View>
            )}
          </Card>
        )}

        {/* ── Members ────────────────────────────────────────────── */}
        {tab === "members" && (
          <View style={{ gap: Spacing.md }}>
            <View style={s.tabActionRow}>
              <Text style={s.tabSubtitle}>
                {gym._count?.members ?? 0} member
                {gym._count?.members !== 1 ? "s" : ""} enrolled
              </Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() =>
                  (navigation as any).navigate("Members", {
                    screen: "OwnerAddMember",
                  })
                }
              >
                <Icon name="plus" size={14} color="#fff" />
                <Text style={s.addBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {membersLoading ? (
                <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={56} />
                  ))}
                </View>
              ) : (membersData?.members ?? []).length === 0 ? (
                <View style={s.emptyTab}>
                  <Icon
                    name="account-group-outline"
                    size={32}
                    color={Colors.textMuted}
                  />
                  <Text style={s.emptyTabText}>No members in this gym</Text>
                </View>
              ) : (
                membersData!.members.map((m: GymMemberListItem, idx) => {
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
                      style={[s.listItem, idx > 0 && s.listItemBorder]}
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
                        size={40}
                      />
                      <View style={s.listItemInfo}>
                        <Text style={s.listItemName}>{m.profile.fullName}</Text>
                        <Text style={s.listItemSub} numberOfLines={1}>
                          {m.profile.mobileNumber ?? m.profile.email}
                        </Text>
                      </View>
                      {m.endDate && (
                        <View>
                          <Text
                            style={s.listItemSub}
                          >{`Expires on: ${new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}</Text>
                        </View>
                      )}
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <View
                          style={[
                            s.statusBadge,
                            { backgroundColor: statusColor + "22" },
                          ]}
                        >
                          <Text
                            style={[s.statusBadgeText, { color: statusColor }]}
                          >
                            {m.status}
                          </Text>
                        </View>
                        {m.membershipPlan && (
                          <Text style={s.planLabel}>
                            {m.membershipPlan.name}
                          </Text>
                        )}
                      </View>
                      <Icon
                        name="chevron-right"
                        size={16}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </Card>
          </View>
        )}

        {/* ── Trainers ───────────────────────────────────────────── */}
        {tab === "trainers" && (
          <View style={{ gap: Spacing.md }}>
            <View style={s.tabActionRow}>
              <Text style={s.tabSubtitle}>
                {gym._count?.trainers ?? 0} trainer
                {gym._count?.trainers !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => (navigation as any).navigate("OwnerTrainers")}
              >
                <Icon name="plus" size={14} color="#fff" />
                <Text style={s.addBtnText}>Add Trainer</Text>
              </TouchableOpacity>
            </View>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {trainersLoading ? (
                <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={56} />
                  ))}
                </View>
              ) : trainers.length === 0 ? (
                <View style={s.emptyTab}>
                  <Icon
                    name="account-tie-outline"
                    size={32}
                    color={Colors.textMuted}
                  />
                  <Text style={s.emptyTabText}>No trainers in this gym</Text>
                </View>
              ) : (
                trainers.map((t: Trainer, idx) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.listItem, idx > 0 && s.listItemBorder]}
                    activeOpacity={0.7}
                    onPress={() =>
                      (navigation as any).navigate("OwnerTrainers")
                    }
                  >
                    <Avatar
                      name={t.profile.fullName}
                      url={t.profile.avatarUrl}
                      size={40}
                    />
                    <View style={s.listItemInfo}>
                      <Text style={s.listItemName}>{t.profile.fullName}</Text>
                      <Text style={s.listItemSub}>
                        {t.experienceYears}yr exp · {t._count.assignedMembers}{" "}
                        member{t._count.assignedMembers !== 1 ? "s" : ""} ·{" "}
                        {t.profile.mobileNumber}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      {t.specializations?.length > 0 && (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 4,
                            marginTop: 4,
                          }}
                        >
                          {t.specializations.slice(0, 2).map((sp) => (
                            <View key={sp} style={s.specChip}>
                              <Text style={s.specChipText}>{sp}</Text>
                            </View>
                          ))}
                          {t.specializations.length > 2 && (
                            <Text style={s.specMore}>
                              +{t.specializations.length - 2}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                ))
              )}
            </Card>
          </View>
        )}

        {/* ── Facilities ─────────────────────────────────────────── */}
        {tab === "facilities" && (
          <Card>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>Facilities</Text>
              {updateGymMutation.isPending && (
                <ActivityIndicator size={14} color={Colors.primary} />
              )}
            </View>

            {/* Custom entry input */}
            <View style={[s.addRow, { marginTop: Spacing.md }]}>
              <TextInput
                style={s.addInput}
                placeholder="Add a custom facility..."
                placeholderTextColor={Colors.textMuted}
                value={facilityInput}
                onChangeText={setFacilityInput}
                onSubmitEditing={addFacility}
                returnKeyType="done"
                editable={!updateGymMutation.isPending}
              />
              <TouchableOpacity
                style={[
                  s.addRowBtn,
                  (!facilityInput.trim() || updateGymMutation.isPending) &&
                    s.addRowBtnDisabled,
                ]}
                onPress={addFacility}
                disabled={!facilityInput.trim() || updateGymMutation.isPending}
              >
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Custom items (not in predefined list) — shown with X */}
            {(gym.facilities ?? []).filter((f) => !FACILITIES.includes(f))
              .length > 0 && (
              <>
                <Text
                  style={[
                    s.chipHint,
                    { marginTop: Spacing.md, marginBottom: Spacing.sm },
                  ]}
                >
                  Custom
                </Text>
                <View style={s.chipGrid}>
                  {(gym.facilities ?? [])
                    .filter((f) => !FACILITIES.includes(f))
                    .map((f) => (
                      <View
                        key={f}
                        style={[
                          s.chip,
                          s.chipActive,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Text style={[s.chipText, s.chipTextActive]}>{f}</Text>
                        <TouchableOpacity
                          onPress={() => removeFacility(f)}
                          disabled={updateGymMutation.isPending}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Icon name="close" size={13} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </>
            )}

            {/* Predefined toggle chips */}
            <Text
              style={[
                s.chipHint,
                { marginTop: Spacing.lg, marginBottom: Spacing.sm },
              ]}
            >
              Tap to add / remove
            </Text>
            <View style={s.chipGrid}>
              {FACILITIES.map((f) => {
                const active = gym.facilities?.includes(f);
                return (
                  <TouchableOpacity
                    key={f}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => toggleFacility(f)}
                    disabled={updateGymMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Services ───────────────────────────────────────────── */}
        {tab === "services" && (
          <Card>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>Services</Text>
              {updateGymMutation.isPending && (
                <ActivityIndicator size={14} color={Colors.primary} />
              )}
            </View>

            {/* Custom entry input */}
            <View style={[s.addRow, { marginTop: Spacing.md }]}>
              <TextInput
                style={s.addInput}
                placeholder="Add a custom service..."
                placeholderTextColor={Colors.textMuted}
                value={serviceInput}
                onChangeText={setServiceInput}
                onSubmitEditing={addService}
                returnKeyType="done"
                editable={!updateGymMutation.isPending}
              />
              <TouchableOpacity
                style={[
                  s.addRowBtn,
                  (!serviceInput.trim() || updateGymMutation.isPending) &&
                    s.addRowBtnDisabled,
                ]}
                onPress={addService}
                disabled={!serviceInput.trim() || updateGymMutation.isPending}
              >
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Custom items (not in predefined list) — shown with X */}
            {(gym.services ?? []).filter((sv) => !SERVICES.includes(sv))
              .length > 0 && (
              <>
                <Text
                  style={[
                    s.chipHint,
                    { marginTop: Spacing.md, marginBottom: Spacing.sm },
                  ]}
                >
                  Custom
                </Text>
                <View style={s.chipGrid}>
                  {(gym.services ?? [])
                    .filter((sv) => !SERVICES.includes(sv))
                    .map((sv) => (
                      <View
                        key={sv}
                        style={[
                          s.chip,
                          s.chipActive,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Text style={[s.chipText, s.chipTextActive]}>{sv}</Text>
                        <TouchableOpacity
                          onPress={() => removeService(sv)}
                          disabled={updateGymMutation.isPending}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Icon name="close" size={13} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </>
            )}

            {/* Predefined toggle chips */}
            <Text
              style={[
                s.chipHint,
                { marginTop: Spacing.lg, marginBottom: Spacing.sm },
              ]}
            >
              Tap to add / remove
            </Text>
            <View style={s.chipGrid}>
              {SERVICES.map((sv) => {
                const active = gym.services?.includes(sv);
                return (
                  <TouchableOpacity
                    key={sv}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => toggleService(sv)}
                    disabled={updateGymMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {sv}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Plans ──────────────────────────────────────────────── */}
        {tab === "plans" && (
          <View style={{ gap: Spacing.md }}>
            <View style={s.tabActionRow}>
              <Text style={s.tabSubtitle}>
                {plans.length} plan{plans.length !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity style={s.addBtn} onPress={openAddPlan}>
                <Icon name="plus" size={14} color="#fff" />
                <Text style={s.addBtnText}>Add Plan</Text>
              </TouchableOpacity>
            </View>

            {/* Inline plan form */}
            {showPlanForm && (
              <Card
                style={{ borderColor: Colors.primary + "44", borderWidth: 1 }}
              >
                <View style={s.cardHeaderRow}>
                  <Text style={s.cardTitle}>
                    {editingPlan ? "Edit Plan" : "New Plan"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowPlanForm(false)}>
                    <Icon name="close" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <Input
                    label="Plan Name *"
                    value={planForm.name}
                    onChangeText={(v) =>
                      setPlanForm((p) => ({ ...p, name: v }))
                    }
                  />
                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Price (₹) *"
                        value={planForm.price}
                        onChangeText={(v) =>
                          setPlanForm((p) => ({ ...p, price: v }))
                        }
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Duration (months)"
                        value={planForm.durationMonths}
                        onChangeText={(v) =>
                          setPlanForm((p) => ({ ...p, durationMonths: v }))
                        }
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <Input
                    label="Description"
                    value={planForm.description}
                    onChangeText={(v) =>
                      setPlanForm((p) => ({ ...p, description: v }))
                    }
                  />
                  <Input
                    label="Features (comma separated)"
                    value={planForm.features}
                    onChangeText={(v) =>
                      setPlanForm((p) => ({ ...p, features: v }))
                    }
                    placeholder="Gym access, Locker, 2 PT sessions"
                  />
                  <View style={s.formActions}>
                    <TouchableOpacity
                      style={s.saveBtn}
                      onPress={savePlan}
                      disabled={planSaving}
                    >
                      {planSaving ? (
                        <ActivityIndicator size={14} color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>
                          {editingPlan ? "Save Changes" : "Add Plan"}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.cancelBtn}
                      onPress={() => setShowPlanForm(false)}
                    >
                      <Text style={s.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}

            {plansLoading ? (
              <Skeleton height={100} />
            ) : plans.length === 0 && !showPlanForm ? (
              <View style={s.emptyTab}>
                <Icon name="tag-outline" size={32} color={Colors.textMuted} />
                <Text style={s.emptyTabText}>No membership plans yet</Text>
              </View>
            ) : (
              plans.map((plan: MembershipPlan) => (
                <Card
                  key={plan.id}
                  style={{
                    borderColor: plan.isActive
                      ? Colors.borderFocused
                      : Colors.border,
                  }}
                >
                  <View style={s.planHeader}>
                    <View
                      style={[
                        s.statusBadge,
                        {
                          backgroundColor: plan.isActive
                            ? Colors.success + "22"
                            : Colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.statusBadgeText,
                          {
                            color: plan.isActive
                              ? Colors.success
                              : Colors.textMuted,
                          },
                        ]}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.planPrice,
                        {
                          color: plan.isActive
                            ? Colors.primary
                            : Colors.textDisabled,
                        },
                      ]}
                    >
                      ₹{Number(plan.price).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <Text style={s.planName}>{plan.name}</Text>
                  <Text style={s.planMeta}>
                    {plan.durationMonths} month
                    {plan.durationMonths !== 1 ? "s" : ""}
                  </Text>
                  {plan.features?.length > 0 && (
                    <View style={{ marginTop: Spacing.sm, gap: 4 }}>
                      {plan.features.map((f) => (
                        <View key={f} style={s.featureRow}>
                          <Icon
                            name="check-circle-outline"
                            size={13}
                            color={Colors.primary}
                          />
                          <Text style={s.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={s.planActions}>
                    <TouchableOpacity
                      style={s.planActionBtn}
                      disabled={!plan.isActive}
                      onPress={() => openEditPlan(plan)}
                    >
                      <Icon
                        name="pencil-outline"
                        size={14}
                        color={
                          plan.isActive ? Colors.primary : Colors.textDisabled
                        }
                      />
                      <Text
                        style={[
                          s.planActionText,
                          {
                            color: plan.isActive
                              ? Colors.primary
                              : Colors.textDisabled,
                          },
                        ]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <View style={s.planDivider} />
                    <TouchableOpacity
                      style={s.planActionBtn}
                      onPress={() => confirmDeletePlan(plan.id, plan.name)}
                      disabled={
                        (deletePlanMutation.isPending &&
                          deletePlanMutation.variables === plan.id) ||
                        !plan.isActive
                      }
                    >
                      {deletePlanMutation.isPending &&
                      deletePlanMutation.variables === plan.id ? (
                        <ActivityIndicator size={14} color={Colors.error} />
                      ) : (
                        <Icon
                          name="trash-can-outline"
                          size={14}
                          color={
                            plan.isActive ? Colors.error : Colors.textDisabled
                          }
                        />
                      )}
                      <Text
                        style={[
                          s.planActionText,
                          {
                            color: plan.isActive
                              ? Colors.error
                              : Colors.textDisabled,
                          },
                        ]}
                      >
                        Deactivate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ── Photos ─────────────────────────────────────────────── */}
        {tab === "photos" && (
          <Card>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>
                Gym Photos{" "}
                <Text style={{ color: Colors.textMuted, fontWeight: "400" }}>
                  (up to 8)
                </Text>
              </Text>
              {!editing && (
                <TouchableOpacity
                  onPress={() => {
                    setEditForm({ gymImages: [...(gym.gymImages ?? [])] });
                    setEditing(true);
                  }}
                >
                  <Icon
                    name="pencil-outline"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {editing ? (
              <>
                <MultiImageUpload
                  values={editForm.gymImages ?? []}
                  onChange={(urls) =>
                    setEditForm((p) => ({ ...p, gymImages: urls }))
                  }
                  max={8}
                  folder="gymImages"
                />
                <View style={[s.formActions, { marginTop: Spacing.md }]}>
                  <TouchableOpacity
                    style={s.saveBtn}
                    onPress={savePhotos}
                    disabled={updateGymMutation.isPending}
                  >
                    {updateGymMutation.isPending ? (
                      <ActivityIndicator size={14} color="#fff" />
                    ) : (
                      <Text style={s.saveBtnText}>Save Photos</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (gym.gymImages?.length ?? 0) > 0 ? (
              <View style={s.photoGrid}>
                {gym.gymImages.map((url, i) => (
                  <Image
                    key={i}
                    source={{ uri: url }}
                    style={s.photoThumb}
                    resizeMode="cover"
                  />
                ))}
              </View>
            ) : (
              <View style={s.emptyTab}>
                <Icon name="image-outline" size={36} color={Colors.textMuted} />
                <Text style={s.emptyTabText}>No photos uploaded yet</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditForm({ gymImages: [] });
                    setEditing(true);
                  }}
                >
                  <Text
                    style={{ color: Colors.primary, fontSize: Typography.sm }}
                  >
                    Add photos
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OwnerGymDetailScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },

  // Header buttons
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  // Carousel
  cover: { borderRadius: Radius.xl, overflow: "hidden" },

  // Stats
  statsGrid: { flexDirection: "row", gap: Spacing.md },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: -Spacing.lg,
  },
  tabsScroll: { paddingHorizontal: Spacing.lg },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: 10, marginBottom: -1 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },

  // Tab helpers
  tabActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabSubtitle: { color: Colors.textMuted, fontSize: Typography.sm },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "600" },

  // Card titles
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Details tab
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: { color: Colors.textMuted, fontSize: Typography.sm },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },

  // Form buttons
  formActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "600" },
  cancelBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: { color: Colors.textMuted, fontSize: Typography.sm },

  // List items
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  listItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border + "55" },
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

  // Status badge
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: Typography.xs, fontWeight: "600" },
  planLabel: { color: Colors.textMuted, fontSize: Typography.xs },

  // Trainer specializations
  specChip: {
    backgroundColor: Colors.primary + "22",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  specChipText: { color: Colors.primary, fontSize: Typography.xs },
  specMore: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    alignSelf: "center",
  },

  // Chips (services / facilities)
  chipHint: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary + "66",
  },
  chipText: { color: Colors.textMuted, fontSize: Typography.sm },
  chipTextActive: { color: Colors.primary, fontWeight: "600" },

  // Plans
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  planName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  planPrice: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureText: { color: Colors.textSecondary, fontSize: Typography.xs },
  planActions: {
    flexDirection: "row",
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + "55",
    paddingTop: Spacing.sm,
  },
  planActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  planActionText: { fontSize: Typography.sm, fontWeight: "500" },
  planDivider: { width: 1, backgroundColor: Colors.border },

  // Photos
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoThumb: { width: 100, height: 100, borderRadius: Radius.lg },

  // Empty states
  emptyTab: { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTabText: { color: Colors.textMuted, fontSize: Typography.sm },

  // Custom input row (services / facilities)
  addRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
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
});
