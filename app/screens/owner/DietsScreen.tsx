// // mobile/src/screens/owner/DietsScreen.tsx
// import { dietsApi, gymsApi } from "@/api/endpoints";
// import {
//   Button,
//   Card,
//   EmptyState,
//   Header,
//   Input,
//   PlanGate,
//   SkeletonGroup,
// } from "@/components";
// import { useSubscription } from "@/hooks/useSubsciption";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import React, { useState } from "react";
// import {
//   FlatList,
//   Modal,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// export default function OwnerDietsScreen() {
//   const qc = useQueryClient();
//   const { hasDietPlans } = useSubscription();
//   const [gymId, setGymId] = useState("");
//   const [showAdd, setShowAdd] = useState(false);
//   const [form, setForm] = useState({
//     gymId: "",
//     title: "",
//     goal: "",
//     caloriesTarget: "",
//     proteinG: "",
//     carbsG: "",
//     fatG: "",
//     durationWeeks: "4",
//     isGlobal: false,
//   });

//   const { data: gyms = [] } = useQuery({
//     queryKey: ["ownerGyms"],
//     queryFn: gymsApi.list,
//     staleTime: 5 * 60_000,
//   });
//   const {
//     data: plans = [],
//     isLoading,
//     refetch,
//     isRefetching,
//   } = useQuery({
//     queryKey: ["ownerDiets", gymId],
//     queryFn: () => dietsApi.list({ gymId: gymId || undefined }),
//     enabled: hasDietPlans,
//     staleTime: 60_000,
//   });

//   const addMutation = useMutation({
//     mutationFn: () =>
//       dietsApi.create({
//         ...form,
//         gymId: form.gymId || gymId || (gyms as any[])[0]?.id,
//         durationWeeks: parseInt(form.durationWeeks) || 4,
//         caloriesTarget: form.caloriesTarget
//           ? parseInt(form.caloriesTarget)
//           : null,
//         proteinG: form.proteinG || null,
//         carbsG: form.carbsG || null,
//         fatG: form.fatG || null,
//       }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerDiets"] });
//       setShowAdd(false);
//       Toast.show({ type: "success", text1: "Diet plan created!" });
//     },
//     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
//   });

