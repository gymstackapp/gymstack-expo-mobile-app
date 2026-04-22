// mobile/src/screens/member/AnnouncementsScreen.tsx
// Gym announcements feed — shows all announcements from member's gyms.
// Announcements are posted by gym owners. They appear with gym branding,
// author info, and expiry dates.
import { memberAnnouncementsApi } from "@/api/endpoints";
import { Avatar, Card, EmptyState, NoGymState, SkeletonGroup } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 3 * 86_400_000; // expires within 3 days
}

function AnnouncementCard({ item }: { item: any }) {
  const expiring = isExpiringSoon(item.expiresAt);

  return (
    <Card>
      {/* Gym header */}
      <View style={s.gymRow}>
        <View style={s.gymIcon}>
          <Icon
            name="office-building-outline"
            size={16}
            color={Colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.gymName}>{item.gym?.name ?? "Your Gym"}</Text>
          <Text style={s.postedAt}>{timeAgo(item.publishedAt)}</Text>
        </View>
        {expiring && (
          <View style={s.expiringBadge}>
            <Icon name="clock-outline" size={11} color={Colors.warning} />
            <Text style={s.expiringTxt}>Expires soon</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={s.announcementTitle}>{item.title}</Text>
      <Text style={s.announcementBody}>{item.body}</Text>

      {/* Footer — author */}
      {item.author && (
        <View style={s.authorRow}>
          <Avatar
            name={item.author.fullName ?? "G"}
            url={item.author.avatarUrl}
            size={20}
          />
          <Text style={s.authorName}>Posted by {item.author.fullName}</Text>
        </View>
      )}

      {/* Expiry */}
      {item.expiresAt && (
        <Text style={s.expiresAt}>
          Valid until{" "}
          {new Date(item.expiresAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      )}
    </Card>
  );
}

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery<{
    announcements: any[];
    total: number;
  }>({
    queryKey: ["memberAnnouncements"],
    queryFn: () => memberAnnouncementsApi.list() as Promise<any>,
    staleTime: 2 * 60_000,
  });

  const announcements = data?.announcements ?? [];

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Announcements" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.screenTitle}>Announcements</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          {announcements.length > 0 && (
            <Text style={s.screenSub}>{data?.total ?? 0} total</Text>
          )}
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading || gymLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="listRow" count={4} />
        </View>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon="bullhorn-outline"
          title="No announcements yet"
          subtitle="Your gym will post updates, offers and news here"
        />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(a) => a.id}
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
          renderItem={({ item }) => <AnnouncementCard item={item} />}
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
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: "800",
  },
  screenSub: { color: Colors.textMuted, fontSize: Typography.sm },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gymIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  postedAt: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  expiringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  expiringTxt: { color: Colors.warning, fontSize: 10, fontWeight: "700" },
  announcementTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  announcementBody: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  authorName: { color: Colors.textMuted, fontSize: Typography.xs },
  expiresAt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
});
