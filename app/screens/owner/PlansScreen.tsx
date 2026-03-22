// // mobile/src/screens/owner/PlansScreen.tsx
// import React, { useState } from "react"
// import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, StyleSheet, Alert, RefreshControl } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useRoute } from "@react-navigation/native"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Toast from "react-native-toast-message"
// import { membershipPlansApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, PlanGate, EmptyState, Input, Button, SkeletonGroup } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

// export function OwnerPlansScreen() {
//   const route   = useRoute()
//   const qc      = useQueryClient()
//   // const { canAddMembershipPlan, hasPayments } = useSubscription()
//   const initialGymId = (route.params as any)?.gymId ?? ""
//   const [gymId,   setGymId]   = useState(initialGymId)
//   const [showAdd, setShowAdd] = useState(false)
//   const [form, setForm] = useState({ gymId: initialGymId, name: "", description: "", durationMonths: "1", price: "", features: "" })

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })
//   const { data: plans = [], isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerPlans", gymId],
//     queryFn:  () => membershipPlansApi.list(gymId),
//     enabled:  !!gymId,
//     staleTime: 60_000,
//   })

//   const addMutation = useMutation({
//     mutationFn: () => membershipPlansApi.create({
//       ...form,
//       gymId:          form.gymId || gymId,
//       durationMonths: parseInt(form.durationMonths),
//       price:          parseFloat(form.price),
//       features:       form.features.split(",").map(f => f.trim()).filter(Boolean),
//     }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] })
//       qc.invalidateQueries({ queryKey: ["ownerSubscription"] })
//       setShowAdd(false)
//       setForm(f => ({ ...f, name: "", description: "", durationMonths: "1", price: "", features: "" }))
//       Toast.show({ type: "success", text1: "Plan created!" })
//     },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const deleteMutation = useMutation({
//     mutationFn: (id: string) => membershipPlansApi.delete(id),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] }); Toast.show({ type: "success", text1: "Plan deleted" }) },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
//         {/* <Header
//           title="Membership Plans"
//           subtitle={`${plans.length} plans`}
//           back
//           right={
//             canAddMembershipPlan ? (
//               <TouchableOpacity style={{ width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" }} onPress={() => setShowAdd(true)}>
//                 <Icon name="plus" size={20} color="#fff" />
//               </TouchableOpacity>
//             ) : null
//           }
//         /> */}
//         {/* {gyms.length > 1 && !initialGymId && (
//           <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
//             {(gyms as any[]).map((g: any) => (
//               <TouchableOpacity key={g.id} onPress={() => setGymId(g.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: gymId === g.id ? Colors.primary : Colors.border }}>
//                 <Text style={{ color: gymId === g.id ? Colors.primary : Colors.textMuted, fontSize: Typography.xs, fontWeight: gymId === g.id ? "700" : "400" }}>{g.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )} */}
//       </View>

//       {/* {isLoading ? (
//         <View style={{ padding: Spacing.lg }}><SkeletonGroup count={3} itemHeight={100} gap={Spacing.md} /></View>
//       ) : plans.length === 0 ? (
//         <EmptyState icon="tag-outline" title="No plans yet" subtitle="Create your first membership plan"
//           action={canAddMembershipPlan ? (
//             <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm }} onPress={() => setShowAdd(true)}>
//               <Icon name="plus" size={16} color="#fff" />
//               <Text style={{ color: "#fff", fontWeight: "700", fontSize: Typography.sm }}>Add Plan</Text>
//             </TouchableOpacity>
//           ) : undefined}
//         />
//       ) : (
//         <FlatList
//           data={plans as any[]}
//           keyExtractor={p => p.id}
//           contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
//           showsVerticalScrollIndicator={false}
//           refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//           ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
//           renderItem={({ item: p }) => (
//             <Card>
//               <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" }}>{p.name}</Text>
//                   <Text style={{ color: Colors.primary, fontSize: Typography.xl, fontWeight: "800", marginTop: 4 }}>{fmt(p.price)}</Text>
//                   <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 }}>{p.durationMonths} month{p.durationMonths !== 1 ? "s" : ""}</Text>
//                   {p.description ? <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 4 }}>{p.description}</Text> : null}
//                 </View>
//                 <TouchableOpacity
//                   onPress={() => Alert.alert("Delete Plan", `Delete "${p.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(p.id) }])}
//                   hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                 >
//                   <Icon name="trash-can-outline" size={18} color={Colors.error} />
//                 </TouchableOpacity>
//               </View>
//               {p.features?.length > 0 && (
//                 <View style={{ marginTop: Spacing.md, gap: 4 }}>
//                   {p.features.map((f: string) => (
//                     <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
//                       <Icon name="check-circle-outline" size={13} color={Colors.success} />
//                       <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>{f}</Text>
//                     </View>
//                   ))}
//                 </View>
//               )}
//             </Card>
//           )}
//         />
//       )} */}

//       <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
//             <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
//               <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "700" }}>New Plan</Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
//             </View>
//             {/* {!initialGymId && gyms.length > 1 && (
//               <View>
//                 <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500", marginBottom: 8 }}>Gym *</Text>
//                 <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
//                   {(gyms as any[]).map((g: any) => (
//                     <TouchableOpacity key={g.id} onPress={() => set("gymId", g.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: form.gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: form.gymId === g.id ? Colors.primary : Colors.border }}>
//                       <Text style={{ color: form.gymId === g.id ? Colors.primary : Colors.textMuted, fontSize: Typography.xs }}>{g.name}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </View>
//             )} */}
//             <Input label="Plan Name *" value={form.name} onChangeText={v => set("name", v)} placeholder="e.g. Monthly Premium" />
//             <Input label="Description" value={form.description} onChangeText={v => set("description", v)} placeholder="Brief description..." />
//             <Input label="Duration (months) *" value={form.durationMonths} onChangeText={v => set("durationMonths", v)} keyboardType="numeric" />
//             <Input label="Price (₹) *" value={form.price} onChangeText={v => set("price", v)} keyboardType="numeric" leftIcon="currency-inr" />
//             <Input label="Features (comma separated)" value={form.features} onChangeText={v => set("features", v)} placeholder="Cardio, Weight training, Diet plan" multiline numberOfLines={2} />
//             <Button label="Create Plan" onPress={() => { if (!form.name.trim() || !form.price) { Toast.show({ type: "error", text1: "Name and price required" }); return } addMutation.mutate() }} loading={addMutation.isPending} />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   )
// }

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PlansScreen = () => {
  return (
    <View>
      <Text>PlansScreen</Text>
    </View>
  );
};

export default PlansScreen;

const styles = StyleSheet.create({});