//   const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//       <View
//         style={{
//           paddingHorizontal: Spacing.lg,
//           paddingTop: Spacing.lg,
//           gap: Spacing.md,
//         }}
//       >
//         <Header
//           title="Diet Plans"
//           menu
//           right={
//             hasDietPlans ? (
//               <TouchableOpacity
//                 style={{
//                   width: 38,
//                   height: 38,
//                   borderRadius: Radius.lg,
//                   backgroundColor: Colors.success,
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//                 onPress={() => setShowAdd(true)}
//               >
//                 <Icon name="plus" size={20} color="#fff" />
//               </TouchableOpacity>
//             ) : null
//           }
//         />
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
//         {isLoading ? (
//           <View style={{ padding: Spacing.lg }}>
//             <SkeletonGroup count={3} itemHeight={80} gap={Spacing.md} />
//           </View>
//         ) : (plans as any[]).length === 0 ? (
//           <EmptyState
//             icon="food-apple-outline"
//             title="No diet plans"
//             subtitle="Create nutrition plans for your members"
//             action={
//               <TouchableOpacity
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   gap: Spacing.sm,
//                   backgroundColor: Colors.success,
//                   borderRadius: Radius.lg,
//                   paddingHorizontal: Spacing.xl,
//                   paddingVertical: Spacing.md,
//                   marginTop: Spacing.sm,
//                 }}
//                 onPress={() => setShowAdd(true)}
//               >
//                 <Icon name="plus" size={16} color="#fff" />
//                 <Text
//                   style={{
//                     color: "#fff",
//                     fontWeight: "700",
//                     fontSize: Typography.sm,
//                   }}
//                 >
//                   New Plan
//                 </Text>
//               </TouchableOpacity>
//             }
//           />
//         ) : (
//           <FlatList
//             data={plans as any[]}
//             keyExtractor={(p) => p.id}
//             contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl
//                 refreshing={isRefetching}
//                 onRefresh={refetch}
//                 tintColor={Colors.primary}
//                 colors={[Colors.primary]}
//               />
//             }
//             ItemSeparatorComponent={() => (
//               <View style={{ height: Spacing.md }} />
//             )}
//             renderItem={({ item: p }) => (
//               <Card>
//                 <Text
//                   style={{
//                     color: Colors.textPrimary,
//                     fontSize: Typography.base,
//                     fontWeight: "700",
//                   }}
//                 >
//                   {p.title ?? "Diet Plan"}
//                 </Text>
//                 <Text
//                   style={{
//                     color: Colors.textMuted,
//                     fontSize: Typography.xs,
//                     marginTop: 2,
//                   }}
//                 >
//                   {p.gym?.name} · {p.durationWeeks}w
//                 </Text>
//                 {p.goal ? (
//                   <Text
//                     style={{
//                       color: Colors.textSecondary,
//                       fontSize: Typography.xs,
//                       marginTop: 2,
//                     }}
//                   >
//                     {p.goal}
//                   </Text>
//                 ) : null}
//                 {p.caloriesTarget ? (
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       gap: Spacing.lg,
//                       marginTop: Spacing.sm,
//                     }}
//                   >
//                     <View>
//                       <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//                         Calories
//                       </Text>
//                       <Text
//                         style={{
//                           color: Colors.primary,
//                           fontSize: Typography.sm,
//                           fontWeight: "700",
//                         }}
//                       >
//                         {p.caloriesTarget}
//                       </Text>
//                     </View>
//                     {p.proteinG ? (
//                       <View>
//                         <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//                           Protein
//                         </Text>
//                         <Text
//                           style={{
//                             color: Colors.success,
//                             fontSize: Typography.sm,
//                             fontWeight: "700",
//                           }}
//                         >
//                           {p.proteinG}g
//                         </Text>
//                       </View>
//                     ) : null}
//                     {p.carbsG ? (
//                       <View>
//                         <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//                           Carbs
//                         </Text>
//                         <Text
//                           style={{
//                             color: Colors.warning,
//                             fontSize: Typography.sm,
//                             fontWeight: "700",
//                           }}
//                         >
//                           {p.carbsG}g
//                         </Text>
//                       </View>
//                     ) : null}
//                     {p.fatG ? (
//                       <View>
//                         <Text style={{ color: Colors.textMuted, fontSize: 10 }}>
//                           Fat
//                         </Text>
//                         <Text
//                           style={{
//                             color: Colors.error,
//                             fontSize: Typography.sm,
//                             fontWeight: "700",
//                           }}
//                         >
//                           {p.fatG}g
//                         </Text>
//                       </View>
//                     ) : null}
//                   </View>
//                 ) : null}
//                 {p.assignedMember ? (
//                   <Text
//                     style={{
//                       color: Colors.primary,
//                       fontSize: Typography.xs,
//                       marginTop: 6,
//                     }}
//                   >
//                     → {p.assignedMember?.profile?.fullName}
//                   </Text>
//                 ) : p.isGlobal ? (
//                   <Text
//                     style={{
//                       color: Colors.info,
//                       fontSize: Typography.xs,
//                       marginTop: 6,
//                     }}
//                   >
//                     Global Plan
//                   </Text>
//                 ) : null}
//               </Card>
//             )}
//           />
//         )}
//       </PlanGate>

