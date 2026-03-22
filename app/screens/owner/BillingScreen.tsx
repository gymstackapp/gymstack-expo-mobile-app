// // mobile/src/screens/owner/BillingScreen.tsx
// import React, { useEffect, useState } from "react"
// import {
//   View, Text, ScrollView, TouchableOpacity,
//   StyleSheet, RefreshControl, Alert,
// } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import LinearGradient from "react-native-linear-gradient"
// import Toast from "react-native-toast-message"
// import { subscriptionApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, Skeleton } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// const PLANS = [
//   {
//     key: "free trial",
//     name: "Free Trial",
//     price: 0,
//     duration: "1 month",
//     features: ["1 gym", "100 members", "1 trainer", "10 plans", "10 notifications/mo"],
//     color: Colors.textSecondary,
//     badge: null,
//   },
//   {
//     key: "starter",
//     name: "Starter",
//     price: 2000,
//     duration: "6 months",
//     features: ["2 gyms", "200 members", "2 trainers", "Workout & Diet plans", "Attendance", "50 notifications/mo"],
//     color: Colors.info,
//     badge: "Popular",
//   },
//   {
//     key: "growth",
//     name: "Growth",
//     price: 3000,
//     duration: "12 months",
//     features: ["10 gyms", "500 members", "10 trainers", "Supplements", "Payments", "Full analytics", "100 notifications/mo"],
//     color: Colors.primary,
//     badge: "Best Value",
//   },
//   {
//     key: "pro",
//     name: "Pro",
//     price: 5000,
//     duration: "12 months",
//     features: ["Unlimited everything", "Plan templates", "Refer & earn", "Full reports"],
//     color: Colors.purple,
//     badge: "Most Powerful",
//   },
//   {
//     key: "lifetime",
//     name: "Lifetime",
//     price: 30000,
//     duration: "Forever",
//     features: ["All Pro features", "Pay once, use forever", "Priority support"],
//     color: Colors.yellow,
//     badge: "Pay Once",
//   },
// ]

// function PlanCard({
//   plan, isCurrent, isExpired, onSubscribe, subscribing,
// }: {
//   plan: typeof PLANS[0]
//   isCurrent: boolean
//   isExpired: boolean
//   onSubscribe: (planKey: string) => void
//   subscribing: string | null
// }) {
//   const isLoading = subscribing === plan.key

//   return (
//     <View style={[
//       bs.planCard,
//       { borderColor: isCurrent ? plan.color + "60" : Colors.border },
//       isCurrent && { borderWidth: 2 },
//     ]}>
//       {/* Badge */}
//       {plan.badge && !isCurrent ? (
//         <View style={[bs.badge, { backgroundColor: plan.color + "20", borderColor: plan.color + "40" }]}>
//           <Text style={[bs.badgeText, { color: plan.color }]}>{plan.badge}</Text>
//         </View>
//       ) : isCurrent ? (
//         <View style={[bs.badge, { backgroundColor: Colors.successFaded, borderColor: Colors.success + "40" }]}>
//           <Icon name="check-circle-outline" size={11} color={Colors.success} />
//           <Text style={[bs.badgeText, { color: Colors.success }]}>Current Plan</Text>
//         </View>
//       ) : null}

//       {/* Plan info */}
//       <View style={bs.planHeader}>
//         <View>
//           <Text style={bs.planName}>{plan.name}</Text>
//           <Text style={bs.planDuration}>{plan.duration}</Text>
//         </View>
//         <View style={{ alignItems: "flex-end" }}>
//           {plan.price === 0 ? (
//             <Text style={[bs.planPrice, { color: plan.color }]}>Free</Text>
//           ) : (
//             <Text style={[bs.planPrice, { color: plan.color }]}>
//               ₹{plan.price.toLocaleString("en-IN")}
//             </Text>
//           )}
//         </View>
//       </View>

//       {/* Features */}
//       <View style={bs.features}>
//         {plan.features.map(f => (
//           <View key={f} style={bs.featureRow}>
//             <Icon name="check" size={12} color={plan.color} />
//             <Text style={bs.featureText}>{f}</Text>
//           </View>
//         ))}
//       </View>

