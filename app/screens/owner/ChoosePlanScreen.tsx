// app/screens/owner/ChoosePlanScreen.tsx
// Fullscreen standalone screen — NO drawer/tab navigation.
// Shown when an owner has no active SaaS subscription (hasActivePlan=false).
// Plans: Free (trial) | Basic | Pro | Enterprise
// Free plan activates directly; paid plans open native Razorpay checkout.

import { subscriptionApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Plan definitions ───────────────────────────────────────────────────────────

type Interval = "3mo" | "6mo" | "12mo";

interface PlanDef {
  key: string; // matches name contains "free"/"basic"/"pro"/"enterprise"
  label: string;
  color: string;
  bg: string;
  icon: string;
  popular?: boolean;
  trial?: boolean;
  trialLabel?: string;
  intervals?: { interval: Interval; label: string; price: number }[];
  cta: string;
}

const PLANS: PlanDef[] = [
  {
    key: "free",
    label: "Free",
    color: Colors.success,
    bg: Colors.successFaded,
    icon: "gift-outline",
    trial: true,
    trialLabel: "1 month trial",
    cta: "Start Free Trial",
  },
  {
    key: "basic",
    label: "Basic",
    color: Colors.info,
    bg: Colors.infoFaded,
    icon: "star-outline",
    intervals: [
      { interval: "3mo", label: "3 months", price: 999 },
      { interval: "6mo", label: "6 months", price: 1799 },
      { interval: "12mo", label: "12 months", price: 2999 },
    ],
    cta: "Subscribe",
  },
  {
    key: "pro",
    label: "Pro",
    color: Colors.primary,
    bg: Colors.primaryFaded,
    icon: "rocket-launch-outline",
    popular: true,
    intervals: [
      { interval: "3mo", label: "3 months", price: 1999 },
      { interval: "6mo", label: "6 months", price: 3499 },
      { interval: "12mo", label: "12 months", price: 5999 },
    ],
    cta: "Subscribe",
  },
  {
    key: "enterprise",
    label: "Enterprise",
    color: Colors.purple,
    bg: Colors.purpleFaded,
    icon: "domain",
    intervals: [
      { interval: "3mo", label: "3 months", price: 3999 },
      { interval: "6mo", label: "6 months", price: 6999 },
      { interval: "12mo", label: "12 months", price: 11999 },
    ],
    cta: "Subscribe",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const INTERVAL_DB_MAP: Record<Interval, string> = {
  "3mo": "QUARTERLY",
  "6mo": "HALF_YEARLY",
  "12mo": "YEARLY",
};

function matchPlanId(plans: any[], key: string): string | undefined {
  return plans.find((p: any) =>
    (p.name ?? "").toLowerCase().includes(key.toLowerCase()),
  )?.id;
}

function matchPaidPlanId(
  plans: any[],
  key: string,
  interval: Interval,
): string | undefined {
  const lower = key.toLowerCase();
  const dbInterval = INTERVAL_DB_MAP[interval];
  return plans.find(
    (p: any) =>
      (p.name ?? "").toLowerCase().includes(lower) && p.interval === dbInterval,
  )?.id;
}

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  apiPlans,
  onActivateFree,
  onPurchasePaid,
  isActivating,
}: {
  plan: PlanDef;
  apiPlans: any[];
  onActivateFree: (saasPlanId: string) => void;
  onPurchasePaid: (saasPlanId: string, amount: number, label: string) => void;
  isActivating: boolean;
}) {
  const [selInterval, setSelInterval] = useState<Interval>(
    plan.intervals?.[0]?.interval ?? "3mo",
  );

  const currentInterval = plan.intervals?.find(
    (i) => i.interval === selInterval,
  );

  return (
    <View
      style={[
        pc.card,
        { borderColor: plan.popular ? plan.color : Colors.border },
        plan.popular && { borderWidth: 2 },
      ]}
    >
      {plan.popular && (
        <View style={[pc.popularBadge, { backgroundColor: plan.color }]}>
          <Icon name="fire" size={12} color="#fff" />
          <Text style={pc.popularTxt}>Most Popular</Text>
        </View>
      )}

      <View style={pc.header}>
        <View style={[pc.iconWrap, { backgroundColor: plan.bg }]}>
          <Icon name={plan.icon} size={22} color={plan.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pc.label}>{plan.label}</Text>
          {plan.trial && (
            <Text style={[pc.trialBadge, { color: plan.color }]}>
              {plan.trialLabel}
            </Text>
          )}
          {plan.trial && (
            <Text style={[pc.price, { color: plan.color }]}>₹0</Text>
          )}
        </View>
      </View>

      {/* Interval picker for paid plans */}
      {plan.intervals && (
        <>
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
                    selInterval === iv.interval && {
                      color: plan.color,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {iv.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {currentInterval && (
            <Text style={[pc.price, { color: plan.color }]}>
              {fmt(currentInterval.price)}
            </Text>
          )}
        </>
      )}

      {/* CTA */}
      {plan.intervals ? (
        <TouchableOpacity
          style={[
            pc.ctaBtn,
            { backgroundColor: plan.color, borderColor: plan.color },
          ]}
          onPress={() => {
            const id = matchPaidPlanId(apiPlans, plan.key, selInterval);
            if (!id || !currentInterval) {
              Toast.show({
                type: "error",
                text1: "Plan not available. Try again.",
              });
              return;
            }
            onPurchasePaid(
              id,
              currentInterval.price,
              `${plan.label} ${selInterval}`,
            );
          }}
          disabled={isActivating}
        >
          {isActivating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="credit-card-outline" size={15} color="#fff" />
              <Text style={[pc.ctaTxt, { color: "#fff" }]}>{plan.cta}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            pc.ctaBtn,
            { backgroundColor: plan.color, borderColor: plan.color },
          ]}
          onPress={() => {
            const id = matchPlanId(apiPlans, plan.key);
            if (!id) {
              Toast.show({
                type: "error",
                text1: "Plan not available. Try again.",
              });
              return;
            }
            onActivateFree(id);
          }}
          disabled={isActivating}
        >
          {isActivating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[pc.ctaTxt, { color: "#fff" }]}>{plan.cta}</Text>
          )}
        </TouchableOpacity>
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
    overflow: "hidden",
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 4,
  },
  popularTxt: { color: "#fff", fontSize: Typography.xs, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  trialBadge: { fontSize: Typography.xs, fontWeight: "600", marginTop: 2 },
  price: { fontSize: Typography.xxl, fontWeight: "800", marginTop: 4 },
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
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
  },
  ctaTxt: { fontSize: Typography.sm, fontWeight: "700" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function ChoosePlanScreen() {
  const { logout, setHasActivePlan } = useAuthStore();
  const [purchasingPaid, setPurchasingPaid] = useState(false);

  const { data: apiPlans = [], isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ["saasPlansList"],
    queryFn: () => subscriptionApi.plans() as Promise<any[]>,
    staleTime: 10 * 60_000,
  });

  const activateFreeMutation = useMutation({
    mutationFn: (saasPlanId: string) =>
      subscriptionApi.subscribe({ saasPlanId, amount: 0 }),
    onSuccess: () => {
      setHasActivePlan(true);
      Toast.show({
        type: "success",
        text1: "Free trial activated! Welcome 🎉",
      });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Activation failed" }),
  });

  const purchasePaidPlan = async (
    saasPlanId: string,
    _amount: number,
    planLabel: string,
  ) => {
    setPurchasingPaid(true);
    try {
      const orderData = (await subscriptionApi.createOrder({
        saasPlanId,
      })) as any;

      const paymentData = await RazorpayCheckout.open({
        description: `${planLabel} Subscription`,
        currency: orderData.currency ?? "INR",
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: Number(orderData.amount),
        name: "GymStack",
        order_id: orderData.orderId,
        prefill: { email: "", contact: "", name: "" },
        theme: { color: "#f97316" },
      });

      await subscriptionApi.subscribe({
        saasPlanId,
        amount: Number(orderData.amount) / 100,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature,
      });

      setHasActivePlan(true);
      Toast.show({
        type: "success",
        text1: "Subscription activated! Welcome 🎉",
      });
    } catch (err: any) {
      if (err?.code !== 0) {
        Toast.show({
          type: "error",
          text1: err?.description ?? "Payment failed. Please try again.",
        });
      }
    } finally {
      setPurchasingPaid(false);
    }
  };

  const isAnyActivating = activateFreeMutation.isPending || purchasingPaid;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Choose Your Plan</Text>
        <Text style={s.subtitle}>
          Select a plan to unlock GymStack for your gym business
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {plansLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={s.loadingTxt}>Loading plans…</Text>
          </View>
        ) : (
          PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              apiPlans={apiPlans}
              onActivateFree={(id) => activateFreeMutation.mutate(id)}
              onPurchasePaid={purchasePaidPlan}
              isActivating={isAnyActivating}
            />
          ))
        )}

        <TouchableOpacity style={s.logoutLink} onPress={logout}>
          <Icon name="logout" size={14} color={Colors.textMuted} />
          <Text style={s.logoutTxt}>Sign out and use a different account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    gap: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  logoutLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logoutTxt: { color: Colors.textMuted, fontSize: Typography.xs },
});
