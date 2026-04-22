import { memberGymsApi } from "@/api/endpoints";
import { Avatar, Card, EmptyState, Header, SkeletonGroup } from "@/components";
import ImageCarousel from "@/components/ImageCarousel";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FlatList,
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface GymMembership {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | string;
  startDate: string;
  endDate: string | null;
  daysRemaining: number | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  membershipType: string | null;
  gym: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    contactNumber: string | null;
    whatsappNumber: string | null;
    logoUrl: string | null;
    gymImages: string[];
    services: string[];
    facilities: string[];
  } | null;
  membershipPlan: {
    name: string;
    price: number | string;
    durationMonths: number;
    description: string | null;
    features: string[];
  } | null;
  assignedTrainer: {
    fullName: string;
    avatarUrl: string | null;
    mobileNumber: string | null;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | string) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: Colors.successFaded, color: Colors.success,  label: "Active"    },
  EXPIRED:   { bg: Colors.errorFaded,   color: Colors.error,    label: "Expired"   },
  SUSPENDED: { bg: Colors.warningFaded, color: Colors.warning,  label: "Suspended" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: Colors.surfaceRaised,
    color: Colors.textMuted,
    label: status,
  };
  return (
    <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ── GymCard ───────────────────────────────────────────────────────────────────

function GymCard({ m }: { m: GymMembership }) {
  const gym     = m.gym;
  const plan    = m.membershipPlan;
  const trainer = m.assignedTrainer;
  const images  = gym?.gymImages ?? [];

  const address = [gym?.address, gym?.city, gym?.state, gym?.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={s.card}>
      {/* Image carousel */}
      {images.length > 0 && (
        <View style={s.carouselWrap}>
          <ImageCarousel images={images} height={180} />
        </View>
      )}

      {/* Gym info */}
      <View style={s.gymInfo}>
        <View style={s.gymLogoWrap}>
          <Icon name="office-building-outline" size={26} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.gymNameRow}>
            <Text style={s.gymName} numberOfLines={1}>{gym?.name ?? "Your Gym"}</Text>
            <StatusBadge status={m.status} />
          </View>
          {address.length > 0 && (
            <View style={s.metaRow}>
              <Icon name="map-marker-outline" size={13} color={Colors.textMuted} />
              <Text style={s.metaTxt} numberOfLines={2}>{address}</Text>
            </View>
          )}
          {gym?.contactNumber && (
            <View style={s.metaRow}>
              <Icon name="phone-outline" size={13} color={Colors.textMuted} />
              <Text style={s.metaTxt}>{gym.contactNumber}</Text>
            </View>
          )}
          {gym?.whatsappNumber && (
            <TouchableOpacity
              style={s.metaRow}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${gym.whatsappNumber!.replace(/\D/g, "")}`,
                )
              }
            >
              <Icon name="whatsapp" size={13} color="#4ade80" />
              <Text style={[s.metaTxt, { color: "#4ade80" }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Services */}
      {(gym?.services?.length ?? 0) > 0 && (
        <View style={s.tagsSection}>
          <Text style={s.tagsLabel}>Services</Text>
          <View style={s.tagsRow}>
            {gym!.services.map((sv) => (
              <View key={sv} style={[s.tag, s.tagPrimary]}>
                <Text style={[s.tagTxt, { color: Colors.primary }]}>{sv}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Facilities */}
      {(gym?.facilities?.length ?? 0) > 0 && (
        <View style={s.tagsSection}>
          <Text style={s.tagsLabel}>Facilities</Text>
          <View style={s.tagsRow}>
            {gym!.facilities.map((f) => (
              <View key={f} style={s.tag}>
                <Text style={s.tagTxt}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={s.divider} />

      {/* Membership + Trainer two-column section */}
      <View style={s.twoCol}>
        {/* Membership */}
        <View style={[s.colSection, { borderRightWidth: 1, borderRightColor: Colors.border }]}>
          <View style={s.colHeader}>
            <Icon name="credit-card-outline" size={14} color={Colors.primary} />
            <Text style={s.colTitle}>Membership</Text>
          </View>
          {plan ? (
            <>
              {[
                ["Plan",      plan.name],
                ["Duration",  `${plan.durationMonths} month${plan.durationMonths !== 1 ? "s" : ""}`],
                ["Price",     fmt(plan.price)],
                ["Start",     fmtDate(m.startDate)],
                ["Expires",   m.endDate ? fmtDate(m.endDate) : "No expiry"],
                ...(m.daysRemaining !== null && m.status === "ACTIVE"
                  ? [["Days left", m.daysRemaining === 0 ? "Expires today" : `${m.daysRemaining}d`]]
                  : []),
              ].map(([label, val]) => (
                <View key={label} style={s.detailRow}>
                  <Text style={s.detailLabel}>{label}</Text>
                  <Text style={s.detailVal} numberOfLines={1}>{val}</Text>
                </View>
              ))}
              {plan.description ? (
                <Text style={s.planDesc}>{plan.description}</Text>
              ) : null}
              {(plan.features?.length ?? 0) > 0 && (
                <View style={s.featuresWrap}>
                  {plan.features.map((f) => (
                    <View key={f} style={s.featureRow}>
                      <Icon name="check-circle-outline" size={12} color={Colors.primary} />
                      <Text style={s.featureTxt}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={s.noInfo}>No plan info</Text>
          )}
        </View>

        {/* Trainer + Stats */}
        <View style={s.colSection}>
          <View style={s.colHeader}>
            <Icon name="account-tie-outline" size={14} color={Colors.primary} />
            <Text style={s.colTitle}>Trainer</Text>
          </View>
          {trainer ? (
            <View style={s.trainerRow}>
              <Avatar
                name={trainer.fullName}
                url={trainer.avatarUrl}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.trainerName} numberOfLines={1}>{trainer.fullName}</Text>
                <Text style={s.trainerRole}>Personal Trainer</Text>
                {trainer.mobileNumber && (
                  <Text style={s.trainerPhone} numberOfLines={1}>
                    {trainer.mobileNumber}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={s.noTrainer}>
              <Icon name="account-tie-outline" size={22} color={Colors.border} />
              <Text style={s.noInfo}>No trainer assigned</Text>
            </View>
          )}

          {/* Stats */}
          <View style={s.statsGrid}>
            {[
              { val: m.totalCheckins, lbl: "Check-ins" },
              { val: m.currentStreak, lbl: "Streak" },
              { val: m.longestStreak, lbl: "Best" },
              ...(m.membershipType ? [{ val: m.membershipType, lbl: "Type" }] : []),
            ].map((st) => (
              <View key={st.lbl} style={s.statBox}>
                <Text style={s.statVal} numberOfLines={1}>{st.val ?? 0}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MemberGymsScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useQuery<{
    memberships: GymMembership[];
  }>({
    queryKey: ["memberGyms"],
    queryFn: memberGymsApi.list as () => Promise<{ memberships: GymMembership[] }>,
    staleTime: 2 * 60_000,
  });

  const memberships = data?.memberships ?? [];
  const active = memberships.filter((m) => m.status === "ACTIVE");
  const others = memberships.filter((m) => m.status !== "ACTIVE");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          title="My Gyms"
          menu
          subtitle={
            memberships.length > 0
              ? `${memberships.length} enrollment${memberships.length !== 1 ? "s" : ""}`
              : undefined
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="card" count={2} itemHeight={300} gap={Spacing.md} />
        </View>
      ) : memberships.length === 0 ? (
        <EmptyState
          icon="office-building-outline"
          title="No gym memberships yet"
          subtitle="Discover gyms near you and join to get started"
        />
      ) : (
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
          {active.length > 0 && (
            <View style={s.section}>
              {active.length > 1 && (
                <Text style={s.sectionLabel}>ACTIVE</Text>
              )}
              {active.map((m) => <GymCard key={m.id} m={m} />)}
            </View>
          )}

          {others.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>PAST ENROLLMENTS</Text>
              {others.map((m) => <GymCard key={m.id} m={m} />)}
            </View>
          )}

          {/* Discover CTA */}
          <TouchableOpacity
            style={s.discoverCta}
            onPress={() => navigation.navigate("MemberDiscover")}
            activeOpacity={0.8}
          >
            <Icon name="compass-outline" size={16} color={Colors.primary} />
            <Text style={s.discoverTxt}>Discover more gyms</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  scroll:     { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  section:    { gap: Spacing.md },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  carouselWrap: { borderRadius: 0 },

  // Gym info row
  gymInfo: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  gymLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  gymNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
    flex: 1,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusTxt: { fontSize: Typography.xs, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 3,
  },
  metaTxt: { color: Colors.textMuted, fontSize: Typography.xs, flex: 1 },

  // Tags
  tagsSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  tagsLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginBottom: 6,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagPrimary: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary + "30",
  },
  tagTxt: { color: Colors.textSecondary, fontSize: 11 },

  divider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.sm },

  // Two-column
  twoCol: { flexDirection: "row" },
  colSection: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  colTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },

  // Membership details
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { color: Colors.textMuted, fontSize: 10 },
  detailVal: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: "60%",
  },
  planDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  featuresWrap: { gap: 3, marginTop: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  featureTxt: { color: Colors.textMuted, fontSize: 10, flex: 1 },
  noInfo: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },

  // Trainer
  trainerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  trainerName: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  trainerRole: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  trainerPhone: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  noTrainer: {
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: 8,
    alignItems: "center",
  },
  statVal: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  statLbl: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },

  // Discover CTA
  discoverCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  discoverTxt: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
