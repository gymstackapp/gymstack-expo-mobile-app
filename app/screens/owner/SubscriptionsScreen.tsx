// app/screens/owner/SubscriptionsScreen.tsx
// Mobile version of the web subscriptions page.
// Matches the web implementation with mobile-specific adaptations.

import { Header } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Duration options ──────────────────────────────────────────────────────────
const DURATIONS = [
  { label: "3 mo", months: 3, interval: "QUARTERLY" },
  { label: "6 mo", months: 6, interval: "HALF_YEARLY" },
  { label: "12 mo", months: 12, interval: "YEARLY" },
] as const;
type DurationInterval = (typeof DURATIONS)[number]["interval"];

// ── Plan tier definitions ─────────────────────────────────────────────────────
interface PlanTier {
  key: string;
  name: string;
  description: string;
  gradient: string;
  ring: string;
  textAccent: string;
  badge?: string;
  badgeClass?: string;
  prices: Record<DurationInterval, number>;
  features: { icon: string; label: string }[];
}

const TIERS: PlanTier[] = [
  {
    key: "basic",
    name: "Basic",
    description: "Everything you need to run one gym",
    gradient: "from-blue-500/10 to-cyan-500/4",
    ring: "ring-blue-500/30",
    textAccent: "text-blue-400",
    prices: { QUARTERLY: 999, HALF_YEARLY: 1649, YEARLY: 2999 },
    features: [
      { icon: "office-building-outline", label: "1 Gym" },
      { icon: "account-group-outline", label: "Unlimited members" },
      { icon: "account-check-outline", label: "Unlimited trainers" },
      { icon: "calendar-check-outline", label: "Attendance tracking" },
      { icon: "clipboard-list-outline", label: "Membership plans" },
      { icon: "chart-bar", label: "Basic reports & analytics" },
      { icon: "bell-outline", label: "Unlimited Announcements" },
      { icon: "headphones", label: "Email support" },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Scale across multiple locations",
    gradient: "from-primary/12 to-orange-500/4",
    ring: "ring-primary/35",
    textAccent: "text-primary",
    badge: "Most Popular",
    badgeClass: "bg-primary text-white",
    prices: { QUARTERLY: 1499, HALF_YEARLY: 2499, YEARLY: 4499 },
    features: [
      { icon: "office-building-outline", label: "1 Gym" },
      { icon: "account-group-outline", label: "Unlimited members" },
      { icon: "account-check-outline", label: "Unlimited trainers" },
      { icon: "calendar-check-outline", label: "Attendance tracking" },
      { icon: "clipboard-list-outline", label: "Membership plans" },
      { icon: "lock-outline", label: "Locker management" },
      { icon: "credit-card-outline", label: "Payment management" },
      { icon: "currency-inr", label: "Expense management" },
      { icon: "dumbbell", label: "Workout plans" },
      { icon: "food-apple-outline", label: "Diet plans" },
      { icon: "chart-bar", label: "Full reports & analytics" },
      {
        icon: "bell-outline",
        label: "Unlimited Announcements & notifications",
      },
      { icon: "headphones", label: "Priority support" },
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For large chains with no limits",
    gradient: "from-purple-500/12 to-violet-500/4",
    ring: "ring-purple-500/30",
    textAccent: "text-purple-400",
    badge: "Unlimited Everything",
    badgeClass: "bg-purple-500 text-white",
    prices: { QUARTERLY: 2999, HALF_YEARLY: 4999, YEARLY: 8999 },
    features: [
      { icon: "office-building-outline", label: "Up to 5 gyms" },
      { icon: "account-group-outline", label: "Unlimited members" },
      { icon: "account-check-outline", label: "Unlimited trainers" },
      { icon: "calendar-check-outline", label: "Attendance tracking" },
      { icon: "clipboard-list-outline", label: "Membership plans" },
      { icon: "lock-outline", label: "Locker management" },
      { icon: "credit-card-outline", label: "Payment management" },
      { icon: "currency-inr", label: "Expense management" },
      { icon: "dumbbell", label: "Workout plans" },
      { icon: "food-apple-outline", label: "Diet plans" },
      { icon: "brain", label: "AI-powered workout/diet plans" },
      { icon: "shopping-outline", label: "Supplement management" },
      { icon: "chart-bar", label: "Full reports & analytics" },
      {
        icon: "bell-outline",
        label: "Unlimited Announcements & notifications",
      },
      { icon: "rocket-launch-outline", label: "Custom integrations" },
      { icon: "headphones", label: "Priority support" },
    ],
  },
];

// ── DB interfaces ─────────────────────────────────────────────────────────────
interface DbPlan {
  id: string;
  name: string;
  interval: string;
  price: number;
}
interface DbSubscription {
  id: string;
  status: string;
  saasPlan: DbPlan;
  currentPeriodEnd: string | null;
}

// ── Savings badge helper ──────────────────────────────────────────────────────
function savingsLabel(
  prices: PlanTier["prices"],
  interval: DurationInterval,
): string | null {
  const monthly3 = prices.QUARTERLY / 3;
  const perMonth =
    prices[interval] / DURATIONS.find((d) => d.interval === interval)!.months;
  if (interval === "QUARTERLY") return null;
  const pct = Math.round(((monthly3 - perMonth) / monthly3) * 100);
  return pct > 0 ? `Save ${pct}%` : null;
}

// ── Main screen ───────────────────────────────────────────────────────────────
const SubscriptionsScreen = () => {
  const sub = useSubscription();
  const qc = useQueryClient();

  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);
  const [dbSub, setDbSub] = useState<DbSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Per-tier duration selection (defaults to 6 months)
  const [durations, setDurations] = useState<Record<string, DurationInterval>>({
    basic: "HALF_YEARLY",
    pro: "HALF_YEARLY",
    enterprise: "HALF_YEARLY",
  });

  useEffect(() => {
    Promise.all([
      fetch("https://api.gymstack.in/api/subscriptions/plans").then((r) =>
        r.json(),
      ),
      fetch("https://api.gymstack.in/api/owner/subscription").then((r) =>
        r.json(),
      ),
    ])
      .then(([p, s]) => {
        setDbPlans(Array.isArray(p) ? p : []);
        setDbSub(s.subscription ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const findDbPlan = (
    tierKey: string,
    interval: DurationInterval,
  ): DbPlan | undefined =>
    dbPlans.find(
      (p) => p.name.toLowerCase().includes(tierKey) && p.interval === interval,
    );

  const activePlanKey = dbSub?.saasPlan?.name?.toLowerCase().trim() ?? null;
  const activeInterval = dbSub?.saasPlan?.interval ?? null;
  const isActiveSub =
    dbSub?.status === "ACTIVE" || dbSub?.status === "TRIALING";

  const isCurrent = (tier: PlanTier, interval: DurationInterval) =>
    isActiveSub &&
    activePlanKey?.includes(tier.key) &&
    activeInterval === interval;

  const purchase = async (tier: PlanTier, interval: DurationInterval) => {
    Alert.alert(
      "Subscribe on Web",
      "Visit the GymStack web app to complete your subscription with secure payment processing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Web App",
          onPress: () =>
            Linking.openURL("https://app.gymstack.in/subscriptions"),
        },
      ],
    );
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
          <View style={styles.top}>
            <Header
              menu
              title="Subscriptions & Plans"
              subtitle="Choose the right plan for your gym business"
            />
          </View>
          <View style={{ padding: Spacing.lg }}>
            <View
              style={{
                height: 120,
                backgroundColor: Colors.surface,
                borderRadius: Radius.xl,
                marginBottom: Spacing.lg,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginBottom: Spacing.lg,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 80,
                    backgroundColor: Colors.surface,
                    borderRadius: Radius.lg,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 400,
                    backgroundColor: Colors.surface,
                    borderRadius: Radius.xl,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
        <View style={styles.top}>
          <Header
            menu
            title="Subscriptions & Plans"
            subtitle="Choose the right plan for your gym business"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Current subscription banner ───────────────────────────────── */}
          {dbSub && (
            <View
              style={[
                styles.banner,
                sub.isExpired ? styles.bannerExpired : styles.bannerActive,
              ]}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerLeft}>
                  {sub.isExpired ? (
                    <Icon
                      name="alert-triangle"
                      size={16}
                      color={Colors.error}
                    />
                  ) : (
                    <Icon name="crown" size={16} color={Colors.primary} />
                  )}
                  <View>
                    <Text style={styles.bannerTitle}>
                      Current Plan: {dbSub?.saasPlan?.name}
                    </Text>
                    <Text style={styles.bannerSubtitle}>
                      <Text
                        style={
                          sub.isExpired
                            ? styles.bannerStatusExpired
                            : styles.bannerStatusActive
                        }
                      >
                        {dbSub?.status?.toLowerCase()}
                      </Text>
                      {dbSub.currentPeriodEnd && !sub.isExpired && (
                        <>
                          {" "}
                          · Renews{" "}
                          {new Date(dbSub.currentPeriodEnd).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </>
                      )}
                      {dbSub.currentPeriodEnd && sub.isExpired && (
                        <>
                          {" "}
                          · Expired{" "}
                          {new Date(dbSub.currentPeriodEnd).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </>
                      )}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    sub.isExpired
                      ? styles.statusBadgeExpired
                      : styles.statusBadgeActive,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {sub.isExpired ? "Expired" : "Active"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Usage summary ─────────────────────────────────────────────── */}
          {!sub.isExpired && sub.usage && sub.limits && (
            <View style={styles.usageGrid}>
              {[
                {
                  label: "Gyms",
                  used: sub.usage.gyms,
                  max: sub.limits.maxGyms,
                },
                {
                  label: "Members",
                  used: sub.usage.members,
                  max: sub.limits.maxMembers,
                },
                {
                  label: "Trainers",
                  used: sub.usage.trainers,
                  max: sub.limits.maxTrainers,
                },
                {
                  label: "Membership Plans",
                  used: sub.usage.membershipPlans,
                  max: sub.limits.maxMembershipPlans,
                },
              ].map(({ label, used, max }) => {
                const pct =
                  max !== null
                    ? Math.min(100, Math.round((used / max) * 100))
                    : null;
                const isUnlimited = max === null;
                const isHigh = pct !== null && pct >= 90;
                return (
                  <View key={label} style={styles.usageCard}>
                    <View style={styles.usageHeader}>
                      <Text style={styles.usageLabel}>{label}</Text>
                      {isUnlimited ? (
                        <Icon name="infinity" size={14} color="#eab308" />
                      ) : (
                        <Text
                          style={[
                            styles.usageCount,
                            isHigh && styles.usageCountHigh,
                          ]}
                        >
                          {used}/{max}
                        </Text>
                      )}
                    </View>
                    {!isUnlimited && (
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${pct!}%` },
                            isHigh && styles.progressFillHigh,
                          ]}
                        />
                      </View>
                    )}
                    {isUnlimited && (
                      <Text style={styles.unlimitedText}>Unlimited</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Free plan banner ──────────────────────────────────────────── */}
          {(() => {
            const freeIsActive = isActiveSub && activePlanKey?.includes("free");
            const freeBuying = purchasing === "free";
            const freeDbPlan = dbPlans.find((p) =>
              p.name.toLowerCase().includes("free"),
            );
            return (
              <View
                style={[
                  styles.freeBanner,
                  freeIsActive && styles.freeBannerActive,
                ]}
              >
                <View style={styles.freeBannerContent}>
                  <View style={styles.freeBannerLeft}>
                    <View style={styles.freeIcon}>
                      <Icon
                        name="star-outline"
                        size={20}
                        color={Colors.textMuted}
                      />
                    </View>
                    <View>
                      <View style={styles.freeHeader}>
                        <Text style={styles.freeTitle}>Free Plan</Text>
                        <Text style={styles.freeTrialBadge}>1 month</Text>
                        {freeIsActive && (
                          <Text style={styles.freeActiveBadge}>✓ Active</Text>
                        )}
                      </View>
                      <Text style={styles.freeSubtitle}>
                        1 gym · Unlimited members & trainers · Attendance ·
                        Reports · Announcements
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.freeButton,
                      freeIsActive && styles.freeButtonDisabled,
                    ]}
                    onPress={() => {
                      if (freeIsActive || freeBuying || !freeDbPlan) return;
                      setPurchasing("free");
                      fetch(
                        "https://api.gymstack.in/api/subscriptions/subscribe",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            saasPlanId: freeDbPlan.id,
                            amount: 0,
                          }),
                        },
                      )
                        .then((r) => {
                          if (r.ok) {
                            Toast.show({
                              type: "success",
                              text1: "Free plan activated!",
                            });
                            qc.invalidateQueries({
                              queryKey: ["ownerSubscription"],
                            });
                          } else {
                            Toast.show({
                              type: "error",
                              text1: "Failed to activate free plan",
                            });
                          }
                        })
                        .finally(() => setPurchasing(null));
                    }}
                    disabled={freeIsActive || freeBuying || !freeDbPlan}
                  >
                    {freeBuying ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : freeIsActive ? (
                      <Text style={styles.freeButtonTextDisabled}>
                        Current Plan
                      </Text>
                    ) : (
                      <Text style={styles.freeButtonText}>
                        Get Started Free
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* ── Paid plan cards ───────────────────────────────────────────── */}
          <View style={styles.plansGrid}>
            {TIERS.map((tier) => {
              const selectedInterval = durations[tier.key];
              const price = tier.prices[selectedInterval];
              const selectedDuration = DURATIONS.find(
                (d) => d.interval === selectedInterval,
              )!;
              const current = isCurrent(tier, selectedInterval);
              const anyTierCurrent =
                isActiveSub && activePlanKey?.includes(tier.key);
              const purchaseKey = `${tier.key}-${selectedInterval}`;
              const isBuying = purchasing === purchaseKey;
              const isPopular = tier.key === "pro";

              return (
                <View
                  key={tier.key}
                  style={[
                    styles.planCard,
                    current && styles.planCardCurrent,
                    anyTierCurrent && !current && styles.planCardAnyCurrent,
                  ]}
                >
                  {/* Top badge — centered */}
                  {(tier.badge || current) && (
                    <View style={styles.planBadge}>
                      {current ? (
                        <Text style={styles.currentBadgeText}>
                          ✓ Current Plan
                        </Text>
                      ) : (
                        <Text
                          style={[
                            styles.badgeText,
                            tier.key === "enterprise" && styles.badgeTextPurple,
                          ]}
                        >
                          {tier.badge}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.planContent}>
                    {/* Plan name + description */}
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>{tier.name}</Text>
                      <Text style={styles.planDescription}>
                        {tier.description}
                      </Text>
                    </View>

                    {/* Duration picker */}
                    <View style={styles.durationPicker}>
                      {DURATIONS.map((d) => {
                        const isSelected = d.interval === selectedInterval;
                        const sav = savingsLabel(tier.prices, d.interval);
                        return (
                          <TouchableOpacity
                            key={d.interval}
                            onPress={() =>
                              setDurations((prev) => ({
                                ...prev,
                                [tier.key]: d.interval,
                              }))
                            }
                            style={[
                              styles.durationButton,
                              isSelected && styles.durationButtonSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.durationLabel,
                                isSelected && styles.durationLabelSelected,
                              ]}
                            >
                              {d.label}
                            </Text>
                            {sav && (
                              <Text
                                style={[
                                  styles.savingsBadge,
                                  isSelected && styles.savingsBadgeSelected,
                                ]}
                              >
                                {sav}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Price */}
                    <View style={styles.priceSection}>
                      <Text style={styles.priceText}>
                        ₹{price.toLocaleString("en-IN")}
                      </Text>
                      <Text style={styles.pricePeriod}>
                        / {selectedDuration.months} mo
                      </Text>
                    </View>

                    {/* Per-month breakdown */}
                    <Text style={styles.priceBreakdown}>
                      ≈ ₹
                      {Math.round(
                        price / selectedDuration.months,
                      ).toLocaleString("en-IN")}{" "}
                      / month
                    </Text>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Features */}
                    <View style={styles.featuresList}>
                      {tier.features.map((f, fi) => (
                        <View key={fi} style={styles.featureRow}>
                          <Icon
                            name={f.icon}
                            size={14}
                            color={
                              tier.key === "basic"
                                ? Colors.info
                                : tier.key === "pro"
                                  ? Colors.primary
                                  : Colors.purple
                            }
                          />
                          <Text style={styles.featureText}>{f.label}</Text>
                        </View>
                      ))}
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                      style={[
                        styles.ctaButton,
                        current && styles.ctaButtonCurrent,
                        isPopular && styles.ctaButtonPopular,
                        tier.key === "enterprise" && styles.ctaButtonEnterprise,
                      ]}
                      onPress={() =>
                        !current &&
                        !isBuying &&
                        purchase(tier, selectedInterval)
                      }
                      disabled={current || isBuying}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : current ? (
                        <Text style={styles.ctaButtonTextCurrent}>
                          Current Plan
                        </Text>
                      ) : (
                        <>
                          <Icon
                            name="credit-card-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.ctaButtonText}>
                            Subscribe — ₹{price.toLocaleString("en-IN")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Trust badges ─────────────────────────────────────────────── */}
          <View style={styles.trustGrid}>
            {[
              {
                icon: "shield-check-outline",
                text: "Secure Payments",
                sub: "Powered by Razorpay",
              },
              {
                icon: "clock-outline",
                text: "Instant Activation",
                sub: "No waiting period",
              },
              {
                icon: "check-circle-outline",
                text: "Easy Upgrade",
                sub: "Switch anytime",
              },
              { icon: "infinity", text: "No Lock-in", sub: "Cancel any time" },
            ].map((b) => (
              <View key={b.text} style={styles.trustCard}>
                <Icon name={b.icon} size={16} color={Colors.primary} />
                <View>
                  <Text style={styles.trustTitle}>{b.text}</Text>
                  <Text style={styles.trustSub}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: { backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingVertical: 40 },

  // Current subscription banner
  banner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bannerActive: {
    backgroundColor: Colors.primary + "15",
    borderWidth: 1,
    borderColor: Colors.primary + "25",
  },
  bannerExpired: {
    backgroundColor: Colors.error + "15",
    borderWidth: 1,
    borderColor: Colors.error + "25",
  },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  bannerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  bannerSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  bannerStatusActive: { color: Colors.primary, fontWeight: "700" },
  bannerStatusExpired: { color: Colors.error, fontWeight: "700" },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusBadgeActive: { backgroundColor: Colors.primary + "20" },
  statusBadgeExpired: { backgroundColor: Colors.error + "20" },
  statusBadgeText: {
    fontSize: Typography.xs,
    fontWeight: "700",
    textAlign: "center",
  },

  // Usage summary
  usageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  usageCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  usageLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  usageCount: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  usageCountHigh: { color: Colors.error },
  progressBar: {
    height: 3,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressFillHigh: { backgroundColor: Colors.error },
  unlimitedText: {
    color: "#eab308",
    fontSize: Typography.xs,
    textAlign: "center",
    marginTop: Spacing.xs,
  },

  // Free plan banner
  freeBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  freeBannerActive: {
    borderColor: Colors.success + "40",
    backgroundColor: Colors.success + "10",
  },
  freeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  freeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  freeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  freeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  freeTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  freeTrialBadge: {
    backgroundColor: Colors.surfaceRaised,
    color: Colors.textMuted,
    fontSize: Typography.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  freeActiveBadge: {
    backgroundColor: Colors.success + "20",
    color: Colors.success,
    fontSize: Typography.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    fontWeight: "700",
  },
  freeSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  freeButton: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  freeButtonDisabled: {
    backgroundColor: Colors.surfaceRaised,
    opacity: 0.5,
  },
  freeButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  freeButtonTextDisabled: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "700",
  },

  // Plan cards
  plansGrid: {
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  planCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
  },
  planCardCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  planCardAnyCurrent: {
    borderColor: Colors.border,
  },
  planBadge: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    zIndex: 100,
  },
  currentBadgeText: {
    backgroundColor: Colors.success,
    color: "#fff",
    fontSize: Typography.xs,
    fontWeight: "700",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    backgroundColor: Colors.primary,
    color: "#fff",
    fontSize: Typography.sm,
    fontWeight: "700",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  badgeTextPurple: {
    backgroundColor: Colors.purple,
  },
  planContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  planHeader: { gap: Spacing.xs },
  planName: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
  },
  planDescription: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  durationPicker: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xxl,
    padding: 4,
    gap: 2,
  },
  durationButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xxl,
  },
  durationButtonSelected: {
    backgroundColor: Colors.primary,
  },
  durationLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  durationLabelSelected: { color: "#fff" },
  savingsBadge: {
    color: "#10b981",
    fontSize: Typography.xs,
    fontWeight: "700",
    marginTop: 2,
  },
  savingsBadgeSelected: { color: "#fff" },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  priceText: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: "800",
  },
  pricePeriod: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  priceBreakdown: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: -Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  featuresList: { gap: Spacing.sm },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    flex: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  ctaButtonCurrent: {
    backgroundColor: Colors.surfaceRaised,
  },
  ctaButtonPopular: {
    backgroundColor: Colors.primary,
  },
  ctaButtonEnterprise: {
    backgroundColor: Colors.purple,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  ctaButtonTextCurrent: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "700",
  },

  // Trust badges
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  trustCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  trustTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  trustSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
});

export default SubscriptionsScreen;