//       <Modal
//         visible={showAdd}
//         animationType="slide"
//         presentationStyle="pageSheet"
//         onRequestClose={() => setShowAdd(false)}
//       >
//         <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
//           <ScrollView
//             contentContainerStyle={{
//               padding: Spacing.lg,
//               paddingBottom: 40,
//               gap: Spacing.md,
//             }}
//             keyboardShouldPersistTaps="handled"
//           >
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: Spacing.sm,
//               }}
//             >
//               <Text
//                 style={{
//                   color: Colors.textPrimary,
//                   fontSize: Typography.xl,
//                   fontWeight: "700",
//                 }}
//               >
//                 New Diet Plan
//               </Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}>
//                 <Icon name="close" size={22} color={Colors.textMuted} />
//               </TouchableOpacity>
//             </View>
//             <Input
//               label="Title *"
//               value={form.title}
//               onChangeText={(v) => set("title", v)}
//               placeholder="e.g. High Protein Plan"
//             />
//             <Input
//               label="Goal"
//               value={form.goal}
//               onChangeText={(v) => set("goal", v)}
//               placeholder="Weight loss, Muscle gain..."
//             />
//             <Input
//               label="Calories Target"
//               value={form.caloriesTarget}
//               onChangeText={(v) => set("caloriesTarget", v)}
//               keyboardType="numeric"
//               placeholder="2000"
//             />
//             <View style={{ flexDirection: "row", gap: Spacing.sm }}>
//               <View style={{ flex: 1 }}>
//                 <Input
//                   label="Protein (g)"
//                   value={form.proteinG}
//                   onChangeText={(v) => set("proteinG", v)}
//                   keyboardType="numeric"
//                   placeholder="150"
//                 />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input
//                   label="Carbs (g)"
//                   value={form.carbsG}
//                   onChangeText={(v) => set("carbsG", v)}
//                   keyboardType="numeric"
//                   placeholder="200"
//                 />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input
//                   label="Fat (g)"
//                   value={form.fatG}
//                   onChangeText={(v) => set("fatG", v)}
//                   keyboardType="numeric"
//                   placeholder="60"
//                 />
//               </View>
//             </View>
//             <Input
//               label="Duration (weeks)"
//               value={form.durationWeeks}
//               onChangeText={(v) => set("durationWeeks", v)}
//               keyboardType="numeric"
//             />
//             <TouchableOpacity
//               onPress={() => set("isGlobal", !form.isGlobal)}
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 gap: Spacing.md,
//               }}
//             >
//               <Icon
//                 name={
//                   form.isGlobal ? "checkbox-marked" : "checkbox-blank-outline"
//                 }
//                 size={22}
//                 color={form.isGlobal ? Colors.primary : Colors.textMuted}
//               />
//               <Text
//                 style={{ color: Colors.textSecondary, fontSize: Typography.sm }}
//               >
//                 Make visible to all members
//               </Text>
//             </TouchableOpacity>
//             <Button
//               label="Create Plan"
//               onPress={() => {
//                 if (!form.title.trim()) {
//                   Toast.show({ type: "error", text1: "Title required" });
//                   return;
//                 }
//                 addMutation.mutate();
//               }}
//               loading={addMutation.isPending}
//             />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// mobile/src/screens/owner/DietsScreen.tsx
// List view only — create/edit handled by AddDietPlanScreen.
import { dietsApi, gymsApi } from "@/api/endpoints";
import {
  Card,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { DietPlan, Gym } from "@/types/api";
import { useNavigation } from "@react-navigation/native";
import { showAlert } from "@/components/AppAlert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function MacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={[
        mc.chip,
        { backgroundColor: color + "20", borderColor: color + "40" },
      ]}
    >
      <Text style={[mc.val, { color }]}>{value}</Text>
      <Text style={mc.lbl}>{label}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 52,
  },
  val: { fontSize: Typography.xs, fontWeight: "700" },
  lbl: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
});

