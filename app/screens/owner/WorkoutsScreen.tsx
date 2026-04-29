// app/screens/owner/WorkoutsScreen.tsx
// List view + template picker — create/edit via AddWorkoutPlanScreen.
// Features: search, gym filter, duplicate, archive, template badge,
//           active-days/exercise count, template picker modal (web parity).
import { gymsApi, planTemplatesApi, workoutsApi } from "@/api/endpoints";
import {
  Badge,
  Card,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, WorkoutPlan } from "@/types/api";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.warning,
  ADVANCED: Colors.error,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcPlanStats(planData: Record<string, any[]> | undefined) {
  if (!planData) return { exercises: 0, activeDays: 0 };
  let exercises = 0;
  let activeDays = 0;
  for (const d of DAYS) {
    const len = (planData[d] ?? []).length;
    exercises += len;
    if (len > 0) activeDays++;
  }
  return { exercises, activeDays };
}

// ── Template picker modal ─────────────────────────────────────────────────────

interface Template {
  id: string;
  title: string;
  goal?: string | null;
  difficulty?: string | null;
  planData: any;
  isGlobal: boolean;
  usageCount: number;
  createdBy: { fullName: string };
  gym?: { name: string } | null;
}

function TemplatePicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (t: Template) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["planTemplates", "WORKOUT"],
    queryFn: () =>
      planTemplatesApi.list({ type: "WORKOUT" }) as Promise<Template[]>,
    enabled: visible,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.goal ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tp.backdrop}>
        <View style={tp.sheet}>
          {/* Header */}
          <View style={tp.header}>
            <View style={tp.headerLeft}>
              <Icon name="star-four-points" size={16} color={Colors.purple} />
              <Text style={tp.title}>Choose a Template</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={tp.searchRow}>
            <Icon name="magnify" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={tp.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search templates..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* List */}
          {isLoading ? (
            <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={tp.skeleton} />
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View style={tp.empty}>
              <Icon name="clipboard-list-outline" size={32} color={Colors.textMuted} />
              <Text style={tp.emptyTxt}>
                {search ? "No templates match your search" : "No templates yet"}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
            >
              {filtered.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={tp.item}
                  activeOpacity={0.8}
                  onPress={() => onSelect(t)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={tp.itemTitle}>{t.title}</Text>
                    {t.goal ? (
                      <Text style={tp.itemGoal}>🎯 {t.goal}</Text>
                    ) : null}
                    <Text style={tp.itemMeta}>
                      by {t.createdBy.fullName} · {t.usageCount} uses
                    </Text>
                  </View>
                  <View style={tp.itemRight}>
                    {t.difficulty ? (
                      <View
                        style={[
                          tp.diffBadge,
                          { backgroundColor: (DIFF_COLORS[t.difficulty] ?? Colors.textMuted) + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            tp.diffTxt,
                            { color: DIFF_COLORS[t.difficulty] ?? Colors.textMuted },
                          ]}
                        >
                          {t.difficulty}
                        </Text>
                      </View>
                    ) : null}
                    {t.isGlobal ? (
                      <View style={tp.globalBadge}>
                        <Text style={tp.globalTxt}>Global</Text>
                      </View>
                    ) : null}
                    <Icon name="chevron-right" size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OwnerWorkoutsScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { hasWorkoutPlans } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<WorkoutPlan[]>({
    queryKey: ["ownerWorkouts", gymId],
    queryFn: () =>
      workoutsApi.list({ gymId: gymId || undefined }) as Promise<WorkoutPlan[]>,
    enabled: hasWorkoutPlans,
    staleTime: 60_000,
  });

  const filteredPlans = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.goal ?? "").toLowerCase().includes(q),
    );
  }, [plans, searchQ]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const archiveMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({ type: "success", text1: "Plan archived" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (plan: WorkoutPlan) =>
      workoutsApi.create({
        gymId: (plan as any).gymId ?? (plan.gym as any)?.id,
        title: `${plan.title} (Copy)`,
        goal: plan.goal ?? null,
        description: plan.description ?? null,
        difficulty: plan.difficulty,
        durationWeeks: plan.durationWeeks,
        isGlobal: plan.isGlobal,
        planData: (plan as any).planData ?? {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({ type: "success", text1: "Plan duplicated!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmArchive = (plan: WorkoutPlan) => {
    showAlert("Archive Plan", `Archive "${plan.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => archiveMutation.mutate(plan.id),
      },
    ]);
  };

  // ── Template selection ─────────────────────────────────────────────────────

  const handleTemplateSelect = (t: Template) => {
    setShowTemplates(false);
    // Increment usage count (fire-and-forget)
    planTemplatesApi.incrementUsage(t.id).catch(() => {});
    // Navigate to create screen with template data pre-filled
    navigation.navigate("OwnerAddWorkoutPlan", { template: t });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Header
          title="Workout Plans"
          subtitle={`${filteredPlans.length} plan${filteredPlans.length !== 1 ? "s" : ""}`}
          back
          right={
            hasWorkoutPlans ? (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => navigation.navigate("OwnerAddWorkoutPlan")}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Search */}
        <View style={s.searchRow}>
          <Icon name="magnify" size={18} color={Colors.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search plans by title or goal..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Use Template + Gym filter row */}
        <View style={s.actionsRow}>
          {hasWorkoutPlans && (
            <TouchableOpacity
              style={s.templateBtn}
              onPress={() => setShowTemplates(true)}
            >
              <Icon name="star-four-points" size={13} color={Colors.purple} />
              <Text style={s.templateBtnTxt}>Use Template</Text>
            </TouchableOpacity>
          )}
          {gyms.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.xs }}
            >
              {[{ id: "", name: "All" } as Gym, ...gyms].map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGymId(g.id)}
                  style={[s.pill, gymId === g.id && s.pillActive]}
                >
                  <Text style={[s.pillText, gymId === g.id && s.pillTextActive]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <PlanGate allowed={hasWorkoutPlans} featureLabel="Workout Plans">
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup variant="card" count={4} itemHeight={100} gap={Spacing.md} />
          </View>
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            icon="clipboard-list-outline"
            title={searchQ ? "No plans match your search" : "No workout plans"}
            subtitle={
              searchQ
                ? "Try a different keyword"
                : "Create structured plans or start from a template"
            }
            action={
              !searchQ ? (
                <View style={s.emptyActions}>
                  <TouchableOpacity
                    style={s.emptyActionPrimary}
                    onPress={() => navigation.navigate("OwnerAddWorkoutPlan")}
                  >
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={s.emptyActionPrimaryTxt}>Create Plan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.emptyActionSecondary}
                    onPress={() => setShowTemplates(true)}
                  >
                    <Icon name="star-four-points" size={14} color={Colors.purple} />
                    <Text style={s.emptyActionSecondaryTxt}>From Template</Text>
                  </TouchableOpacity>
                </View>
              ) : undefined
            }
          />
        ) : (
          <FlatList<WorkoutPlan>
            data={filteredPlans}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            renderItem={({ item: p }) => {
              const { exercises, activeDays } = calcPlanStats((p as any).planData);
              const isTemplate = !!(p as any).isTemplate;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("OwnerWorkoutPlanDetail", { plan: p })
                  }
                >
                  <Card>
                    <View style={s.cardRow}>
                      <View style={{ flex: 1 }}>
                        {/* Title + badges */}
                        <View style={s.titleRow}>
                          <Text style={s.planTitle} numberOfLines={1}>
                            {p.title ?? "Untitled Plan"}
                          </Text>
                          {isTemplate && (
                            <View style={s.templateBadge}>
                              <Icon name="bookmark-outline" size={10} color={Colors.purple} />
                              <Text style={s.templateBadgeTxt}>Template</Text>
                            </View>
                          )}
                          {p.isGlobal && (
                            <View style={s.globalBadge}>
                              <Icon name="earth" size={10} color={Colors.info} />
                              <Text style={s.globalBadgeTxt}>All Members</Text>
                            </View>
                          )}
                        </View>

                        {/* Gym */}
                        <Text style={s.planMeta}>{p.gym?.name}</Text>

                        {p.goal ? <Text style={s.planGoal}>🎯 {p.goal}</Text> : null}

                        {/* Assignment */}
                        {p.assignedMember ? (
                          <View style={s.assignedRow}>
                            <Icon name="account-outline" size={11} color={Colors.primary} />
                            <Text style={s.assignedText}>
                              {p.assignedMember.profile?.fullName}
                            </Text>
                          </View>
                        ) : null}

                        {/* Stats */}
                        {(exercises > 0 || activeDays > 0) && (
                          <View style={s.statsRow}>
                            {exercises > 0 && (
                              <View style={s.stat}>
                                <Icon name="dumbbell" size={10} color={Colors.textMuted} />
                                <Text style={s.statTxt}>
                                  {exercises} exercise{exercises !== 1 ? "s" : ""}
                                </Text>
                              </View>
                            )}
                            {activeDays > 0 && (
                              <View style={s.stat}>
                                <Icon name="calendar-check-outline" size={10} color={Colors.textMuted} />
                                <Text style={s.statTxt}>
                                  {activeDays} active day{activeDays !== 1 ? "s" : ""}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      <View style={s.cardRight}>
                        <Badge
                          label={p.difficulty ?? "BEGINNER"}
                          variant={DIFF_VARIANT[p.difficulty ?? "BEGINNER"] ?? "default"}
                        />
                        <View style={s.actionBtns} onStartShouldSetResponder={() => true}>
                          <TouchableOpacity
                            onPress={() => duplicateMutation.mutate(p)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="content-copy" size={15} color={Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate("OwnerAddWorkoutPlan", { plan: p })
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="pencil-outline" size={15} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => confirmArchive(p)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="archive-outline" size={15} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </PlanGate>

      <TemplatePicker
        visible={showTemplates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplates(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    height: 40,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.purple + "15",
    borderWidth: 1,
    borderColor: Colors.purple + "30",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  templateBtnTxt: { color: Colors.purple, fontSize: Typography.xs, fontWeight: "600" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  pillText: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTextActive: { color: Colors.primary, fontWeight: "700" },
  list: { padding: Spacing.lg, paddingBottom: 32 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    flexShrink: 1,
  },
  templateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.purple + "18",
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.purple + "40",
  },
  templateBadgeTxt: { color: Colors.purple, fontSize: 9, fontWeight: "700" },
  globalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.info + "18",
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.info + "40",
  },
  globalBadgeTxt: { color: Colors.info, fontSize: 9, fontWeight: "700" },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  planGoal: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 3 },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  assignedText: { color: Colors.primary, fontSize: Typography.xs },
  statsRow: { flexDirection: "row", gap: Spacing.md, marginTop: 5 },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  statTxt: { color: Colors.textMuted, fontSize: 10 },
  cardRight: { alignItems: "flex-end", gap: Spacing.sm, flexShrink: 0 },
  actionBtns: { flexDirection: "row", gap: Spacing.md },
  emptyActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  emptyActionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyActionPrimaryTxt: { color: "#fff", fontWeight: "700", fontSize: Typography.sm },
  emptyActionSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.purple + "15",
    borderWidth: 1,
    borderColor: Colors.purple + "30",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyActionSecondaryTxt: { color: Colors.purple, fontWeight: "700", fontSize: Typography.sm },
});

// ── Template picker styles ─────────────────────────────────────────────────────

const tp = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 44,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  itemGoal: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 },
  itemMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  diffBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  diffTxt: { fontSize: 9, fontWeight: "700" },
  globalBadge: {
    backgroundColor: Colors.purple + "20",
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  globalTxt: { color: Colors.purple, fontSize: 9, fontWeight: "700" },
  skeleton: {
    height: 64,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
  },
  empty: { paddingVertical: 48, alignItems: "center", gap: Spacing.sm },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
});
