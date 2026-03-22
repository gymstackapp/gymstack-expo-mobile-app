// // mobile/src/screens/owner/ReferralScreen.tsx
// import React, { useState } from "react"
// import { View, Text, ScrollView, TouchableOpacity, Share, StyleSheet, RefreshControl } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Clipboard from "@react-native-clipboard/clipboard"
// import Toast from "react-native-toast-message"
// import { referralApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, PlanGate, StatCard, Skeleton } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// export function OwnerReferralScreen() {
//   const { hasReferAndEarn } = useSubscription()
//   const [tab, setTab] = useState<"referrals" | "wallet">("referrals")

//   const { data, isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerReferral"],
//     queryFn:  referralApi.get,
//     enabled:  hasReferAndEarn,
//     staleTime: 2 * 60_000,
//   })

//   // const code  = data?.referralCode ?? ""
//   // const stats = data?.stats ?? {}
//   const now   = new Date()

//   const copyCode = () => {
//     // Clipboard.setString(code)
//     Toast.show({ type: "success", text1: "Code copied! 📋" })
//   }

//   const shareCode = async () => {
//     await Share.share({
//       // message: `Join GymStack — the gym management platform! Use my referral code ${code} when signing up and we both earn wallet credits.`,
//       message: 'Join GymStack - the gym management platform!',
//       title:   "Join GymStack",
//     })
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
//         <Header title="Refer & Earn" subtitle="Earn ₹500 per referral" back />
//       </View>

//       <PlanGate allowed={hasReferAndEarn} featureLabel="Refer & Earn">
//         <ScrollView
//           contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg }}
//           showsVerticalScrollIndicator={false}
//           refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//         >
//           {/* Referral code card */}
//           <View style={rs.codeCard}>
//             <Text style={rs.codeLabel}>Your Referral Code</Text>
//             {/* <Text style={rs.codeValue}>{isLoading ? "—" : code}</Text> */}
//             <Text style={rs.codeSub}>Share with other gym owners. Earn ₹500 when they subscribe.</Text>
//             <View style={rs.codeActions}>
//               <TouchableOpacity style={rs.copyBtn} onPress={copyCode}>
//                 <Icon name="content-copy" size={16} color={Colors.textSecondary} />
//                 <Text style={rs.copyText}>Copy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={rs.shareBtn} onPress={shareCode}>
//                 <Icon name="share-variant-outline" size={16} color="#fff" />
//                 <Text style={rs.shareText}>Share</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Stats row */}
//           {isLoading ? (
//             <View style={{ flexDirection: "row", gap: Spacing.sm }}>
//               {[...Array(4)].map((_, i) => <Skeleton key={i} height={90} style={{ flex: 1 }} />)}
//             </View>
//           ) : (
//             // <View style={{ flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" }}>
//             //   <StatCard icon="account-group-outline" label="Referred"  value={stats.total     ?? 0} />
//             //   <StatCard icon="check-circle-outline"  label="Converted" value={stats.converted ?? 0} color={Colors.success} bg={Colors.successFaded} />
//             //   <StatCard icon="clock-outline"         label="Pending"   value={stats.pending   ?? 0} color={Colors.warning} bg={Colors.warningFaded} />
//             //   <StatCard icon="wallet-outline"        label="Earned"    value={`₹${(stats.totalEarned ?? 0).toLocaleString("en-IN")}`} />
//             // </View>
//             <Text>stats</Text>
//           )}

//           {/* Wallet balance */}
//           {/* {data?.usableBalance !== undefined && (
//             <Card>
//               <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
//                 <View style={{ width: 40, height: 40, borderRadius: Radius.lg, backgroundColor: Colors.primaryFaded, alignItems: "center", justifyContent: "center" }}>
//                   <Icon name="wallet-outline" size={20} color={Colors.primary} />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>Usable Balance (20% cap)</Text>
//                   <Text style={{ color: Colors.primary, fontSize: Typography.xl, fontWeight: "800", marginTop: 2 }}>₹{Number(data.usableBalance).toLocaleString("en-IN")}</Text>
//                 </View>
//               </View>
//             </Card>
//           )} */}

