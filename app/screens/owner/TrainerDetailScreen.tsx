// mobile/src/screens/owner/TrainerDetailScreen.tsx
import { trainersApi } from "@/api/endpoints";
import { Avatar, Card, Header, ListRow, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrainerDetail {
  id: string;
  experienceYears: number;
  specializations: string[];
  certifications: string[];
  bio: string | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  profile: {
    fullName: string;
    email: string;
    mobileNumber: string | null;
    avatarUrl: string | null;
  };
  gym: { id: string; name: string };
  assignedMembers: {
    id: string;
    profile: { fullName: string; avatarUrl: string | null };
  }[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OwnerTrainerDetailScreen() {
  const route = useRoute();
  const qc = useQueryClient();
  const { trainerId } = route.params as { trainerId: string };

  const [tab, setTab] = useState<"info" | "members">("info");

  const { data, isLoading, refetch, isRefetching } = useQuery<TrainerDetail>({
    queryKey: ["ownerTrainer", trainerId],
    queryFn: () => trainersApi.get(trainerId) as Promise<TrainerDetail>,
    enabled: !!trainerId,
  });

  const toggleAvailMutation = useMutation({
    mutationFn: () =>
      trainersApi.update(trainerId, { isAvailable: !data?.isAvailable }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerTrainer", trainerId] });
      qc.invalidateQueries({ queryKey: ["ownerTrainers"] });
      Toast.show({ type: "success", text1: "Availability updated" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to update" }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Trainer" back />
          <Skeleton height={120} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

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
        <Header title="Trainer Details" back />

        {/* ── Profile card ── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar
              name={data.profile.fullName}
              url={data.profile.avatarUrl}
              size={60}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.trainerName}>{data.profile.fullName}</Text>
              <Text style={styles.trainerGym}>{data.gym.name}</Text>
              {data.profile.mobileNumber ? (
                <Text style={styles.trainerPhone}>
                  {data.profile.mobileNumber}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.availBadge,
                data.isAvailable ? styles.availOn : styles.availOff,
              ]}
            >
              <Text
                style={[
                  styles.availText,
                  {
                    color: data.isAvailable ? Colors.success : Colors.textMuted,
                  },
                ]}
              >
                {data.isAvailable ? "Available" : "Busy"}
              </Text>
            </View>
          </View>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rating</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  marginTop: 2,
                }}
              >
                <Icon name="star" size={12} color={Colors.warning} />
                <Text style={styles.statValue}>
                  {Number(data.rating).toFixed(1)}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Members</Text>
              <Text style={styles.statValue}>
                {data.assignedMembers?.length ?? 0}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Experience</Text>
              <Text style={styles.statValue}>{data.experienceYears}y</Text>
            </View>
          </View>
        </Card>

        {/* ── Availability toggle ── */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            data.isAvailable ? styles.actionBtnBusy : styles.actionBtnAvail,
          ]}
          onPress={() => toggleAvailMutation.mutate()}
          disabled={toggleAvailMutation.isPending}
        >
          <Icon
            name={
              data.isAvailable
                ? "account-clock-outline"
                : "account-check-outline"
            }
            size={16}
            color={data.isAvailable ? Colors.warning : Colors.success}
          />
          <Text
            style={[
              styles.actionText,
              { color: data.isAvailable ? Colors.warning : Colors.success },
            ]}
          >
            {data.isAvailable ? "Mark as Busy" : "Mark as Available"}
          </Text>
        </TouchableOpacity>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          {(
            [
              { key: "info", label: "Info" },
              {
                key: "members",
                label: `Members (${data.assignedMembers?.length ?? 0})`,
              },
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
        </View>

        {/* ── Info tab ── */}
        {tab === "info" && (
          <>
            <Card>
              <ListRow
                icon="email-outline"
                label="Email"
                value={data.profile.email}
                bordered
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
              />
              {data.profile.mobileNumber && (
                <ListRow
                  icon="phone-outline"
                  label="Phone"
                  value={data.profile.mobileNumber}
                  bordered
                  iconColor={Colors.success}
                  iconBg={Colors.successFaded}
                />
              )}
              <ListRow
                icon="briefcase-outline"
                label="Experience"
                value={`${data.experienceYears} year${data.experienceYears !== 1 ? "s" : ""}`}
                iconColor={Colors.primary}
                iconBg={Colors.primaryFaded}
              />
            </Card>

            {/* Bio */}
            <Card>
              <View style={styles.sectionHeader}>
                <Icon name="text-account" size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Bio</Text>
              </View>
              <Text style={styles.bioText}>{data.bio || "No bio added"}</Text>
            </Card>

            {/* Specializations */}
            <Card>
              <View style={styles.sectionHeader}>
                <Icon
                  name="arm-flex-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Specializations</Text>
              </View>
              {data.specializations.length > 0 ? (
                <View style={styles.specGrid}>
                  {data.specializations.map((s) => (
                    <View key={s} style={styles.specPill}>
                      <Text style={styles.specPillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No specializations added</Text>
              )}
            </Card>

            {/* Certifications */}
            <Card>
              <View style={styles.sectionHeader}>
                <Icon
                  name="certificate-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Certifications</Text>
              </View>
              {data.certifications.length > 0 ? (
                <View style={styles.specGrid}>
                  {data.certifications.map((c) => (
                    <View key={c} style={styles.certPill}>
                      <Text style={styles.certPillText}>{c}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No certifications added</Text>
              )}
            </Card>
          </>
        )}

        {/* ── Members tab ── */}
        {tab === "members" && (
          <View style={{ gap: Spacing.sm }}>
            {(data.assignedMembers?.length ?? 0) === 0 ? (
              <View style={styles.emptyTab}>
                <Icon
                  name="account-multiple-outline"
                  size={28}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTabText}>No members assigned</Text>
              </View>
            ) : (
              data.assignedMembers.map((m) => (
                <Card key={m.id} style={styles.memberRow}>
                  <Avatar
                    name={m.profile.fullName}
                    url={m.profile.avatarUrl}
                    size={36}
                  />
                  <Text style={styles.memberName}>{m.profile.fullName}</Text>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },

  profileCard: {},
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  trainerName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  trainerGym: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  trainerPhone: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 1,
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  availOn: { backgroundColor: Colors.successFaded },
  availOff: { backgroundColor: Colors.surfaceRaised },
  availText: { fontSize: Typography.xs, fontWeight: "600" },

  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 2,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
  },
  actionBtnBusy: {
    backgroundColor: Colors.warningFaded,
    borderColor: Colors.warning + "40",
  },
  actionBtnAvail: {
    backgroundColor: Colors.successFaded,
    borderColor: Colors.success + "40",
  },
  actionText: { fontSize: Typography.sm, fontWeight: "600" },

  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 11, fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  bioText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specPill: {
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  specPillText: { color: Colors.primary, fontSize: 12, fontWeight: "500" },
  certPill: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  certPillText: { color: Colors.textSecondary, fontSize: 12 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  emptyTab: {
    alignItems: "center",
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTabText: { color: Colors.textMuted, fontSize: Typography.sm },
});
