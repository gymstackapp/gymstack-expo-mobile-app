// app/screens/owner/BillingScreen.tsx
// Owner billing & subscription management screen.
// Plans: Free | Basic | Pro | Enterprise
// Prices: Basic(999/1799/2999), Pro(1999/3499/5999), Enterprise(3999/6999/11999)
// Paid plans: show "Subscribe on web app" note (Razorpay is web-only on mobile).

import { subscriptionApi } from "@/api/endpoints";
import { Header } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";

// ── Types ─────────────────────────────────────────────────────────────────────

type Interval = "3mo" | "6mo" | "12mo";

interface PlanDef {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon: string;
  popular?: boolean;
  isFree?: boolean;
  freeLabel?: string;
  intervals?: { interval: Interval; label: string; price: number }[];
  features: string[];
}

// ── Plan definitions ───────────────────────────────────────────────────────────

const PLANS: PlanDef[] = [
  {
    key: "free",
    label: "Free",
    color: Colors.success,
    bg: Colors.successFaded,
    icon: "gift-outline",
    isFree: true,
    freeLabel: "₹0 · 1 month trial",
    features: ["1 gym", "Up to 50 members", "Basic attendance", "Diet & workout plans"],
  },
  {
    key: "basic",
    label: "Basic",
    color: Colors.info,
    bg: Colors.infoFaded,
    icon: "star-outline",
    intervals: [
      { interval: "3mo",  label: "3 months",  price: 999 },
      { interval: "6mo",  label: "6 months",  price: 1799 },
      { interval: "12mo", label: "12 months", price: 2999 },
    ],
    features: ["2 gyms", "Up to 200 members", "Payments & billing", "Supplement inventory"],
  },
  {
    key: "pro",
    label: "Pro",
    color: Colors.primary,
    bg: Colors.primaryFaded,
    icon: "rocket-launch-outline",
    popular: true,
    intervals: [
      { interval: "3mo",  label: "3 months",  price: 1999 },
      { interval: "6mo",  label: "6 months",  price: 3499 },
      { interval: "12mo", label: "12 months", price: 5999 },
    ],
    features: ["5 gyms", "Unlimited members", "Advanced reports", "Trainers & lockers", "Referral program"],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    color: Colors.purple,
    bg: Colors.purpleFaded,
    icon: "domain",
    intervals: [
      { interval: "3mo",  label: "3 months",  price: 3999 },
      { interval: "6mo",  label: "6 months",  price: 6999 },
      { interval: "12mo", label: "12 months", price: 11999 },
    ],
    features: ["Unlimited gyms", "White-label option", "Priority support", "Custom integrations"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function matchPlanId(plans: any[], key: string, interval?: Interval): string | undefined {
  const lower = key.toLowerCase();
  const matches = plans.filter((p: any) => (p.name ?? "").toLowerCase().includes(lower));
  if (!interval) return matches[0]?.id;
  const intMap: Record<Interval, string> = { "3mo": "3", "6mo": "6", "12mo": "12" };
  const n = intMap[interval];
  return (
    matches.find((p: any) =>
      String(p.intervalMonths ?? p.durationMonths ?? p.months ?? "").startsWith(n),
    )?.id ?? matches[0]?.id
  );
}

// ── Current plan banner ───────────────────────────────────────────────────────

function CurrentPlanBanner({ sub }: { sub: any }) {
  if (!sub?.isActive) return null;
  return (
    <View style={cp.banner}>
      <Icon name="check-circle-outline" size={18} color={Colors.success} />
      <View style={{ flex: 1 }}>
        <Text style={cp.label}>Current Plan</Text>
        <Text style={cp.plan}>{sub.planName ?? "Active Subscription"}</Text>
        {sub.expiresAt && (
          <Text style={cp.exp}>
            Renews{" "}
            {new Date(sub.expiresAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}
      </View>
      <View style={cp.activeBadge}>
        <Text style={cp.activeTxt}>Active</Text>
      </View>
    </View>
  );
}
const cp = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.success + "40",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: { color: Colors.textMuted, fontSize: Typography.xs },
  plan: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700", marginTop: 2 },
  exp: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  activeBadge: {
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeTxt: { color: "#fff", fontSize: Typography.xs, fontWeight: "700" },
});

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  apiPlans,
  onActivateFree,
  isActivating,
}: {
  plan: PlanDef;
  apiPlans: any[];
  onActivateFree: (saasPlanId: string) => void;
  isActivating: boolean;
}) {
  const [selInterval, setSelInterval] = useState<Interval>(
    plan.intervals?.[0]?.interval ?? "3mo",
  );
  const currentInterval = plan.intervals?.find((i) => i.interval === selInterval);

  return (
    <View style={[pc.card, plan.popular && { borderColor: plan.color, borderWidth: 2 }]}>
      {plan.popular && (
        <View style={[pc.popularBadge, { backgroundColor: plan.color }]}>
          <Icon name="fire" size={11} color="#fff" />
          <Text style={pc.popularTxt}>Most Popular</Text>
        </View>
      )}

      {/* Header */}
      <View style={pc.header}>
        <View style={[pc.iconWrap, { backgroundColor: plan.bg }]}>
          <Icon name={plan.icon} size={20} color={plan.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pc.label}>{plan.label}</Text>
          {plan.isFree && <Text style={[pc.price, { color: plan.color }]}>{plan.freeLabel}</Text>}
          {currentInterval && (
            <Text style={[pc.price, { color: plan.color }]}>{fmt(currentInterval.price)}</Text>
          )}
        </View>
      </View>

      {/* Interval picker */}
      {plan.intervals && (
        <View style={pc.intervalRow}>
          {plan.intervals.map((iv) => (
            <TouchableOpacity
              key={iv.interval}
              onPress={() => setSelInterval(iv.interval)}
              style={[
                pc.intervalPill,
                selInterval === iv.interval && {
                  backgroundColor: plan.bg,
                  borderColor: plan.color,
                },
              ]}
            >
              <Text
                style={[
                  pc.intervalTxt,
                  selInterval === iv.interval && { color: plan.color, fontWeight: "700" },
                ]}
              >
                {iv.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Features */}
      <View style={pc.featureList}>
        {plan.features.map((f) => (
          <View key={f} style={pc.featureRow}>
            <Icon name="check-circle-outline" size={13} color={plan.color} />
            <Text style={pc.featureTxt}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {plan.isFree ? (
        <TouchableOpacity
          style={[pc.ctaBtn, { backgroundColor: plan.color }]}
          onPress={() => {
            const id = matchPlanId(apiPlans, plan.key);
            if (!id) {
              Toast.show({ type: "error", text1: "Plan unavailable. Try again." });
              return;
            }
            onActivateFree(id);
          }}
          disabled={isActivating}
        >
          {isActivating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[pc.ctaTxt, { color: "#fff" }]}>Start Free Trial</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View>
          <View style={pc.webNote}>
            <Icon name="web" size={13} color={Colors.textMuted} />
            <Text style={pc.webNoteTxt}>Subscribe on the web app — mobile billing coming soon</Text>
          </View>
          <TouchableOpacity
            style={[pc.ctaBtn, { backgroundColor: plan.bg, borderColor: plan.color + "60", borderWidth: 1 }]}
            onPress={() =>
              Alert.alert(
                "Subscribe on Web",
                "Visit the GymStack web app to complete your subscription.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Open Web App",
                    onPress: () => Linking.openURL("https://app.gymstack.in/billing"),
                  },
                ],
              )
            }
          >
            <Icon name="open-in-new" size={14} color={plan.color} />
            <Text style={[pc.ctaTxt, { color: plan.color }]}>Subscribe on Web</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const pc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  popularTxt: { color: "#fff", fontSize: Typography.xs, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "800" },
  price: { fontSize: Typography.base, fontWeight: "700", marginTop: 3 },
  intervalRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  intervalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  intervalTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  featureList: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  featureTxt: { color: Colors.textSecondary, fontSize: Typography.xs },
  webNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  webNoteTxt: { flex: 1, color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: 12,
  },
  ctaTxt: { fontSize: Typography.sm, fontWeight: "700" },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const BillingScreen = () => {
  const { setHasActivePlan } = useAuthStore();

  const { data: sub, isLoading: subLoading } = useQuery<any>({
    queryKey: ["ownerSubscription"],
    queryFn: () => subscriptionApi.get(),
    staleTime: 5 * 60_000,
  });

  const { data: apiPlans = [] } = useQuery<any[]>({
    queryKey: ["saasPlansList"],
    queryFn: () => subscriptionApi.plans() as Promise<any[]>,
    staleTime: 10 * 60_000,
  });

  const activateFreeMutation = useMutation({
    mutationFn: (saasPlanId: string) =>
      subscriptionApi.subscribe({ saasPlanId, amount: 0 }),
    onSuccess: () => {
      setHasActivePlan(true);
      Toast.show({ type: "success", text1: "Free trial activated! 🎉" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Activation failed" }),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Header menu title="Billing & Plans" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Current plan banner */}
        {!subLoading && sub && <CurrentPlanBanner sub={sub} />}

        {/* Plan cards */}
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            apiPlans={apiPlans}
            onActivateFree={(id) => activateFreeMutation.mutate(id)}
            isActivating={activateFreeMutation.isPending}
          />
        ))}

        <Text style={styles.footerNote}>
          All prices are inclusive of taxes. Paid subscriptions are processed
          securely via Razorpay on the web app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  footerNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
