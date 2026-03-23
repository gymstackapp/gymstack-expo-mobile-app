// // mobile/src/screens/owner/TrainersScreen.tsx
// import React, { useState } from "react"
// import {
//   View, Text, FlatList, TouchableOpacity,
//   StyleSheet, RefreshControl, TextInput,
// } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useNavigation } from "@react-navigation/native"
// import { useQuery } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import { trainersApi, gymsApi } from "@/api/endpoints"
// import { useSubscription } from "@/hooks/useSubscription"
// import { Avatar, EmptyState, SkeletonGroup, Header } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"
// import type { Trainer, Gym } from "@/types/api"

// export function OwnerTrainersScreen() {
//   const navigation = useNavigation()
//   const { canAddTrainer, usage, limits } = useSubscription()
//   const [gymId,  setGymId]  = useState("")
//   const [search, setSearch] = useState("")

//   const { data: gyms = [] } = useQuery<Gym[]>({
//     queryKey: ["ownerGyms"],
//     queryFn:  () => gymsApi.list() as Promise<Gym[]>,
//     staleTime: 5 * 60_000,
//   })

//   const { data: trainers = [], isLoading, refetch, isRefetching } = useQuery<Trainer[]>({
//     queryKey: ["ownerTrainers", gymId],
//     queryFn:  () => trainersApi.list({ gymId: gymId || undefined }) as Promise<Trainer[]>,
//     staleTime: 60_000,
//   })

//   const filtered = trainers.filter(t =>
//     !search || t.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
//   )

//   const atLimit = !canAddTrainer && limits?.maxTrainers !== null

//   return (
//     <SafeAreaView style={s.safe}>
//       <View style={s.top}>
//         <Header
//           title="Trainers"
//           subtitle={`${trainers.length} total`}
//           back
//           right={
//             atLimit ? (
//               <TouchableOpacity
//                 style={s.limitBadge}
//                 onPress={() => (navigation as any).navigate("OwnerBilling")}
//               >
//                 <Icon name="lock-outline" size={13} color={Colors.warning} />
//                 <Text style={s.limitText}>{usage?.trainers}/{limits?.maxTrainers}</Text>
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity
//                 style={s.addBtn}
//                 onPress={() => (navigation as any).navigate("OwnerAddTrainer")}
//               >
//                 <Icon name="plus" size={20} color="#fff" />
//               </TouchableOpacity>
//             )
//           }
//         />

//         <View style={s.searchBox}>
//           <Icon name="magnify" size={18} color={Colors.textMuted} />
//           <TextInput
//             value={search}
//             onChangeText={setSearch}
//             placeholder="Search trainers..."
//             placeholderTextColor={Colors.textMuted}
//             style={s.searchInput}
//           />
//         </View>

//         {gyms.length > 1 && (
//           <View style={s.filterRow}>
//             {[{ id: "", name: "All Gyms" } as Gym, ...gyms].map(g => (
//               <TouchableOpacity
//                 key={g.id}
//                 onPress={() => setGymId(g.id)}
//                 style={[s.pill, gymId === g.id && s.pillActive]}
//               >
//                 <Text
//                   style={[s.pillText, gymId === g.id && s.pillTextActive]}
//                   numberOfLines={1}
//                 >
//                   {g.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
//       </View>

//       {isLoading ? (
//         <View style={{ padding: Spacing.lg }}>
//           <SkeletonGroup variant="listRow" count={4} />
//         </View>
//       ) : filtered.length === 0 ? (
//         <EmptyState
//           icon="account-tie-outline"
//           title="No trainers yet"
//           subtitle="Add your first trainer"
//           action={
//             !atLimit ? (
//               <TouchableOpacity
//                 style={s.emptyAction}
//                 onPress={() => (navigation as any).navigate("OwnerAddTrainer")}
//               >
//                 <Icon name="plus" size={16} color="#fff" />
//                 <Text style={s.emptyActionText}>Add Trainer</Text>
//               </TouchableOpacity>
//             ) : undefined
//           }
//         />
//       ) : (
//         <FlatList<Trainer>
//           data={filtered}
//           keyExtractor={t => t.id}
//           contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, paddingBottom: 32 }}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefetching}
//               onRefresh={refetch}
//               tintColor={Colors.primary}
//               colors={[Colors.primary]}
//             />
//           }
//           ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
//           renderItem={({ item: t }) => (
//             <View style={s.row}>
//               <Avatar name={t.profile?.fullName} url={t.profile?.avatarUrl} size={44} />
//               <View style={{ flex: 1 }}>
//                 <Text style={s.name}>{t.profile?.fullName}</Text>
//                 <Text style={s.sub}>
//                   {t.gym?.name} · {t._count?.assignedMembers ?? 0} members
//                 </Text>
//                 {t.specializations?.length > 0 && (
//                   <Text style={s.specs} numberOfLines={1}>
//                     {t.specializations.join(", ")}
//                   </Text>
//                 )}
//               </View>
//               {t.rating > 0 && (
//                 <View style={s.rating}>
//                   <Icon name="star" size={12} color={Colors.warning} />
//                   <Text style={s.ratingText}>{Number(t.rating).toFixed(1)}</Text>
//                 </View>
//               )}
//             </View>
//           )}
//         />
//       )}
//     </SafeAreaView>
//   )
// }

// const s = StyleSheet.create({
//   safe:       { flex: 1, backgroundColor: Colors.bg },
//   top:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md },
//   addBtn:     { width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
//   limitBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.warningFaded, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.warning + "40" },
//   limitText:  { color: Colors.warning, fontSize: Typography.xs, fontWeight: "600" },
//   searchBox:  { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 44 },
//   searchInput:{ flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, paddingVertical: 0 },
//   filterRow:  { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
//   pill:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border },
//   pillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
//   pillText:   { color: Colors.textMuted, fontSize: Typography.xs },
//   pillTextActive: { color: Colors.primary, fontWeight: "700" },
//   row:        { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.md },
//   name:       { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "600" },
//   sub:        { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   specs:      { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 1 },
//   rating:     { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.warningFaded, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
//   ratingText: { color: Colors.warning, fontSize: Typography.xs, fontWeight: "600" },
//   emptyAction:{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
//   emptyActionText: { color: "#fff", fontWeight: "700", fontSize: Typography.sm },
// })

import { Header } from "@/components";
import { Colors, Spacing } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TrainersScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Header menu title="Trainers" />
      </View>
      <View style={styles.center}>
        <Text style={styles.placeholder}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
};

export default TrainersScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholder: { color: Colors.textMuted },
});
