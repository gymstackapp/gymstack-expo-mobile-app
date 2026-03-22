// // mobile/src/screens/owner/AddTrainerScreen.tsx
// import React, { useState } from "react"
// import { ScrollView, StyleSheet } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useNavigation } from "@react-navigation/native"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Toast from "react-native-toast-message"
// import { trainersApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Header, Input, Button, Card, PlanGate } from "@/components/common"
// import { Colors, Spacing } from "@/theme"
// import { TouchableOpacity, View, Text } from "react-native"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import { Radius, Typography } from "@/theme"

// const SPECIALIZATIONS = ["Strength", "Cardio", "Yoga", "Nutrition", "CrossFit", "Pilates", "Boxing", "Zumba", "Rehabilitation"]

// export function OwnerAddTrainerScreen() {
//   const navigation = useNavigation()
//   const qc         = useQueryClient()
//   const { canAddTrainer } = useSubscription()
//   const [form, setForm] = useState({ gymId: "", fullName: "", email: "", mobileNumber: "", city: "", specializations: [] as string[], experienceYears: "0", bio: "" })
//   const [errors, setErrors] = useState<Record<string, string>>({})

//   const { data: gyms = [] } = useQuery({ queryKey: ["ownerGyms"], queryFn: gymsApi.list, staleTime: 5 * 60_000 })

//   const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: "" })) }
//   const toggleSpec = (spec: string) => setForm(f => ({ ...f, specializations: f.specializations.includes(spec) ? f.specializations.filter(s => s !== spec) : [...f.specializations, spec] }))

//   const mutation = useMutation({
//     mutationFn: () => trainersApi.create({ ...form, experienceYears: parseInt(form.experienceYears) || 0 }),
//     onSuccess: () => { qc.invalidateQueries({ queryKey: ["ownerTrainers"] }); qc.invalidateQueries({ queryKey: ["ownerSubscription"] }); Toast.show({ type: "success", text1: "Trainer added!" }); navigation.goBack() },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message ?? "Failed to add trainer" }),
//   })

//   const validate = () => {
//     const e: Record<string, string> = {}
//     if (!form.gymId)            e.gymId    = "Select a gym"
//     if (!form.fullName.trim())  e.fullName = "Name required"
//     if (!form.email.trim())     e.email    = "Email required"
//     if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile required"
//     setErrors(e)
//     return Object.keys(e).length === 0
//   }

//   const gymOptions = (gyms as any[]).map((g: any) => ({ label: g.name, value: g.id }))

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <PlanGate allowed={canAddTrainer} featureLabel="Add Trainer">
//         <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
//           <Header title="Add Trainer" back />
//           <Card>
//             <View style={{ marginBottom: Spacing.md }}>
//               <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500", marginBottom: 6 }}>Gym *</Text>
//               <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
//                 {gymOptions.map(o => (
//                   <TouchableOpacity key={o.value} onPress={() => set("gymId", o.value)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: form.gymId === o.value ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: form.gymId === o.value ? Colors.primary : Colors.border }}>
//                     <Text style={{ color: form.gymId === o.value ? Colors.primary : Colors.textMuted, fontSize: Typography.xs, fontWeight: form.gymId === o.value ? "700" : "400" }}>{o.label}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//               {errors.gymId ? <Text style={{ color: Colors.error, fontSize: Typography.xs, marginTop: 4 }}>{errors.gymId}</Text> : null}
//             </View>
//             <Input label="Full Name *" value={form.fullName} onChangeText={v => set("fullName", v)} placeholder="Trainer's full name" leftIcon="account-outline" error={errors.fullName} />
//             <Input label="Email *" value={form.email} onChangeText={v => set("email", v)} placeholder="trainer@email.com" keyboardType="email-address" leftIcon="email-outline" error={errors.email} />
//             <Input label="Mobile Number *" value={form.mobileNumber} onChangeText={v => set("mobileNumber", v)} placeholder="+91 98765 43210" keyboardType="phone-pad" leftIcon="phone-outline" error={errors.mobileNumber} />
//             <Input label="City" value={form.city} onChangeText={v => set("city", v)} placeholder="City" leftIcon="city-variant-outline" />
//             <Input label="Experience (years)" value={form.experienceYears} onChangeText={v => set("experienceYears", v)} keyboardType="numeric" leftIcon="briefcase-outline" />
//             <Input label="Bio" value={form.bio} onChangeText={v => set("bio", v)} placeholder="Brief bio..." multiline numberOfLines={3} />
//           </Card>
//           <View>
//             <Text style={{ color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500", marginBottom: 8, letterSpacing: 0.3 }}>Specializations</Text>
//             <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
//               {SPECIALIZATIONS.map(spec => {
//                 const active = form.specializations.includes(spec)
//                 return (
//                   <TouchableOpacity key={spec} onPress={() => toggleSpec(spec)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: active ? Colors.primaryFaded : Colors.surfaceRaised, borderWidth: 1, borderColor: active ? Colors.primary : Colors.border }}>
//                     <Text style={{ color: active ? Colors.primary : Colors.textMuted, fontSize: Typography.xs, fontWeight: active ? "700" : "400" }}>{spec}</Text>
//                   </TouchableOpacity>
//                 )
//               })}
//             </View>
//           </View>
//           <Button label="Add Trainer" onPress={() => { if (validate()) mutation.mutate() }} loading={mutation.isPending} />
//         </ScrollView>
//       </PlanGate>
//     </SafeAreaView>
//   )
// }

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const AddTrainerScreen = () => {
  return (
    <View>
      <Text>AddTrainerScreen</Text>
    </View>
  );
};

export default AddTrainerScreen;

const styles = StyleSheet.create({});