//           {/* Tabs */}
//           <View style={{ flexDirection: "row", backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, padding: 4 }}>
//             {(["referrals", "wallet"] as const).map(t => (
//               <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: Radius.md, backgroundColor: tab === t ? Colors.primary : "transparent" }}>
//                 <Text style={{ color: tab === t ? "#fff" : Colors.textMuted, fontSize: Typography.xs, fontWeight: tab === t ? "700" : "500", textTransform: "capitalize" }}>{t}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Referrals tab */}
//           {/* {tab === "referrals" && (
//             <View style={{ gap: Spacing.sm }}>
//               {isLoading ? <Skeleton height={60} /> :
//                (data?.referrals?.length ?? 0) === 0 ? (
//                 <View style={{ alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md }}>
//                   <Icon name="gift-outline" size={32} color={Colors.textMuted} />
//                   <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>No referrals yet</Text>
//                 </View>
//                ) : (
//                 data!.referrals.map((r: any) => (
//                   <Card key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" }}>{r.referred?.fullName}</Text>
//                       <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 }}>{r.referred?.email}</Text>
//                     </View>
//                     <View style={{ alignItems: "flex-end", gap: 4 }}>
//                       {r.rewardAmount ? <Text style={{ color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" }}>+₹{Number(r.rewardAmount).toLocaleString("en-IN")}</Text> : null}
//                       <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: r.status === "CONVERTED" ? Colors.successFaded : r.status === "EXPIRED" ? Colors.errorFaded : Colors.warningFaded }}>
//                         <Text style={{ fontSize: 10, fontWeight: "700", color: r.status === "CONVERTED" ? Colors.success : r.status === "EXPIRED" ? Colors.error : Colors.warning }}>
//                           {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
//                         </Text>
//                       </View>
//                     </View>
//                   </Card>
//                 ))
//                )}
//             </View>
//           )} */}

//           {/* Wallet tab */}
//           {/* {tab === "wallet" && (
//             <View style={{ gap: Spacing.sm }}>
//               {isLoading ? <Skeleton height={60} /> :
//                (data?.walletTransactions?.length ?? 0) === 0 ? (
//                 <View style={{ alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md }}>
//                   <Icon name="wallet-outline" size={32} color={Colors.textMuted} />
//                   <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>No transactions yet</Text>
//                 </View>
//                ) : (
//                 data!.walletTransactions.map((tx: any) => {
//                   const isCredit = tx.type.startsWith("CREDIT")
//                   const expiringSoon = tx.expiresAt && !isCredit ? false : tx.expiresAt && (new Date(tx.expiresAt).getTime() - now.getTime()) < 30 * 86400000
//                   return (
//                     <Card key={tx.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
//                       <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: isCredit ? Colors.successFaded : Colors.errorFaded, alignItems: "center", justifyContent: "center" }}>
//                         <Icon name="trending-up" size={16} color={isCredit ? Colors.success : Colors.error} />
//                       </View>
//                       <View style={{ flex: 1 }}>
//                         <Text style={{ color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: "500" }}>{tx.description ?? tx.type.replace(/_/g, " ")}</Text>
//                         <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 1 }}>
//                           {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//                           {expiringSoon ? "  ⚠ Expires soon" : ""}
//                         </Text>
//                       </View>
//                       <Text style={{ color: isCredit ? Colors.success : Colors.error, fontSize: Typography.sm, fontWeight: "700" }}>
//                         {isCredit ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
//                       </Text>
//                     </Card>
//                   )
//                 })
//                )}
//             </View>
//           )} */}
//         </ScrollView>
//       </PlanGate>
//     </SafeAreaView>
//   )
// }

// const rs = StyleSheet.create({
//   codeCard:    { backgroundColor: Colors.primaryFaded, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.primary + "30", padding: Spacing.xl, gap: Spacing.md, alignItems: "center" },
//   codeLabel:   { color: Colors.primary, fontSize: Typography.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
//   codeValue:   { color: Colors.textPrimary, fontSize: 32, fontWeight: "800", letterSpacing: 8 },
//   codeSub:     { color: Colors.textMuted, fontSize: Typography.xs, textAlign: "center" },
//   codeActions: { flexDirection: "row", gap: Spacing.md },
//   copyBtn:     { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
//   copyText:    { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: "600" },
//   shareBtn:    { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
//   shareText:   { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
// })

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ReferralScreen = () => {
  return (
    <View>
      <Text>ReferralScreen</Text>
    </View>
  );
};

export default ReferralScreen;

const styles = StyleSheet.create({});
