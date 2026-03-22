// // mobile/src/screens/owner/SupplementsScreen.tsx
// import React, { useState } from "react"
// import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, RefreshControl } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Toast from "react-native-toast-message"
// import { supplementsApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Card, PlanGate, EmptyState, Input, Button, SkeletonGroup } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"

// function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

// export function OwnerSupplementsScreen() {
//   const qc = useQueryClient()
//   const { hasSupplements } = useSubscription()
//   const [gymId,   setGymId]   = useState("")
//   const [showAdd, setShowAdd] = useState(false)
//   const [showSell,setShowSell]= useState(false)
//   const [sellItem, setSellItem]= useState<any>(null)
//   const [form, setForm] = useState({ gymId: "", name: "", brand: "", category: "", unitSize: "", price: "", costPrice: "", stockQty: "0", lowStockAt: "5" })
//   const [sellForm, setSellForm] = useState({ qty: "1", memberName: "", paymentMethod: "CASH" })

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })
//   const { data: supplements = [], isLoading, refetch, isRefetching } = useQuery({
//     queryKey: ["ownerSupplements", gymId],
//     queryFn:  () => supplementsApi.list({ gymId: gymId || undefined }),
//     enabled:  hasSupplements,
//     staleTime: 60_000,
//   })

//   const addMutation = useMutation({
//     mutationFn: () => supplementsApi.create({ ...form, gymId: form.gymId || gymId || (gyms as any[])[0]?.id, price: parseFloat(form.price), costPrice: form.costPrice ? parseFloat(form.costPrice) : null, stockQty: parseInt(form.stockQty) || 0, lowStockAt: parseInt(form.lowStockAt) || 5 }),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerSupplements"] }); setShowAdd(false); Toast.show({ type: "success", text1: "Supplement added!" }) },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const sellMutation = useMutation({
//     mutationFn: () => supplementsApi.sell({ supplementId: sellItem.id, gymId: sellItem.gymId, qty: parseInt(sellForm.qty) || 1, memberName: sellForm.memberName || undefined, paymentMethod: sellForm.paymentMethod }),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerSupplements"] }); setShowSell(false); setSellItem(null); Toast.show({ type: "success", text1: "Sale recorded! 💰" }) },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const set     = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
//   const setSell = (k: string, v: string) => setSellForm(f => ({ ...f, [k]: v }))

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
//         <Header title="Supplements" back right={
//           hasSupplements ? (
//             <TouchableOpacity style={{ width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" }} onPress={() => setShowAdd(true)}>
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

//       <PlanGate allowed={hasSupplements} featureLabel="Supplement Management">
//         {isLoading ? <View style={{ padding: Spacing.lg }}><SkeletonGroup count={4} itemHeight={80} gap={Spacing.md} /></View> :
//          (supplements as any[]).length === 0 ? (
//           <EmptyState icon="shopping-outline" title="No supplements" subtitle="Add inventory to track and sell" action={
//             <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm }} onPress={() => setShowAdd(true)}>
//               <Icon name="plus" size={16} color="#fff" /><Text style={{ color: "#fff", fontWeight: "700", fontSize: Typography.sm }}>Add Supplement</Text>
//             </TouchableOpacity>
//           } />
//          ) : (
//           <FlatList
//             data={supplements as any[]}
//             keyExtractor={s => s.id}
//             contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
//             showsVerticalScrollIndicator={false}
//             refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
//             ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
//             renderItem={({ item: s }) => (
//               <Card>
//                 <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.md }}>
//                   <View style={{ flex: 1 }}>
//                     <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" }}>{s.name}</Text>
//                     {s.brand ? <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 }}>{s.brand}</Text> : null}
//                     {s.category ? <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 1 }}>{s.category}{s.unitSize ? ` · ${s.unitSize}` : ""}</Text> : null}
//                     <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.lg, marginTop: Spacing.sm }}>
//                       <Text style={{ color: Colors.primary, fontSize: Typography.lg, fontWeight: "800" }}>{fmt(s.price)}</Text>
//                       <Text style={[{ fontSize: Typography.xs, fontWeight: "600" }, s.stockQty <= s.lowStockAt ? { color: Colors.error } : { color: Colors.success }]}>
//                         {s.stockQty <= s.lowStockAt ? "⚠ " : ""}Stock: {s.stockQty}
//                       </Text>
//                     </View>
//                   </View>
//                   <TouchableOpacity
//                     style={{ backgroundColor: Colors.primaryFaded, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + "40" }}
//                     onPress={() => { setSellItem(s); setSellForm({ qty: "1", memberName: "", paymentMethod: "CASH" }); setShowSell(true) }}
//                   >
//                     <Text style={{ color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" }}>Sell</Text>
//                   </TouchableOpacity>
//                 </View>
//               </Card>
//             )}
//           />
//          )}
//       </PlanGate>

