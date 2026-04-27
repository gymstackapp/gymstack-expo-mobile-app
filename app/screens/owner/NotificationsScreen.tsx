// mobile/src/screens/owner/NotificationsScreen.tsx
import { gymsApi, notificationsApi } from "@/api/endpoints";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  SkeletonGroup,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { Gym } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
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

const CATEGORIES = [
  "General",
  "Reminder",
  "Offer",
  "Holiday",
  "Diet Plan",
  "Workout Plan",
  "Payment",
];

const CAT_EMOJI: Record<string, string> = {
  General: "📢",
  Reminder: "⏰",
  Offer: "🎁",
  Holiday: "🏖️",
  "Diet Plan": "🍎",
  "Workout Plan": "💪",
  Payment: "💳",
};

type BadgeStyle = { bg: string; text: string };

const CAT_BADGE: Record<string, BadgeStyle> = {
  General: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  Reminder: { bg: Colors.warningFaded, text: Colors.warning },
  Offer: { bg: Colors.successFaded, text: Colors.success },
  Holiday: { bg: Colors.purpleFaded, text: Colors.purple },
  "Diet Plan": { bg: Colors.primaryFaded, text: Colors.primary },
  "Workout Plan": { bg: "rgba(6,182,212,0.15)", text: "#22d3ee" },
  Payment: { bg: "rgba(236,72,153,0.15)", text: "#f472b6" },
};

const ROLE_BADGE: Record<string, BadgeStyle> = {
  MEMBER: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  TRAINER: { bg: Colors.purpleFaded, text: Colors.purple },
  OWNER: { bg: Colors.primaryFaded, text: Colors.primary },
};

