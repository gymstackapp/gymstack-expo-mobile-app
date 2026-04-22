// mobile/src/screens/member/NotificationsScreen.tsx
import { memberNotificationsApi } from "@/api/endpoints";
import { EmptyState, Header, NoGymState, SkeletonGroup } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  gym?: { name: string } | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  pages: number;
  unreadCount: number;
}

type Filter =
  | "ALL"
  | "UNREAD"
  | "BILLING"
  | "ANNOUNCEMENT"
  | "PLAN_UPDATE"
  | "REFERRAL";

// ── Type config ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  BILLING: {
    icon: "credit-card-outline",
    color: "#f97316",
    bg: "#f9731618",
    label: "Payment",
  },
  CLASS_REMINDER: {
    icon: "clock-alert-outline",
    color: "#f59e0b",
    bg: "#f59e0b18",
    label: "Reminder",
  },
  PLAN_UPDATE: {
    icon: "dumbbell",
    color: "#3b82f6",
    bg: "#3b82f618",
    label: "Plan",
  },
  ANNOUNCEMENT: {
    icon: "bullhorn-outline",
    color: "#8b5cf6",
    bg: "#8b5cf618",
    label: "Announcement",
  },
  REFERRAL: {
    icon: "gift-outline",
    color: "#10b981",
    bg: "#10b98118",
    label: "Referral",
  },
  EXPIRY: {
    icon: "calendar-alert",
    color: "#ef4444",
    bg: "#ef444418",
    label: "Expiry",
  },
  SYSTEM: {
    icon: "bell-outline",
    color: "#6b7280",
    bg: "#6b728018",
    label: "System",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.SYSTEM;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: "ALL", label: "All", icon: "bell-outline" },
  { key: "UNREAD", label: "Unread", icon: "bell-badge-outline" },
  { key: "BILLING", label: "Payments", icon: "credit-card-outline" },
  { key: "ANNOUNCEMENT", label: "Announcements", icon: "bullhorn-outline" },
  { key: "PLAN_UPDATE", label: "Plans", icon: "dumbbell" },
  { key: "REFERRAL", label: "Referrals", icon: "gift-outline" },
];

// ── Notification row ───────────────────────────────────────────────────────────

