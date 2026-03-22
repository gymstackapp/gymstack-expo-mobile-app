// // mobile/src/screens/owner/WorkoutsScreen.tsx
// import React, { useState } from "react"
// import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, StyleSheet, RefreshControl } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Toast from "react-native-toast-message"
// import { workoutsApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, Badge, PlanGate, EmptyState, Input, Button, SkeletonGroup } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
// const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = { BEGINNER: "success", INTERMEDIATE: "warning", ADVANCED: "error" }

// export function OwnerWorkoutsScreen() {
//   const qc  = useQueryClient()
//   const { hasWorkoutPlans } = useSubscription()
//   const [gymId,   setGymId]   = useState("")
//   const [showAdd, setShowAdd] = useState(false)
//   const [form, setForm] = useState({ gymId: "", title: "", goal: "", difficulty: "BEGINNER", durationWeeks: "4", isGlobal: false })

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })
//   const { data: plans = [], isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerWorkouts", gymId],
//     queryFn:  () => workoutsApi.list({ gymId: gymId || undefined }),
//     enabled:  hasWorkoutPlans,
//     staleTime: 60_000,
//   })

//   const addMutation = useMutation({
//     mutationFn: () => workoutsApi.create({ ...form, gymId: form.gymId || gymId || (gyms as any[])[0]?.id, durationWeeks: parseInt(form.durationWeeks) }),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerWorkouts"] }); setShowAdd(false); Toast.show({ type: "success", text1: "Workout plan created!" }) },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
//         <Header title="Workout Plans" back right={
//           hasWorkoutPlans ? (
//             <TouchableOpacity style={{ width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" }} onPress={() => setShowAdd(true)}>
//               <Icon name="plus" size={20} color="#fff" />
//             </TouchableOpacity>
//           ) : null
//         } />
//         {/* {gyms.length > 1 && (
//           <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
//             {[{ id: "", name: "All" }, ...(gyms as any[])].map((g: any) => (
//               <TouchableOpacity key={g.id} onPress={() => setGymId(g.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: gymId === g.id ? Colors.primary : Colors.border }}>
//                 <Text style={{ color: gymId === g.id ? Colors.primary : Colors.textMuted, fontSize: Typography.xs, fontWeight: gymId === g.id ? "700" : "400" }}>{g.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )} */}
//       </View>
//       <PlanGate allowed={hasWorkoutPlans} featureLabel="Workout Plans">
//         {isLoading ? <View style={{ padding: Spacing.lg }}><SkeletonGroup count={4} itemHeight={80} gap={Spacing.md} /></View> :
//          (plans as any[]).length === 0 ? (
//           <EmptyState icon="clipboard-list-outline" title="No workout plans" subtitle="Create plans for your members"
//             action={<TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm }} onPress={() => setShowAdd(true)}><Icon name="plus" size={16} color="#fff" /><Text style={{ color: "#fff", fontWeight: "700", fontSize: Typography.sm }}>New Plan</Text></TouchableOpacity>}
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
//                 <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm }}>
//                   <View style={{ flex: 1 }}>
//                     <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" }}>{p.title ?? "Untitled Plan"}</Text>
//                     <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 }}>{p.gym?.name} · {p.durationWeeks}w</Text>
//                     {p.goal ? <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 }}>{p.goal}</Text> : null}
//                     {p.assignedMember ? <Text style={{ color: Colors.primary, fontSize: Typography.xs, marginTop: 2 }}>→ {p.assignedMember?.profile?.fullName}</Text> : p.isGlobal ? <Text style={{ color: Colors.info, fontSize: Typography.xs, marginTop: 2 }}>Global Plan</Text> : null}
//                   </View>
//                   <Badge label={p.difficulty ?? "BEGINNER"} variant={DIFF_VARIANT[p.difficulty] ?? "default"} />
//                 </View>
//               </Card>
//             )}
//           />
//          )}
//       </PlanGate>

//       <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
//             <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
//               <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "700" }}>New Workout Plan</Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
//             </View>
//             {/* {gyms.length > 1 && (
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
//             <Input label="Title *" value={form.title} onChangeText={v => set("title", v)} placeholder="e.g. 4-Week Fat Loss Plan" />
//             <Input label="Goal" value={form.goal} onChangeText={v => set("goal", v)} placeholder="Weight loss, Muscle gain..." />
//             <View>
//               <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500", marginBottom: 8 }}>Difficulty</Text>
//               <View style={{ flexDirection: "row", gap: Spacing.xs }}>
//                 {DIFFICULTIES.map(d => (
//                   <TouchableOpacity key={d} onPress={() => set("difficulty", d)} style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: Radius.lg, backgroundColor: form.difficulty === d ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: form.difficulty === d ? Colors.primary : Colors.border }}>
//                     <Text style={{ color: form.difficulty === d ? Colors.primary : Colors.textMuted, fontSize: Typography.xs, fontWeight: form.difficulty === d ? "700" : "400" }}>{d.charAt(0) + d.slice(1).toLowerCase()}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
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

const WorkoutsScreen = () => {
  return (
    <View>
      <Text>WorkoutsScreen</Text>
    </View>
  );
};

export default WorkoutsScreen;

const styles = StyleSheet.create({});