const TARGET_ROLES = [
  { label: "Everyone", value: "" },
  { label: "Members only", value: "MEMBER" },
  { label: "Trainers only", value: "TRAINER" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCategory(body: string): string {
  const match = body.match(/^\[(.+?)\]/);
  return match ? match[1] : "General";
}

function parseBody(body: string): string {
  return body.replace(/^\[.+?\] /, "");
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OwnerNotificationsScreen() {
  const qc = useQueryClient();
  const { canSendNotification, usage, limits } = useSubscription();

  const [gymId, setGymId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    gymId: "",
    title: "",
    body: "",
    targetRole: "",
    category: "General",
    expiresAt: "",
  });

  // Reset page when gym or filter changes
  useEffect(() => {
    setPage(1);
  }, [gymId, activeFilter]);

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: notifData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<{ announcements: any[]; total: number; pages: number }>({
    queryKey: ["ownerNotifications", gymId, page],
    queryFn: () =>
      notificationsApi.list({ gymId: gymId || undefined, page }) as Promise<{
        announcements: any[];
        total: number;
        pages: number;
      }>,
    staleTime: 60_000,
  });

  const announcements = notifData?.announcements ?? [];
  const totalPages = notifData?.pages ?? 1;

  const sendMutation = useMutation({
    mutationFn: () =>
      notificationsApi.send({
        gymId: form.gymId || gymId || (gyms as Gym[])[0]?.id,
        title: form.title,
        body: `[${form.category}] ${form.body}`,
        targetRole: form.targetRole || undefined,
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      setShowAdd(false);
      setForm((f) => ({
        ...f,
        title: "",
        body: "",
        targetRole: "",
        category: "General",
        expiresAt: "",
      }));
      Toast.show({
        type: "success",
        text1: `Sent to ${data.recipientCount ?? 0} recipients`,
      });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      Toast.show({ type: "success", text1: "Deleted" });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const monthlyLeft =
    limits?.maxNotificationsPerMonth != null
      ? limits.maxNotificationsPerMonth - (usage?.notificationsThisMonth ?? 0)
      : null;

  // Filter list by category + gym + search
  const filtered = (announcements as any[]).filter((item) => {
    const cat = parseCategory(item.body);
    const matchCat = activeFilter === "All" || cat === activeFilter;
    const matchGym = !gymId || item.gym?.id === gymId;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchGym && matchSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* ── Top section ── */}
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <Header
          title="Notifications"
          subtitle={
            monthlyLeft !== null
              ? `${monthlyLeft} remaining this month`
              : undefined
          }
          menu
          right={
            canSendNotification ? (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="send-outline" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.limitBadge}
                onPress={() =>
                  Toast.show({
                    type: "error",
                    text1: "Notification limit reached. Upgrade your plan.",
                  })
                }
              >
                <Text style={styles.limitBadgeText}>Limit reached</Text>
              </TouchableOpacity>
            )
          }
        />

        {/* Gym filter pills (only when multiple gyms) */}
        {(gyms as Gym[]).length > 1 && (
          <View
            style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}
          >
            {[{ id: "", name: "All" }, ...(gyms as Gym[])].map((g) => (
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
                    {
                      color: gymId === g.id ? Colors.primary : Colors.textMuted,
                    },
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search box */}
        <View style={styles.searchBox}>
          <Icon name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: Spacing.xs,
            paddingRight: Spacing.xs,
            marginBottom: Spacing.md,
          }}
        >
          {["All", ...CATEGORIES].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveFilter(cat)}
              style={[
                styles.filterTab,
                activeFilter === cat
                  ? styles.filterTabActive
                  : styles.filterTabInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === cat
                        ? Colors.textPrimary
                        : Colors.textMuted,
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={4} itemHeight={70} gap={Spacing.sm} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title={
            activeFilter === "All"
              ? "No notifications sent"
              : `No ${activeFilter} notifications`
          }
          subtitle={
            activeFilter === "All"
              ? "Send your first announcement to members"
              : "Try a different category"
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
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
          renderItem={({ item: a }) => {
            const cat = parseCategory(a.body);
            const bodyText = parseBody(a.body);
            const emoji = CAT_EMOJI[cat] ?? "📢";
            const catStyle = CAT_BADGE[cat] ?? {
              bg: Colors.surfaceRaised,
              text: Colors.textMuted,
            };
            const roleStyle = a.targetRole ? ROLE_BADGE[a.targetRole] : null;
            return (
              <Card>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: Spacing.md,
                  }}
                >
                  {/* Emoji icon */}
                  <View style={styles.emojiIcon}>
                    <Text style={{ fontSize: 16 }}>{emoji}</Text>
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    {/* Title + badges */}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <Text style={styles.itemTitle}>{a.title}</Text>
                      <View
                        style={[styles.badge, { backgroundColor: catStyle.bg }]}
                      >
                        <Text
                          style={[styles.badgeText, { color: catStyle.text }]}
                        >
                          {cat}
                        </Text>
                      </View>
                      {a.gym?.name && (
                        <View style={styles.badgeGray}>
                          <Text style={styles.badgeGrayText}>{a.gym.name}</Text>
                        </View>
                      )}
                      {roleStyle && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: roleStyle.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: roleStyle.text },
                            ]}
                          >
                            {a.targetRole.toLowerCase()}s
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.itemBody} numberOfLines={2}>
                      {bodyText}
                    </Text>

                    <Text style={styles.itemMeta}>
                      {new Date(a.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {a.expiresAt
                        ? ` · Expires ${new Date(a.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : ""}
                    </Text>
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() =>
                      showAlert("Delete", "Delete this announcement?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteMutation.mutate(a.id),
                        },
                      ])
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="trash-can-outline"
                      size={16}
                      color={Colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
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

      {/* ── Send Notification Modal ── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={{
              padding: Spacing.lg,
              paddingBottom: 40,
              gap: Spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Notification</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Gym selector (multi-gym only) */}
            {(gyms as Gym[]).length > 1 && (
              <View>
                <Text style={styles.fieldLabel}>Gym *</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.xs,
                  }}
                >
                  {(gyms as Gym[]).map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => set("gymId", g.id)}
                      style={[
                        styles.pill,
                        form.gymId === g.id
                          ? styles.pillActive
                          : styles.pillInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              form.gymId === g.id
                                ? Colors.primary
                                : Colors.textMuted,
                          },
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Category selector */}
            <View>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: Spacing.xs,
                  paddingRight: Spacing.xs,
                }}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => set("category", cat)}
                    style={[
                      styles.pill,
                      form.category === cat
                        ? styles.pillActive
                        : styles.pillInactive,
                    ]}
                  >
                    <Text style={{ fontSize: 13, marginRight: 4 }}>
                      {CAT_EMOJI[cat]}
                    </Text>
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color:
                            form.category === cat
                              ? Colors.primary
                              : Colors.textMuted,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Input
              label="Title *"
              value={form.title}
              onChangeText={(v) => set("title", v)}
              placeholder="e.g. Gym closed on Sunday"
            />

            <Input
              label="Message *"
              value={form.body}
              onChangeText={(v) => set("body", v)}
              placeholder="Write your notification message here..."
              multiline
              numberOfLines={4}
            />

            {/* Target audience */}
            <View>
              <Text style={styles.fieldLabel}>Send To</Text>
              <View style={{ gap: Spacing.xs }}>
                {TARGET_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => set("targetRole", r.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      paddingVertical: Spacing.sm,
                    }}
                  >
                    <Icon
                      name={
                        form.targetRole === r.value
                          ? "radiobox-marked"
                          : "radiobox-blank"
                      }
                      size={20}
                      color={
                        form.targetRole === r.value
                          ? Colors.primary
                          : Colors.textMuted
                      }
                    />
                    <Text
                      style={{
                        color: Colors.textPrimary,
                        fontSize: Typography.sm,
                      }}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              label="Send Notification"
              onPress={() => {
                if (!form.title.trim() || !form.body.trim()) {
                  Toast.show({
                    type: "error",
                    text1: "Title and message required",
                  });
                  return;
                }
                sendMutation.mutate();
              }}
              loading={sendMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  limitBadge: {
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  limitBadgeText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
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
  pillText: {
    fontSize: Typography.xs,
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
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.lg,
  },
  filterTabActive: {
    backgroundColor: Colors.surfaceRaised,
  },
  filterTabInactive: {
    backgroundColor: "transparent",
  },
  filterTabText: {
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  emojiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  itemBody: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  itemMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  badgeGray: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
  },
  badgeGrayText: {
    fontSize: 10,
    color: Colors.textMuted,
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 8,
  },
});