export default function OwnerDietsScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { hasDietPlans } = useSubscription();
  const [gymId, setGymId] = useState("");

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<DietPlan[]>({
    queryKey: ["ownerDiets", gymId],
    queryFn: () =>
      dietsApi.list({ gymId: gymId || undefined }) as Promise<DietPlan[]>,
    enabled: hasDietPlans,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dietsApi.update(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerDiets"] });
      Toast.show({ type: "success", text1: "Plan archived" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmDelete = (plan: DietPlan) => {
    showAlert("Archive Plan", `Archive "${plan.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => deleteMutation.mutate(plan.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Header
          title="Diet Plans"
          back
          right={
            hasDietPlans ? (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => (navigation as any).navigate("OwnerAddDietPlan")}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {gyms.length > 1 && (
          <View style={s.filterRow}>
            {[{ id: "", name: "All" } as Gym, ...gyms].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[s.pill, gymId === g.id && s.pillActive]}
              >
                <Text style={[s.pillText, gymId === g.id && s.pillTextActive]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PlanGate allowed={hasDietPlans} featureLabel="Diet Plans">
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup
              variant="card"
              count={3}
              itemHeight={120}
              gap={Spacing.md}
            />
          </View>
        ) : plans.length === 0 ? (
          <EmptyState
            icon="food-apple-outline"
            title="No diet plans"
            subtitle="Create nutrition plans for your members"
            action={
              <TouchableOpacity
                style={s.emptyAction}
                onPress={() => (navigation as any).navigate("OwnerAddDietPlan")}
              >
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyActionText}>Create First Plan</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <FlatList<DietPlan>
            data={plans}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.md }} />
            )}
            renderItem={({ item: p }) => {
              const totalItems = Object.values(
                (p as any).planData ?? {},
              ).reduce(
                (s: number, items: unknown) => s + (items as unknown[]).length,
                0,
              );

              return (
                <Card>
                  {/* Badges row */}
                  <View style={s.badgesRow}>
                    {p.isGlobal && (
                      <View style={s.badge}>
                        <Text style={[s.badgeText, { color: Colors.purple }]}>
                          All Members
                        </Text>
                      </View>
                    )}
                    {p.isTemplate && (
                      <View
                        style={[
                          s.badge,
                          {
                            backgroundColor: Colors.infoFaded,
                            borderColor: Colors.info + "40",
                          },
                        ]}
                      >
                        <Text style={[s.badgeText, { color: Colors.info }]}>
                          Template
                        </Text>
                      </View>
                    )}
                    {p.caloriesTarget ? (
                      <View
                        style={[
                          s.badge,
                          {
                            backgroundColor: Colors.primaryFaded,
                            borderColor: Colors.primary + "40",
                          },
                        ]}
                      >
                        <Icon name="fire" size={10} color={Colors.primary} />
                        <Text style={[s.badgeText, { color: Colors.primary }]}>
                          {p.caloriesTarget} kcal
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={s.planTitle}>{p.title ?? "Diet Plan"}</Text>
                  {p.goal ? <Text style={s.planGoal}>🎯 {p.goal}</Text> : null}

                  {/* Macros */}
                  {p.proteinG || p.carbsG || p.fatG ? (
                    <View style={s.macroRow}>
                      {p.proteinG ? (
                        <MacroChip
                          label="Protein"
                          value={`${p.proteinG}g`}
                          color={Colors.info}
                        />
                      ) : null}
                      {p.carbsG ? (
                        <MacroChip
                          label="Carbs"
                          value={`${p.carbsG}g`}
                          color={Colors.warning}
                        />
                      ) : null}
                      {p.fatG ? (
                        <MacroChip
                          label="Fat"
                          value={`${p.fatG}g`}
                          color={Colors.error}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  {/* Stats */}
                  <View style={s.statsRow}>
                    <Text style={s.planMeta}>{p.gym?.name}</Text>
                    {totalItems > 0 ? (
                      <Text style={s.planMeta}>
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </Text>
                    ) : null}
                    {p.assignedMember ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Icon
                          name="account-outline"
                          size={11}
                          color={Colors.success}
                        />
                        <Text style={[s.planMeta, { color: Colors.success }]}>
                          {p.assignedMember.profile?.fullName}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() =>
                        (navigation as any).navigate("OwnerAddDietPlan", {
                          planId: p.id,
                        })
                      }
                    >
                      <Icon
                        name="pencil-outline"
                        size={14}
                        color={Colors.success}
                      />
                      <Text style={[s.actionText, { color: Colors.success }]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() =>
                        (navigation as any).navigate("OwnerAddDietPlan", {
                          planId: `copy_${p.id}`,
                        })
                      }
                    >
                      <Icon
                        name="content-copy"
                        size={14}
                        color={Colors.textMuted}
                      />
                      <Text style={s.actionText}>Duplicate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => confirmDelete(p)}
                    >
                      <Icon
                        name="archive-outline"
                        size={14}
                        color={Colors.error}
                      />
                      <Text style={[s.actionText, { color: Colors.error }]}>
                        Archive
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </PlanGate>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  pillText: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTextActive: { color: Colors.primary, fontWeight: "700" },
  list: { padding: Spacing.lg, paddingBottom: 32 },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.purpleFaded,
    borderWidth: 1,
    borderColor: Colors.purple + "30",
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: 3,
  },
  planGoal: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.sm,
  },
  macroRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.sm,
  },
});
