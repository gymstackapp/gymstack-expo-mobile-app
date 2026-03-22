// // mobile/src/screens/owner/DietsScreen.tsx
// import React, { useState } from "react"
// import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, RefreshControl } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Toast from "react-native-toast-message"
// import { dietsApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, PlanGate, EmptyState, Input, Button, SkeletonGroup } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// export function OwnerDietsScreen() {
//   const qc = useQueryClient()
//   const { hasDietPlans } = useSubscription()
//   const [gymId,   setGymId]   = useState("")
//   const [showAdd, setShowAdd] = useState(false)
//   const [form, setForm] = useState({ gymId: "", title: "", goal: "", caloriesTarget: "", proteinG: "", carbsG: "", fatG: "", durationWeeks: "4", isGlobal: false })

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })
//   const { data: plans = [], isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerDiets", gymId],
//     queryFn:  () => dietsApi.list({ gymId: gymId || undefined }),
//     enabled:  hasDietPlans,
//     staleTime: 60_000,
//   })

//   const addMutation = useMutation({
//     mutationFn: () => dietsApi.create({ ...form, gymId: form.gymId || gymId || (gyms as any[])[0]?.id, durationWeeks: parseInt(form.durationWeeks) || 4, caloriesTarget: form.caloriesTarget ? parseInt(form.caloriesTarget) : null, proteinG: form.proteinG || null, carbsG: form.carbsG || null, fatG: form.fatG || null }),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerDiets"] }); setShowAdd(false); Toast.show({ type: "success", text1: "Diet plan created!" }) },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
//         <Header title="Diet Plans" back right={
//           hasDietPlans ? (
//             <TouchableOpacity style={{ width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center" }} onPress={() => setShowAdd(true)}>
//               <Icon name="plus" size={20} color="#fff" />
//             </TouchableOpacity>
//           ) : null
//         } />
//         {/* {gyms.length > 1 && (
//           <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
//             {[{ id: "", name: "All" }, ...(gyms as any[])].map((g: any) => (
//               <TouchableOpacity key={g.id} onPress={() => setGymId(g.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: gymId === g.id ? Colors.primary : Colors.border }}>
//                 <Text style={{ color: gymId === g.id ? Colors.primary : Colors.textMuted, fontSize: Typography.xs }}>{g.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )} */}
//       </View>

//       <PlanGate allowed={hasDietPlans} featureLabel="Diet Plans">
//         {isLoading ? <View style={{ padding: Spacing.lg }}><SkeletonGroup count={3} itemHeight={80} gap={Spacing.md} /></View> :
//          (plans as any[]).length === 0 ? (
//           <EmptyState icon="food-apple-outline" title="No diet plans" subtitle="Create nutrition plans for your members"
//             action={<TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm }} onPress={() => setShowAdd(true)}><Icon name="plus" size={16} color="#fff" /><Text style={{ color: "#fff", fontWeight: "700", fontSize: Typography.sm }}>New Plan</Text></TouchableOpacity>}
//           />
//          ) : (
//           <FlatList
//             data={plans as any[]}
//             keyExtractor={p => p.id}
//             contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
//             showsVerticalScrollIndicator={false}
//             refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//             ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
//             renderItem={({ item: p }) => (
//               <Card>
//                 <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" }}>{p.title ?? "Diet Plan"}</Text>
//                 <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 }}>{p.gym?.name} · {p.durationWeeks}w</Text>
//                 {p.goal ? <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 }}>{p.goal}</Text> : null}
//                 {p.caloriesTarget ? (
//                   <View style={{ flexDirection: "row", gap: Spacing.lg, marginTop: Spacing.sm }}>
//                     <View><Text style={{ color: Colors.textMuted, fontSize: 10 }}>Calories</Text><Text style={{ color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" }}>{p.caloriesTarget}</Text></View>
//                     {p.proteinG ? <View><Text style={{ color: Colors.textMuted, fontSize: 10 }}>Protein</Text><Text style={{ color: Colors.success, fontSize: Typography.sm, fontWeight: "700" }}>{p.proteinG}g</Text></View> : null}
//                     {p.carbsG ?   <View><Text style={{ color: Colors.textMuted, fontSize: 10 }}>Carbs</Text><Text style={{ color: Colors.warning, fontSize: Typography.sm, fontWeight: "700" }}>{p.carbsG}g</Text></View> : null}
//                     {p.fatG ?     <View><Text style={{ color: Colors.textMuted, fontSize: 10 }}>Fat</Text><Text style={{ color: Colors.error, fontSize: Typography.sm, fontWeight: "700" }}>{p.fatG}g</Text></View> : null}
//                   </View>
//                 ) : null}
//                 {p.assignedMember ? <Text style={{ color: Colors.primary, fontSize: Typography.xs, marginTop: 6 }}>→ {p.assignedMember?.profile?.fullName}</Text> : p.isGlobal ? <Text style={{ color: Colors.info, fontSize: Typography.xs, marginTop: 6 }}>Global Plan</Text> : null}
//               </Card>
//             )}
//           />
//          )}
//       </PlanGate>

//       <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
//             <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
//               <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "700" }}>New Diet Plan</Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
//             </View>
//             <Input label="Title *" value={form.title} onChangeText={v => set("title", v)} placeholder="e.g. High Protein Plan" />
//             <Input label="Goal" value={form.goal} onChangeText={v => set("goal", v)} placeholder="Weight loss, Muscle gain..." />
//             <Input label="Calories Target" value={form.caloriesTarget} onChangeText={v => set("caloriesTarget", v)} keyboardType="numeric" placeholder="2000" />
//             <View style={{ flexDirection: "row", gap: Spacing.sm }}>
//               <View style={{ flex: 1 }}><Input label="Protein (g)" value={form.proteinG} onChangeText={v => set("proteinG", v)} keyboardType="numeric" placeholder="150" /></View>
//               <View style={{ flex: 1 }}><Input label="Carbs (g)" value={form.carbsG} onChangeText={v => set("carbsG", v)} keyboardType="numeric" placeholder="200" /></View>
//               <View style={{ flex: 1 }}><Input label="Fat (g)" value={form.fatG} onChangeText={v => set("fatG", v)} keyboardType="numeric" placeholder="60" /></View>
//             </View>
//             <Input label="Duration (weeks)" value={form.durationWeeks} onChangeText={v => set("durationWeeks", v)} keyboardType="numeric" />
//             <TouchableOpacity onPress={() => set("isGlobal", !form.isGlobal)} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
//               <Icon name={form.isGlobal ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={form.isGlobal ? Colors.primary : Colors.textMuted} />
//               <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>Make visible to all members</Text>
//             </TouchableOpacity>
//             <Button label="Create Plan" onPress={() => { if (!form.title.trim()) { Toast.show({ type: "error", text1: "Title required" }); return } addMutation.mutate() }} loading={addMutation.isPending} />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   )
// }

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const DietsScreen = () => {
  return (
    <View>
      <Text>DietsScreen</Text>
    </View>
  );
};

export default DietsScreen;

const styles = StyleSheet.create({});