//       {/* CTA */}
//       <TouchableOpacity
//         onPress={() => !isCurrent && onSubscribe(plan.key)}
//         disabled={isCurrent || isLoading}
//         style={bs.ctaWrap}
//         activeOpacity={0.85}
//       >
//         {isCurrent ? (
//           <View style={[bs.ctaGhost, { borderColor: plan.color + "40" }]}>
//             <Text style={[bs.ctaGhostText, { color: plan.color }]}>Active Plan</Text>
//           </View>
//         ) : (
//           <LinearGradient
//             colors={[plan.color, plan.color + "cc"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={bs.cta}
//           >
//             {isLoading ? (
//               <Text style={bs.ctaText}>Processing...</Text>
//             ) : plan.price === 0 ? (
//               <Text style={bs.ctaText}>Start Free Trial</Text>
//             ) : (
//               <Text style={bs.ctaText}>Subscribe ₹{plan.price.toLocaleString("en-IN")}</Text>
//             )}
//           </LinearGradient>
//         )}
//       </TouchableOpacity>
//     </View>
//   )
// }

// function UsageSummary() {
//   const sub = useSubscription()
//   if (!sub.usage || !sub.limits) return null

//   // const items = [
//   //   { label: "Gyms",    used: sub.usage.gyms,            max: sub.limits.maxGyms,           pct: sub.gymUsagePct },
//   //   { label: "Members", used: sub.usage.members,          max: sub.limits.maxMembers,         pct: sub.memberUsagePct },
//   //   { label: "Trainers",used: sub.usage.trainers,         max: sub.limits.maxTrainers,        pct: sub.trainerUsagePct },
//   //   { label: "Plans",   used: sub.usage.membershipPlans,  max: sub.limits.maxMembershipPlans, pct: sub.planUsagePct },
//   // ]

//   return (
//     <Card>
//       <Text style={bs.usageTitle}>Current Usage</Text>
//       <View style={bs.usageGrid}>
//         {/* {items.map(item => (
//           <View key={item.label} style={bs.usageItem}>
//             <View style={bs.usageRow}>
//               <Text style={bs.usageLabel}>{item.label}</Text>
//               <Text style={[
//                 bs.usageValue,
//                 item.pct !== null && item.pct >= 90 ? { color: Colors.error } :
//                 item.pct !== null && item.pct >= 70 ? { color: Colors.warning } : {},
//               ]}>
//                 {item.max === null ? `${item.used} / ∞` : `${item.used} / ${item.max}`}
//               </Text>
//             </View>
//             {item.pct !== null && (
//               <View style={bs.barBg}>
//                 <View style={[
//                   bs.barFill,
//                   {
//                     width: `${item.pct}%` as any,
//                     backgroundColor: item.pct >= 90 ? Colors.error : item.pct >= 70 ? Colors.warning : Colors.primary,
//                   },
//                 ]} />
//               </View>
//             )}
//           </View>
//         ))} */}

//       </View>
//     </Card>
//   )
// }

// export function OwnerBillingScreen() {
//   const sub = useSubscription()
//   const [subscribing, setSubscribing] = useState<string | null>(null)

//   const { data: dbPlans = [], isLoading: plansLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["billingPlans"],
//     queryFn:  subscriptionApi.plans,
//     staleTime: 10 * 60_000,
//   })

//   const activePlanKey = sub.subscription?.planSlug ?? null

//   const handleSubscribe = async (planKey: string) => {
//     // For free plan — subscribe directly
//     const dbPlan = (dbPlans as any[]).find(p => p.name.toLowerCase().trim() === planKey)
//     if (!dbPlan) { Toast.show({ type: "error", text1: "Plan not found" }); return }

//     if (dbPlan.price === 0 || Number(dbPlan.price) === 0) {
//       setSubscribing(planKey)
//       // try {
//       //   await subscriptionApi.subscribe({ saasPlanId: dbPlan.id, amount: 0 })
//       //   await sub.refresh?.()  // refresh subscription in context if available
//       //   Toast.show({ type: "success", text1: "Free trial activated!" })
//       // } catch (err: any) {
//       //   Toast.show({ type: "error", text1: err.message ?? "Failed to activate" })
//       // } finally {
//       //   setSubscribing(null)
//       // }
//       return
//     }

//     // Paid plan — inform user to use web app for payment
//     Alert.alert(
//       "Subscribe via Web",
//       `To subscribe to the ${PLANS.find(p => p.key === planKey)?.name} plan, please visit our website. Razorpay payments are handled through the web app.`,
//       [{ text: "OK" }]
//     )
//   }

//   return (
//     <SafeAreaView style={bs.safe}>
//       <View style={bs.headerWrap}>
//         <Header title="Billing & Plans" subtitle="Manage your subscription" back />
//       </View>