//       {/* Add Supplement Modal */}
//       <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
//             <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
//               <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "700" }}>Add Supplement</Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
//             </View>
//             <Input label="Name *"       value={form.name}      onChangeText={v => set("name", v)}      placeholder="e.g. Whey Protein" />
//             <Input label="Brand"        value={form.brand}     onChangeText={v => set("brand", v)}     placeholder="e.g. MuscleBlaze" />
//             <Input label="Category"     value={form.category}  onChangeText={v => set("category", v)}  placeholder="Protein, Creatine..." />
//             <Input label="Unit Size"    value={form.unitSize}  onChangeText={v => set("unitSize", v)}  placeholder="1kg, 60 caps..." />
//             <Input label="Price (₹) *" value={form.price}     onChangeText={v => set("price", v)}     keyboardType="numeric" />
//             <Input label="Cost Price"   value={form.costPrice} onChangeText={v => set("costPrice", v)} keyboardType="numeric" />
//             <Input label="Stock Qty"    value={form.stockQty}  onChangeText={v => set("stockQty", v)}  keyboardType="numeric" />
//             <Input label="Low Stock Alert" value={form.lowStockAt} onChangeText={v => set("lowStockAt", v)} keyboardType="numeric" />
//             <Button label="Add Supplement" onPress={() => { if (!form.name.trim() || !form.price) { Toast.show({ type: "error", text1: "Name and price required" }); return } addMutation.mutate() }} loading={addMutation.isPending} />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>

//       {/* Sell Modal */}
//       <Modal visible={showSell} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSell(false)}>
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
//             <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm }}>
//               <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: "700" }}>Sell {sellItem?.name}</Text>
//               <TouchableOpacity onPress={() => setShowSell(false)}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
//             </View>
//             {sellItem ? <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>{fmt(sellItem.price)} · Stock: {sellItem.stockQty}</Text> : null}
//             <Input label="Quantity" value={sellForm.qty} onChangeText={v => setSell("qty", v)} keyboardType="numeric" />
//             <Input label="Member Name (optional)" value={sellForm.memberName} onChangeText={v => setSell("memberName", v)} placeholder="Walk-in customer" />
//             <View>
//               <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500", marginBottom: 8 }}>Payment Method</Text>
//               <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
//                 {["CASH", "UPI", "CARD"].map(m => (
//                   <TouchableOpacity key={m} onPress={() => setSell("paymentMethod", m)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: sellForm.paymentMethod === m ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: sellForm.paymentMethod === m ? Colors.primary : Colors.border }}>
//                     <Text style={{ color: sellForm.paymentMethod === m ? Colors.primary : Colors.textMuted, fontSize: Typography.xs }}>{m}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//             {sellItem ? <Text style={{ color: Colors.primary, fontSize: Typography.lg, fontWeight: "700" }}>Total: {fmt(sellItem.price * (parseInt(sellForm.qty) || 1))}</Text> : null}
//             <Button label="Confirm Sale" onPress={() => sellMutation.mutate()} loading={sellMutation.isPending} />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   )
// }

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const SupplementsScreen = () => {
  return (
    <View>
      <Text>SupplementsScreen</Text>
    </View>
  );
};

export default SupplementsScreen;

const styles = StyleSheet.create({});
