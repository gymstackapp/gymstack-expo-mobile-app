// // mobile/src/screens/owner/WorkoutsScreen.tsx
// import { gymsApi, workoutsApi } from "@/api/endpoints";
// import {
//   Badge,
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
//   View
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
// const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
//   BEGINNER: "success",
//   INTERMEDIATE: "warning",
//   ADVANCED: "error",
// };

// export default function OwnerWorkoutsScreen() {
//   const qc = useQueryClient();
//   const { hasWorkoutPlans } = useSubscription();
//   const [gymId, setGymId] = useState("");
//   const [showAdd, setShowAdd] = useState(false);
//   const [form, setForm] = useState({
//     gymId: "",
//     title: "",
//     goal: "",
//     difficulty: "BEGINNER",
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
//     queryKey: ["ownerWorkouts", gymId],
//     queryFn: () => workoutsApi.list({ gymId: gymId || undefined }),
//     enabled: hasWorkoutPlans,
//     staleTime: 60_000,
//   });

//   const addMutation = useMutation({
//     mutationFn: () =>
//       workoutsApi.create({
//         ...form,
//         gymId: form.gymId || gymId || (gyms as any[])[0]?.id,
//         durationWeeks: parseInt(form.durationWeeks),
//       }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
//       setShowAdd(false);
//       Toast.show({ type: "success", text1: "Workout plan created!" });
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
//           title="Workout Plans"
//           menu
//           right={
//             hasWorkoutPlans ? (
//               <TouchableOpacity
//                 style={{
//                   width: 38,
//                   height: 38,
//                   borderRadius: Radius.lg,
//                   backgroundColor: Colors.primary,
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
//         {gyms.length > 1 && (
//           <View
//             style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}
//           >
//             {[{ id: "", name: "All" }, ...(gyms as any[])].map((g: any) => (
//               <TouchableOpacity
//                 key={g.id}
//                 onPress={() => setGymId(g.id)}
//                 style={{
//                   paddingHorizontal: 12,
//                   paddingVertical: 6,
//                   borderRadius: Radius.full,
//                   backgroundColor:
//                     gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised,
//                   borderWidth: 1,
//                   borderColor: gymId === g.id ? Colors.primary : Colors.border,
//                 }}
//               >
//                 <Text
//                   style={{
//                     color: gymId === g.id ? Colors.primary : Colors.textMuted,
//                     fontSize: Typography.xs,
//                     fontWeight: gymId === g.id ? "700" : "400",
//                   }}
//                 >
//                   {g.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
//       </View>
//       <PlanGate allowed={hasWorkoutPlans} featureLabel="Workout Plans">
//         {isLoading ? (
//           <View style={{ padding: Spacing.lg }}>
//             <SkeletonGroup count={4} itemHeight={80} gap={Spacing.md} />
//           </View>
//         ) : (plans as any[]).length === 0 ? (
//           <EmptyState
//             icon="clipboard-list-outline"
//             title="No workout plans"
//             subtitle="Create plans for your members"
//             action={
//               <TouchableOpacity
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   gap: Spacing.sm,
//                   backgroundColor: Colors.primary,
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
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     alignItems: "flex-start",
//                     justifyContent: "space-between",
//                     gap: Spacing.sm,
//                   }}
//                 >
//                   <View style={{ flex: 1 }}>
//                     <Text
//                       style={{
//                         color: Colors.textPrimary,
//                         fontSize: Typography.base,
//                         fontWeight: "700",
//                       }}
//                     >
//                       {p.title ?? "Untitled Plan"}
//                     </Text>
//                     <Text
//                       style={{
//                         color: Colors.textMuted,
//                         fontSize: Typography.xs,
//                         marginTop: 2,
//                       }}
//                     >
//                       {p.gym?.name} · {p.durationWeeks}w
//                     </Text>
//                     {p.goal ? (
//                       <Text
//                         style={{
//                           color: Colors.textSecondary,
//                           fontSize: Typography.xs,
//                           marginTop: 2,
//                         }}
//                       >
//                         {p.goal}
//                       </Text>
//                     ) : null}
//                     {p.assignedMember ? (
//                       <Text
//                         style={{
//                           color: Colors.primary,
//                           fontSize: Typography.xs,
//                           marginTop: 2,
//                         }}
//                       >
//                         → {p.assignedMember?.profile?.fullName}
//                       </Text>
//                     ) : p.isGlobal ? (
//                       <Text
//                         style={{
//                           color: Colors.info,
//                           fontSize: Typography.xs,
//                           marginTop: 2,
//                         }}
//                       >
//                         Global Plan
//                       </Text>
//                     ) : null}
//                   </View>
//                   <Badge
//                     label={p.difficulty ?? "BEGINNER"}
//                     variant={DIFF_VARIANT[p.difficulty] ?? "default"}
//                   />
//                 </View>
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
//                 New Workout Plan
//               </Text>
//               <TouchableOpacity onPress={() => setShowAdd(false)}>
//                 <Icon name="close" size={22} color={Colors.textMuted} />
//               </TouchableOpacity>
//             </View>
//             {gyms.length > 1 && (
//               <View>
//                 <Text
//                   style={{
//                     color: Colors.textMuted,
//                     fontSize: Typography.xs,
//                     fontWeight: "500",
//                     marginBottom: 8,
//                   }}
//                 >
//                   Gym *
//                 </Text>
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     flexWrap: "wrap",
//                     gap: Spacing.xs,
//                   }}
//                 >
//                   {(gyms as any[]).map((g: any) => (
//                     <TouchableOpacity
//                       key={g.id}
//                       onPress={() => set("gymId", g.id)}
//                       style={{
//                         paddingHorizontal: 12,
//                         paddingVertical: 6,
//                         borderRadius: Radius.full,
//                         backgroundColor:
//                           form.gymId === g.id
//                             ? Colors.primaryFaded
//                             : Colors.surfaceRaised,
//                         borderWidth: 1,
//                         borderColor:
//                           form.gymId === g.id ? Colors.primary : Colors.border,
//                       }}
//                     >
//                       <Text
//                         style={{
//                           color:
//                             form.gymId === g.id
//                               ? Colors.primary
//                               : Colors.textMuted,
//                           fontSize: Typography.xs,
//                         }}
//                       >
//                         {g.name}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </View>
//             )}
//             <Input
//               label="Title *"
//               value={form.title}
//               onChangeText={(v) => set("title", v)}
//               placeholder="e.g. 4-Week Fat Loss Plan"
//             />
//             <Input
//               label="Goal"
//               value={form.goal}
//               onChangeText={(v) => set("goal", v)}
//               placeholder="Weight loss, Muscle gain..."
//             />
//             <View>
//               <Text
//                 style={{
//                   color: Colors.textMuted,
//                   fontSize: Typography.xs,
//                   fontWeight: "500",
//                   marginBottom: 8,
//                 }}
//               >
//                 Difficulty
//               </Text>
//               <View style={{ flexDirection: "row", gap: Spacing.xs }}>
//                 {DIFFICULTIES.map((d) => (
//                   <TouchableOpacity
//                     key={d}
//                     onPress={() => set("difficulty", d)}
//                     style={{
//                       flex: 1,
//                       paddingVertical: 8,
//                       alignItems: "center",
//                       borderRadius: Radius.lg,
//                       backgroundColor:
//                         form.difficulty === d
//                           ? Colors.primaryFaded
//                           : Colors.surfaceRaised,
//                       borderWidth: 1,
//                       borderColor:
//                         form.difficulty === d ? Colors.primary : Colors.border,
//                     }}
//                   >
//                     <Text
//                       style={{
//                         color:
//                           form.difficulty === d
//                             ? Colors.primary
//                             : Colors.textMuted,
//                         fontSize: Typography.xs,
//                         fontWeight: form.difficulty === d ? "700" : "400",
//                       }}
//                     >
//                       {d.charAt(0) + d.slice(1).toLowerCase()}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
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