const NotifRow = React.memo(function NotifRow({
  item,
  onPress,
  onMarkRead,
}: {
  item: Notification;
  onPress: () => void;
  onMarkRead: () => void;
}) {
  const cfg = getConfig(item.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.row, !item.isRead && styles.rowUnread]}
    >
      {/* Unread indicator */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Icon name={cfg.icon} size={20} color={cfg.color} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Top row: badge + gym + time */}
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          {item.gym?.name ? (
            <Text style={styles.gymName} numberOfLines={1}>
              • {item.gym.name}
            </Text>
          ) : null}
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>

        {/* Title */}
        <Text
          style={[styles.title, !item.isRead && styles.titleBold]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Message */}
        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>
      </View>

      {/* Mark read button (visible only when unread) */}
      {!item.isRead && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            onMarkRead();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.markBtn}
        >
          <Icon name="check-circle-outline" size={18} color={cfg.color} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

// ── Empty state per filter ─────────────────────────────────────────────────────

function FilterEmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, { icon: string; title: string; sub: string }> =
    {
      ALL: {
        icon: "bell-outline",
        title: "No notifications yet",
        sub: "Gym announcements, payments and updates will appear here",
      },
      UNREAD: {
        icon: "bell-check-outline",
        title: "All caught up!",
        sub: "No unread notifications",
      },
      BILLING: {
        icon: "credit-card-check",
        title: "No payment alerts",
        sub: "Payment confirmations will appear here",
      },
      ANNOUNCEMENT: {
        icon: "bullhorn-outline",
        title: "No announcements",
        sub: "Gym announcements will appear here",
      },
      PLAN_UPDATE: {
        icon: "dumbbell",
        title: "No plan updates",
        sub: "Workout and diet plan changes will appear here",
      },
      REFERRAL: {
        icon: "gift-outline",
        title: "No referral activity",
        sub: "Referral rewards and updates will appear here",
      },
    };
  const m = messages[filter];
  return <EmptyState icon={m.icon} title={m.title} subtitle={m.sub} />;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MemberNotificationsScreen() {
  const qc = useQueryClient();
  const [activeFilter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } =
    useQuery<NotificationsResponse>({
      queryKey: ["memberNotifications", page],
      queryFn: () =>
        memberNotificationsApi.list({ page }) as Promise<NotificationsResponse>,
      staleTime: 30_000,
    });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = data?.pages ?? 1;

  // Apply local filter
  const filtered = notifications.filter((n) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "UNREAD") return !n.isRead;
    return n.type === activeFilter;
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["memberNotifications"] });
    qc.invalidateQueries({ queryKey: ["unreadCount"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => memberNotificationsApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: () => memberNotificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  const handlePress = useCallback((item: Notification) => {
    if (!item.isRead) markReadMutation.mutate(item.id);
    // Additional navigation based on type could go here
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <NoGymState pageName="Notifications" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Header
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          menu
          right={
            unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markBtn}
                onPress={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                <Icon name="check-all" size={14} color={Colors.primary} />
                <Text style={styles.tabText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {/* Stats bar */}
      {!isLoading && !gymLoading && notifications.length > 0 && (
        <View style={styles.statsBar}>
          <StatItem
            value={notifications.length}
            label="Total"
            color={Colors.primary}
          />
          <View style={styles.statsDivider} />
          <StatItem
            value={unreadCount}
            label="Unread"
            color={unreadCount > 0 ? "#f59e0b" : "#10b981"}
          />
          <View style={styles.statsDivider} />
          <StatItem
            value={notifications.length - unreadCount}
            label="Read"
            color="#10b981"
          />
        </View>
      )}
      <View style={{ padding: Spacing.lg }}>
        {!isLoading && !gymLoading && notifications.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: Spacing.xs,
              paddingRight: Spacing.xs,
            }}
          >
            {FILTERS.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setFilter(cat.key)}
                style={[
                  styles.filterTab,
                  activeFilter === cat.key
                    ? styles.filterTabActive
                    : styles.filterTabInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color:
                        activeFilter === cat.key
                          ? Colors.primary
                          : Colors.textMuted,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* List */}
      {isLoading || gymLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="listRow" count={6} />
        </View>
      ) : filtered.length === 0 ? (
        <FilterEmptyState filter={activeFilter} />
      ) : (
        <FlatList<Notification>
          data={filtered}
          keyExtractor={(n) => n.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setPage(1);
                refetch();
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>Load more</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <NotifRow
              item={item}
              onPress={() => handlePress(item)}
              onMarkRead={() => markReadMutation.mutate(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── StatItem helper ────────────────────────────────────────────────────────────

function StatItem({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  // stats
  statsBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: Typography.xl, fontWeight: "800" },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: Colors.border },

  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },

  // rows
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    position: "relative",
  },
  rowUnread: { backgroundColor: Colors.primary + "08" },
  unreadDot: {
    position: "absolute",
    top: 20,
    left: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: { flex: 1, marginLeft: Spacing.md, gap: 3 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  gymName: { color: Colors.textMuted, fontSize: 10, flex: 1 },
  time: { color: Colors.textMuted, fontSize: 10, marginLeft: "auto" },
  title: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  titleBold: { color: Colors.textPrimary, fontWeight: "700" },
  message: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 18 },
  markBtn: { padding: 4, marginLeft: 4, alignSelf: "flex-start", marginTop: 2 },

  // footer
  separator: { height: 1, backgroundColor: Colors.border + "60" },
  loadMore: { alignItems: "center", padding: Spacing.lg },
  loadMoreText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
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
    fontSize: Typography.sm,
    fontWeight: "500",
  },
});