//       <ScrollView
//         contentContainerStyle={bs.scroll}
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//       >
//         {/* Current plan banner */}
//         {sub.subscription && (
//           <View style={[
//             bs.currentBanner,
//             sub.isExpired
//               ? { backgroundColor: Colors.errorFaded, borderColor: Colors.error + "30" }
//               : { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary + "30" },
//           ]}>
//             <Icon
//               name={sub.isExpired ? "alert-circle-outline" : "crown-outline"}
//               size={20}
//               color={sub.isExpired ? Colors.error : Colors.primary}
//             />
//             <View style={{ flex: 1 }}>
//               <Text style={[bs.currentPlanName, { color: sub.isExpired ? Colors.error : Colors.textPrimary }]}>
//                 {sub.subscription.planName} Plan
//               </Text>
//               <Text style={bs.currentPlanSub}>
//                 {sub.isExpired
//                   ? "Expired — upgrade to restore access"
//                   : sub.isLifetime
//                   ? "Lifetime access — never expires"
//                   : sub.daysRemaining !== null
//                   ? `${sub.daysRemaining} day${sub.daysRemaining !== 1 ? "s" : ""} remaining`
//                   : "Active"}
//               </Text>
//             </View>
//             <View style={[
//               bs.statusPill,
//               { backgroundColor: sub.isExpired ? Colors.errorFaded : Colors.successFaded,
//                 borderColor: sub.isExpired ? Colors.error + "40" : Colors.success + "40" },
//             ]}>
//               <Text style={[bs.statusText, { color: sub.isExpired ? Colors.error : Colors.success }]}>
//                 {sub.isExpired ? "Expired" : "Active"}
//               </Text>
//             </View>
//           </View>
//         )}

//         {/* Usage summary */}
//         <UsageSummary />

//         {/* Plan cards */}
//         <Text style={bs.sectionTitle}>Available Plans</Text>
//         {plansLoading ? (
//           <View style={{ gap: Spacing.md }}>
//             {[...Array(3)].map((_, i) => <Skeleton key={i} height={200} />)}
//           </View>
//         ) : (
//           <View style={{ gap: Spacing.md }}>
//             {PLANS.map(plan => (
//               <PlanCard
//                 key={plan.key}
//                 plan={plan}
//                 isCurrent={activePlanKey === plan.key && !sub.isExpired}
//                 isExpired={sub.isExpired}
//                 onSubscribe={handleSubscribe}
//                 subscribing={subscribing}
//               />
//             ))}
//           </View>
//         )}

//         {/* Trust note */}
//         <View style={bs.trustNote}>
//           <Icon name="shield-check-outline" size={16} color={Colors.textMuted} />
//           <Text style={bs.trustText}>
//             Payments are secure and processed via Razorpay. For paid plans, use the web app to complete payment.
//           </Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// const bs = StyleSheet.create({
//   safe:         { flex: 1, backgroundColor: Colors.bg },
//   headerWrap:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
//   scroll:       { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
//   currentBanner:{ flexDirection: "row", alignItems: "center", gap: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg },
//   currentPlanName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
//   currentPlanSub:  { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
//   statusText:   { fontSize: Typography.xs, fontWeight: "700" },
//   usageTitle:   { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "600", marginBottom: Spacing.md },
//   usageGrid:    { gap: Spacing.md },
//   usageItem:    { gap: 6 },
//   usageRow:     { flexDirection: "row", justifyContent: "space-between" },
//   usageLabel:   { color: Colors.textMuted, fontSize: Typography.xs },
//   usageValue:   { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: "600" },
//   barBg:        { height: 6, backgroundColor: Colors.surfaceRaised, borderRadius: 3, overflow: "hidden" },
//   barFill:      { height: "100%", borderRadius: 3 },
//   sectionTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
//   planCard:     { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
//   badge:        { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
//   badgeText:    { fontSize: 11, fontWeight: "700" },
//   planHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
//   planName:     { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "800" },
//   planDuration: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   planPrice:    { fontSize: 28, fontWeight: "800" },
//   features:     { gap: 6 },
//   featureRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
//   featureText:  { color: Colors.textSecondary, fontSize: Typography.xs },
//   ctaWrap:      { borderRadius: Radius.lg, overflow: "hidden" },
//   cta:          { paddingVertical: 14, alignItems: "center" },
//   ctaText:      { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
//   ctaGhost:     { paddingVertical: 14, alignItems: "center", borderWidth: 1, borderRadius: Radius.lg },
//   ctaGhostText: { fontSize: Typography.base, fontWeight: "600" },
//   trustNote:    { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg },
//   trustText:    { color: Colors.textMuted, fontSize: Typography.xs, flex: 1, lineHeight: 18 },
// })

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const BillingScreen = () => {
  return (
    <View>
      <Text>BillingScreen</Text>
    </View>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({});