// mobile/src/screens/owner/WorkoutsScreen.tsx
// List view only — create/edit is handled by AddWorkoutPlanScreen.
import { gymsApi, workoutsApi } from "@/api/endpoints";
import {
  Badge,
  Card,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, WorkoutPlan } from "@/types/api";
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

const DIFF_VARIANT: Record<string, "success" | "warning" | "error"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "error",
};

export default function OwnerWorkoutsScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { hasWorkoutPlans } = useSubscription();
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
  } = useQuery<WorkoutPlan[]>({
    queryKey: ["ownerWorkouts", gymId],
    queryFn: () =>
      workoutsApi.list({ gymId: gymId || undefined }) as Promise<WorkoutPlan[]>,
    enabled: hasWorkoutPlans,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.update(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({ type: "success", text1: "Plan archived" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmDelete = (plan: WorkoutPlan) => {
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
          title="Workout Plans"
          back
          right={
            hasWorkoutPlans ? (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() =>
                  (navigation as any).navigate("OwnerAddWorkoutPlan")
                }
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Gym filter */}
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

      <PlanGate allowed={hasWorkoutPlans} featureLabel="Workout Plans">
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup
              variant="card"
              count={4}
              itemHeight={100}
              gap={Spacing.md}
            />
          </View>
        ) : plans.length === 0 ? (
          <EmptyState
            icon="clipboard-list-outline"
            title="No workout plans"
            subtitle="Create structured plans for your members"
            action={
              <TouchableOpacity
                style={s.emptyAction}
                onPress={() =>
                  (navigation as any).navigate("OwnerAddWorkoutPlan")
                }
              >
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyActionText}>Create First Plan</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <FlatList<WorkoutPlan>
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
            renderItem={({ item: p }) => (
              <Card>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>
                      {p.title ?? "Untitled Plan"}
                    </Text>
                    <Text style={s.planMeta}>
                      {p.gym?.name} · {p.durationWeeks}w
                    </Text>
                    {p.goal ? <Text style={s.planGoal}>{p.goal}</Text> : null}

                    {/* Assignment / visibility */}
                    {p.assignedMember ? (
                      <View style={s.assignedRow}>
                        <Icon
                          name="account-outline"
                          size={11}
                          color={Colors.primary}
                        />
                        <Text style={s.assignedText}>
                          {p.assignedMember.profile?.fullName}
                        </Text>
                      </View>
                    ) : p.isGlobal ? (
                      <View style={s.assignedRow}>
                        <Icon name="earth" size={11} color={Colors.info} />
                        <Text style={[s.assignedText, { color: Colors.info }]}>
                          Global Plan
                        </Text>
                      </View>
                    ) : null}

                    {/* Exercise count if planData exists */}
                    {(p as any).planData &&
                      (() => {
                        const count = Object.values(
                          (p as any).planData as Record<
                            string,
                            Record<string, unknown[]>
                          >,
                        ).reduce(
                          (ws, days) =>
                            ws +
                            Object.values(days).reduce(
                              (ds, exs) => ds + (exs?.length ?? 0),
                              0,
                            ),
                          0,
                        );
                        return count > 0 ? (
                          <Text style={s.exerciseCount}>
                            {count} exercise{count !== 1 ? "s" : ""} planned
                          </Text>
                        ) : null;
                      })()}
                  </View>

                  <View style={s.cardRight}>
                    <Badge
                      label={p.difficulty ?? "BEGINNER"}
                      variant={
                        DIFF_VARIANT[p.difficulty ?? "BEGINNER"] ?? "default"
                      }
                    />

                    <View style={s.actionBtns}>
                      <TouchableOpacity
                        style={s.editBtn}
                        onPress={() =>
                          (navigation as any).navigate("OwnerAddWorkoutPlan", {
                            planId: p.id,
                          })
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name="pencil-outline"
                          size={15}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(p)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name="archive-outline"
                          size={15}
                          color={Colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            )}
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
    backgroundColor: Colors.primary,
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
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  planGoal: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 3,
  },
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  assignedText: { color: Colors.primary, fontSize: Typography.xs },
  exerciseCount: { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
  cardRight: { alignItems: "flex-end", gap: Spacing.sm, flexShrink: 0 },
  actionBtns: { flexDirection: "row", gap: Spacing.md },
  editBtn: {},
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
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
