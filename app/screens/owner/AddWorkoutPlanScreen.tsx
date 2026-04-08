// // mobile/src/screens/owner/AddWorkoutPlanScreen.tsx
// // Full-screen dedicated screen for creating / editing a workout plan.
// // Replaces the modal that was inside WorkoutsScreen.
// // Receives optional `planId` route param for edit mode.

// import { gymsApi, membersApi, workoutsApi } from "@/api/endpoints";
// import { Button, Card, Header, Input } from "@/components";
// import { showAlert } from "@/components/AppAlert";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import type {
//     Gym,
//     GymMemberListItem,
//     MembersListResponse,
//     WorkoutPlan,
// } from "@/types/api";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import React, { useEffect, useState } from "react";
// import {
//     ScrollView,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// // ── Constants ─────────────────────────────────────────────────────────────────

// const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
// type Difficulty = (typeof DIFFICULTIES)[number];

// const DIFF_COLORS: Record<Difficulty, string> = {
//   BEGINNER: Colors.success,
//   INTERMEDIATE: Colors.warning,
//   ADVANCED: Colors.error,
// };

// const DIFF_BG: Record<Difficulty, string> = {
//   BEGINNER: Colors.successFaded,
//   INTERMEDIATE: Colors.warningFaded,
//   ADVANCED: Colors.errorFaded,
// };

// const COMMON_GOALS = [
//   "Weight Loss",
//   "Muscle Gain",
//   "Strength",
//   "Endurance",
//   "Flexibility",
//   "Fat Burn",
//   "Toning",
//   "Athletic Performance",
// ];

// // ── Form type ─────────────────────────────────────────────────────────────────

// interface WorkoutForm {
//   gymId: string;
//   title: string;
//   goal: string;
//   description: string;
//   difficulty: Difficulty;
//   durationWeeks: string;
//   isGlobal: boolean; // visible to all members
//   assignedToMemberId: string; // "" = no assignment
//   planData: WeekData; // per-week per-day exercises
// }

// // planData structure: { "Week 1": { "Monday": ExerciseItem[], ... }, ... }
// interface ExerciseItem {
//   name: string;
//   sets: string;
//   reps: string;
//   weight: string; // kg or "bodyweight"
//   duration: string; // minutes (for cardio)
//   notes: string;
// }

// type DayExercises = Record<string, ExerciseItem[]>;
// type WeekData = Record<string, DayExercises>;

// const DAYS = [
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
//   "Sunday",
// ];

// const emptyExercise = (): ExerciseItem => ({
//   name: "",
//   sets: "",
//   reps: "",
//   weight: "",
//   duration: "",
//   notes: "",
// });

// function blankForm(defaultGymId = ""): WorkoutForm {
//   return {
//     gymId: defaultGymId,
//     title: "",
//     goal: "",
//     description: "",
//     difficulty: "BEGINNER",
//     durationWeeks: "4",
//     isGlobal: false,
//     assignedToMemberId: "",
//     planData: {},
//   };
// }

// // ── Exercise row component ────────────────────────────────────────────────────

// function ExerciseRow({
//   index,
//   item,
//   onChange,
//   onRemove,
// }: {
//   index: number;
//   item: ExerciseItem;
//   onChange: (field: keyof ExerciseItem, value: string) => void;
//   onRemove: () => void;
// }) {
//   const [expanded, setExpanded] = useState(index === 0);

//   return (
//     <View style={er.container}>
//       <TouchableOpacity
//         style={er.header}
//         onPress={() => setExpanded((e) => !e)}
//         activeOpacity={0.7}
//       >
//         <View style={er.headerLeft}>
//           <View style={er.indexBadge}>
//             <Text style={er.indexText}>{index + 1}</Text>
//           </View>
//           <Text style={er.exerciseName} numberOfLines={1}>
//             {item.name || "New exercise"}
//           </Text>
//         </View>
//         <View style={er.headerRight}>
//           {item.sets && item.reps ? (
//             <Text style={er.setsSummary}>
//               {item.sets}×{item.reps}
//             </Text>
//           ) : null}
//           <Icon
//             name={expanded ? "chevron-up" : "chevron-down"}
//             size={16}
//             color={Colors.textMuted}
//           />
//           <TouchableOpacity
//             onPress={onRemove}
//             hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//           >
//             <Icon name="close" size={16} color={Colors.error} />
//           </TouchableOpacity>
//         </View>
//       </TouchableOpacity>

//       {expanded && (
//         <View style={er.body}>
//           <Input
//             label="Exercise Name *"
//             value={item.name}
//             onChangeText={(v) => onChange("name", v)}
//             placeholder="e.g. Barbell Squat"
//             leftIcon="dumbbell"
//           />
//           <View style={er.row3}>
//             <View style={{ flex: 1 }}>
//               <Input
//                 label="Sets"
//                 value={item.sets}
//                 onChangeText={(v) => onChange("sets", v)}
//                 keyboardType="numeric"
//                 placeholder="3"
//               />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Input
//                 label="Reps"
//                 value={item.reps}
//                 onChangeText={(v) => onChange("reps", v)}
//                 keyboardType="numeric"
//                 placeholder="10"
//               />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Input
//                 label="Weight (kg)"
//                 value={item.weight}
//                 onChangeText={(v) => onChange("weight", v)}
//                 placeholder="BW"
//               />
//             </View>
//           </View>
//           <View style={er.row2}>
//             <View style={{ flex: 1 }}>
//               <Input
//                 label="Duration (min)"
//                 value={item.duration}
//                 onChangeText={(v) => onChange("duration", v)}
//                 keyboardType="numeric"
//                 placeholder="—"
//               />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Input
//                 label="Notes"
//                 value={item.notes}
//                 onChangeText={(v) => onChange("notes", v)}
//                 placeholder="e.g. slow tempo"
//               />
//             </View>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const er = StyleSheet.create({
//   container: {
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     overflow: "hidden",
//     marginBottom: Spacing.sm,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: Spacing.md,
//   },
//   headerLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     flex: 1,
//   },
//   indexBadge: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     backgroundColor: Colors.primaryFaded,
//     borderWidth: 1,
//     borderColor: Colors.primary + "40",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   indexText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
//   exerciseName: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//     flex: 1,
//   },
//   headerRight: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     flexShrink: 0,
//   },
//   setsSummary: { color: Colors.textMuted, fontSize: Typography.xs },
//   body: {
//     paddingHorizontal: Spacing.md,
//     paddingBottom: Spacing.md,
//     gap: Spacing.xs,
//     borderTopWidth: 1,
//     borderTopColor: Colors.border,
//     paddingTop: Spacing.md,
//   },
//   row3: { flexDirection: "row", gap: Spacing.sm },
//   row2: { flexDirection: "row", gap: Spacing.sm },
// });

// // ── Week/Day selector ─────────────────────────────────────────────────────────

// function WeekDaySelector({
//   weeks,
//   activeWeek,
//   activeDay,
//   onSelectWeek,
//   onSelectDay,
//   onAddWeek,
//   exerciseCounts,
// }: {
//   weeks: string[];
//   activeWeek: string;
//   activeDay: string;
//   onSelectWeek: (w: string) => void;
//   onSelectDay: (d: string) => void;
//   onAddWeek: () => void;
//   exerciseCounts: Record<string, Record<string, number>>;
// }) {
//   return (
//     <View style={wd.container}>
//       {/* Week tabs + add button */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={wd.weekScroll}
//       >
//         {weeks.map((w) => {
//           const total = DAYS.reduce(
//             (s, d) => s + (exerciseCounts[w]?.[d] ?? 0),
//             0,
//           );
//           return (
//             <TouchableOpacity
//               key={w}
//               onPress={() => onSelectWeek(w)}
//               style={[wd.weekTab, activeWeek === w && wd.weekTabActive]}
//             >
//               <Text
//                 style={[
//                   wd.weekTabText,
//                   activeWeek === w && wd.weekTabTextActive,
//                 ]}
//               >
//                 {w}
//               </Text>
//               {total > 0 && (
//                 <View style={wd.countBadge}>
//                   <Text style={wd.countText}>{total}</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           );
//         })}
//         <TouchableOpacity onPress={onAddWeek} style={wd.addWeekBtn}>
//           <Icon name="plus" size={14} color={Colors.primary} />
//           <Text style={wd.addWeekText}>Week</Text>
//         </TouchableOpacity>
//       </ScrollView>

//       {/* Day tabs */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={wd.dayScroll}
//       >
//         {DAYS.map((d) => {
//           const count = exerciseCounts[activeWeek]?.[d] ?? 0;
//           return (
//             <TouchableOpacity
//               key={d}
//               onPress={() => onSelectDay(d)}
//               style={[wd.dayTab, activeDay === d && wd.dayTabActive]}
//             >
//               <Text
//                 style={[wd.dayTabText, activeDay === d && wd.dayTabTextActive]}
//               >
//                 {d.slice(0, 3)}
//               </Text>
//               {count > 0 && (
//                 <Text
//                   style={[wd.dayCount, activeDay === d && { color: "#fff" }]}
//                 >
//                   {count}
//                 </Text>
//               )}
//             </TouchableOpacity>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// }

// const wd = StyleSheet.create({
//   container: { gap: 6 },
//   weekScroll: { flexGrow: 0 },
//   weekTab: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: Radius.lg,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     marginRight: Spacing.xs,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//   },
//   weekTabActive: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   weekTabText: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: "500",
//   },
//   weekTabTextActive: { color: "#fff", fontWeight: "700" },
//   countBadge: {
//     backgroundColor: "rgba(255,255,255,0.25)",
//     borderRadius: Radius.full,
//     minWidth: 16,
//     height: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 4,
//   },
//   countText: { color: "#fff", fontSize: 9, fontWeight: "700" },
//   addWeekBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     borderStyle: "dashed",
//     borderColor: Colors.primary + "60",
//     marginRight: Spacing.xs,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   addWeekText: { color: Colors.primary, fontSize: Typography.xs },
//   dayScroll: { flexGrow: 0 },
//   dayTab: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: Radius.md,
//     backgroundColor: Colors.surfaceRaised,
//     marginRight: Spacing.xs,
//     alignItems: "center",
//     minWidth: 44,
//   },
//   dayTabActive: {
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.primary + "60",
//   },
//   dayTabText: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: "500",
//   },
//   dayTabTextActive: { color: Colors.primary, fontWeight: "700" },
//   dayCount: { color: Colors.textMuted, fontSize: 9, marginTop: 1 },
// });

// // ── Summary stats bar ─────────────────────────────────────────────────────────

// function PlanSummary({
//   planData,
//   durationWeeks,
// }: {
//   planData: WeekData;
//   durationWeeks: string;
// }) {
//   const totalExercises = Object.values(planData).reduce(
//     (wSum, days) =>
//       wSum + Object.values(days).reduce((dSum, exs) => dSum + exs.length, 0),
//     0,
//   );
//   const activeDays = Object.values(planData).reduce(
//     (wSum, days) =>
//       wSum + Object.keys(days).filter((d) => (days[d]?.length ?? 0) > 0).length,
//     0,
//   );
//   const weeks = Object.keys(planData).length;

//   return (
//     <View style={ps.container}>
//       {[
//         { label: "Weeks", value: durationWeeks || "—", color: Colors.primary },
//         { label: "Plan weeks", value: String(weeks), color: Colors.info },
//         {
//           label: "Active days",
//           value: String(activeDays),
//           color: Colors.success,
//         },
//         {
//           label: "Exercises",
//           value: String(totalExercises),
//           color: Colors.purple,
//         },
//       ].map((s) => (
//         <View key={s.label} style={ps.stat}>
//           <Text style={[ps.value, { color: s.color }]}>{s.value}</Text>
//           <Text style={ps.label}>{s.label}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const ps = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.xl,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     padding: Spacing.md,
//   },
//   stat: { flex: 1, alignItems: "center" },
//   value: { fontSize: Typography.xl, fontWeight: "800" },
//   label: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
// });

// // ── Main Screen ───────────────────────────────────────────────────────────────

// export default function AddWorkoutPlanScreen() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const qc = useQueryClient();

//   const planId = (route.params as any)?.planId as string | undefined;
//   const isEditMode = !!planId;

//   // Active selection
//   const [activeWeek, setActiveWeek] = useState("Week 1");
//   const [activeDay, setActiveDay] = useState("Monday");

//   // Form state
//   const [form, setForm] = useState<WorkoutForm>(blankForm());
//   const [members, setMembers] = useState<GymMemberListItem[]>([]);

//   const set = (k: keyof WorkoutForm, v: unknown) =>
//     setForm((f) => ({ ...f, [k]: v }));

//   // Load gyms
//   const { data: gyms = [] } = useQuery<Gym[]>({
//     queryKey: ["ownerGyms"],
//     queryFn: () => gymsApi.list() as Promise<Gym[]>,
//     staleTime: 5 * 60_000,
//   });

//   useEffect(() => {
//     if (!form.gymId && gyms.length > 0) set("gymId", gyms[0].id);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [gyms]);

//   // Load existing plan for edit mode
//   const { isLoading: loadingPlan } = useQuery<WorkoutPlan>({
//     queryKey: ["ownerWorkout", planId],
//     queryFn: () => workoutsApi.list({}) as any, // we will populate from list
//     enabled: false, // we load via list below
//   });

//   // If edit mode, find the plan from the list
//   const { data: allPlans = [] } = useQuery<WorkoutPlan[]>({
//     queryKey: ["ownerWorkouts", ""],
//     queryFn: () => workoutsApi.list({}) as Promise<WorkoutPlan[]>,
//     enabled: isEditMode,
//     staleTime: 60_000,
//   });

//   useEffect(() => {
//     if (isEditMode && allPlans.length > 0) {
//       const plan = allPlans.find((p) => p.id === planId);
//       if (plan) {
//         const data = (plan as any).planData ?? {};
//         const firstWeek = Object.keys(data)[0] ?? "Week 1";
//         setForm({
//           gymId: (plan as any).gymId ?? gyms[0]?.id ?? "",
//           title: plan.title ?? "",
//           goal: plan.goal ?? "",
//           description: plan.description ?? "",
//           difficulty: (plan.difficulty as Difficulty) ?? "BEGINNER",
//           durationWeeks: String(plan.durationWeeks ?? 4),
//           isGlobal: plan.isGlobal,
//           assignedToMemberId: plan.assignedMember?.id ?? "", // GymMember id if assigned
//           planData: data,
//         });
//         setActiveWeek(firstWeek);
//       }
//     }
//   }, [isEditMode, allPlans, planId]);

//   // Load members when gym changes
//   useEffect(() => {
//     if (!form.gymId || form.isGlobal) {
//       setMembers([]);
//       return;
//     }
//     membersApi
//       .list({ gymId: form.gymId, status: "ACTIVE" })
//       .then((d: unknown) =>
//         setMembers((d as MembersListResponse).members ?? []),
//       )
//       .catch(() => {});
//   }, [form.gymId, form.isGlobal]);

//   // ── Plan data helpers ─────────────────────────────────────────────────────

//   const weeks =
//     Object.keys(form.planData).length > 0
//       ? Object.keys(form.planData)
//       : ["Week 1"];

//   // Ensure activeWeek exists
//   useEffect(() => {
//     if (!weeks.includes(activeWeek)) setActiveWeek(weeks[0] ?? "Week 1");
//   }, [weeks]);

//   const addWeek = () => {
//     const nextNum = Object.keys(form.planData).length + 1;
//     const key = `Week ${nextNum}`;
//     set("planData", { ...form.planData, [key]: {} });
//     setActiveWeek(key);
//   };

//   const currentExercises: ExerciseItem[] =
//     form.planData[activeWeek]?.[activeDay] ?? [];

//   const setExercises = (exs: ExerciseItem[]) => {
//     set("planData", {
//       ...form.planData,
//       [activeWeek]: {
//         ...(form.planData[activeWeek] ?? {}),
//         [activeDay]: exs,
//       },
//     });
//   };

//   const addExercise = () =>
//     setExercises([...currentExercises, emptyExercise()]);
//   const removeExercise = (i: number) =>
//     setExercises(currentExercises.filter((_, idx) => idx !== i));
//   const updateExercise = (
//     i: number,
//     field: keyof ExerciseItem,
//     val: string,
//   ) => {
//     const updated = [...currentExercises];
//     updated[i] = { ...updated[i], [field]: val };
//     setExercises(updated);
//   };

//   // Exercise count map for badges
//   const exerciseCounts: Record<string, Record<string, number>> = {};
//   for (const [week, days] of Object.entries(form.planData)) {
//     exerciseCounts[week] = {};
//     for (const [day, exs] of Object.entries(days as DayExercises)) {
//       exerciseCounts[week][day] = exs.length;
//     }
//   }

//   // ── Save mutation ─────────────────────────────────────────────────────────

//   const saveMutation = useMutation({
//     mutationFn: () => {
//       const payload = {
//         gymId: form.gymId || gyms[0]?.id,
//         title: form.title.trim(),
//         goal: form.goal || null,
//         description: form.description || null,
//         difficulty: form.difficulty,
//         durationWeeks: parseInt(form.durationWeeks) || 4,
//         isGlobal: form.isGlobal,
//         assignedToMemberId:
//           !form.isGlobal && form.assignedToMemberId
//             ? form.assignedToMemberId
//             : null,
//         planData: form.planData,
//       };
//       return isEditMode
//         ? workoutsApi.update(planId!, payload)
//         : workoutsApi.create(payload);
//     },
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
//       Toast.show({
//         type: "success",
//         text1: isEditMode ? "Plan updated! ✅" : "Workout plan created! 💪",
//       });
//       navigation.goBack();
//     },
//     onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
//   });

//   const handleSave = () => {
//     if (!form.title.trim()) {
//       Toast.show({ type: "error", text1: "Plan title is required" });
//       return;
//     }
//     if (!form.gymId && gyms.length === 0) {
//       Toast.show({ type: "error", text1: "Please select a gym" });
//       return;
//     }
//     saveMutation.mutate();
//   };

//   const handleDiscard = () => {
//     showAlert(
//       "Discard Changes",
//       "Are you sure you want to discard this plan?",
//       [
//         { text: "Keep Editing", style: "cancel" },
//         {
//           text: "Discard",
//           style: "destructive",
//           onPress: () => navigation.goBack(),
//         },
//       ],
//     );
//   };

//   return (
//     <SafeAreaView style={s.safe}>
//       <ScrollView
//         contentContainerStyle={s.scroll}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* Header */}
//         <Header
//           title={isEditMode ? "Edit Plan" : "New Workout Plan"}
//           back
//           onBack={handleDiscard}
//           right={
//             <TouchableOpacity
//               style={s.saveBtn}
//               onPress={handleSave}
//               disabled={saveMutation.isPending}
//             >
//               <Text style={s.saveBtnText}>
//                 {saveMutation.isPending
//                   ? "Saving..."
//                   : isEditMode
//                     ? "Update"
//                     : "Create"}
//               </Text>
//             </TouchableOpacity>
//           }
//         />

//         {/* ── Section 1: Plan Details ────────────────────────────── */}
//         <Card style={s.section}>
//           <Text style={s.sectionTitle}>Plan Details</Text>

//           {/* Gym selector */}
//           {gyms.length > 1 && (
//             <View style={s.fieldWrap}>
//               <Text style={s.fieldLabel}>Gym *</Text>
//               <View style={s.chipRow}>
//                 {gyms.map((g) => (
//                   <TouchableOpacity
//                     key={g.id}
//                     onPress={() => set("gymId", g.id)}
//                     style={[s.chip, form.gymId === g.id && s.chipActive]}
//                   >
//                     <Text
//                       style={[
//                         s.chipText,
//                         form.gymId === g.id && s.chipTextActive,
//                       ]}
//                     >
//                       {g.name}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//           )}

//           <Input
//             label="Plan Title *"
//             value={form.title}
//             onChangeText={(v) => set("title", v)}
//             placeholder="e.g. 4-Week Fat Loss Programme"
//             leftIcon="clipboard-list-outline"
//           />

//           {/* Goal quick picks */}
//           <View style={s.fieldWrap}>
//             <Text style={s.fieldLabel}>Goal</Text>
//             <View style={s.chipRow}>
//               {COMMON_GOALS.map((g) => (
//                 <TouchableOpacity
//                   key={g}
//                   onPress={() => set("goal", form.goal === g ? "" : g)}
//                   style={[s.chip, form.goal === g && s.chipActive]}
//                 >
//                   <Text
//                     style={[s.chipText, form.goal === g && s.chipTextActive]}
//                   >
//                     {g}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <Input
//               value={form.goal}
//               onChangeText={(v) => set("goal", v)}
//               placeholder="Or type a custom goal..."
//               containerStyle={{ marginBottom: 0, marginTop: Spacing.xs }}
//             />
//           </View>

//           <Input
//             label="Description"
//             value={form.description}
//             onChangeText={(v) => set("description", v)}
//             placeholder="Brief description of this plan..."
//             multiline
//             numberOfLines={2}
//           />

//           {/* Difficulty */}
//           <View style={s.fieldWrap}>
//             <Text style={s.fieldLabel}>Difficulty</Text>
//             <View style={{ flexDirection: "row", gap: Spacing.sm }}>
//               {DIFFICULTIES.map((d) => {
//                 const active = form.difficulty === d;
//                 return (
//                   <TouchableOpacity
//                     key={d}
//                     onPress={() => set("difficulty", d)}
//                     style={[
//                       s.diffBtn,
//                       active && {
//                         backgroundColor: DIFF_BG[d],
//                         borderColor: DIFF_COLORS[d] + "60",
//                       },
//                     ]}
//                   >
//                     <Icon
//                       name={
//                         d === "BEGINNER"
//                           ? "speedometer-slow"
//                           : d === "INTERMEDIATE"
//                             ? "speedometer-medium"
//                             : "speedometer"
//                       }
//                       size={16}
//                       color={active ? DIFF_COLORS[d] : Colors.textMuted}
//                     />
//                     <Text
//                       style={[
//                         s.diffText,
//                         active && { color: DIFF_COLORS[d], fontWeight: "700" },
//                       ]}
//                     >
//                       {d.charAt(0) + d.slice(1).toLowerCase()}
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           </View>

//           <Input
//             label="Duration (weeks)"
//             value={form.durationWeeks}
//             onChangeText={(v) => set("durationWeeks", v)}
//             keyboardType="numeric"
//             leftIcon="calendar-range"
//           />
//         </Card>

//         {/* ── Section 2: Visibility & Assignment ────────────────── */}
//         <Card style={s.section}>
//           <Text style={s.sectionTitle}>Visibility & Assignment</Text>

//           {/* Global toggle */}
//           <TouchableOpacity
//             style={s.toggleRow}
//             onPress={() => {
//               set("isGlobal", !form.isGlobal);
//               if (!form.isGlobal) set("assignedToMemberId", "");
//             }}
//           >
//             <View style={{ flex: 1 }}>
//               <Text style={s.toggleLabel}>Visible to All Members</Text>
//               <Text style={s.toggleSub}>
//                 All gym members can access this plan
//               </Text>
//             </View>
//             <View style={[s.toggle, form.isGlobal && s.toggleOn]}>
//               <View style={[s.toggleThumb, form.isGlobal && s.toggleThumbOn]} />
//             </View>
//           </TouchableOpacity>

//           {/* Member assignment — hidden when isGlobal */}
//           {!form.isGlobal && (
//             <View style={s.fieldWrap}>
//               <Text style={s.fieldLabel}>Assign to Member (optional)</Text>
//               <View style={s.memberList}>
//                 <TouchableOpacity
//                   onPress={() => set("assignedToMemberId", "")}
//                   style={[
//                     s.memberChip,
//                     !form.assignedToMemberId && s.memberChipActive,
//                   ]}
//                 >
//                   <Text
//                     style={[
//                       s.memberChipText,
//                       !form.assignedToMemberId && s.memberChipTextActive,
//                     ]}
//                   >
//                     Unassigned
//                   </Text>
//                 </TouchableOpacity>
//                 {members.slice(0, 12).map((m) => (
//                   <TouchableOpacity
//                     key={m.id}
//                     onPress={() =>
//                       set(
//                         "assignedToMemberId",
//                         form.assignedToMemberId === m.id ? "" : m.id,
//                       )
//                     }
//                     style={[
//                       s.memberChip,
//                       form.assignedToMemberId === m.id && s.memberChipActive,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         s.memberChipText,
//                         form.assignedToMemberId === m.id &&
//                           s.memberChipTextActive,
//                       ]}
//                       numberOfLines={1}
//                     >
//                       {m.profile.fullName}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//           )}
//         </Card>

//         {/* ── Section 3: Exercise Planner ────────────────────────── */}
//         <Card style={s.section}>
//           <View style={s.plannerHeader}>
//             <View>
//               <Text style={s.sectionTitle}>Exercise Planner</Text>
//               <Text style={s.plannerSub}>
//                 {activeWeek} · {activeDay} · {currentExercises.length} exercise
//                 {currentExercises.length !== 1 ? "s" : ""}
//               </Text>
//             </View>
//           </View>

//           {/* Plan summary */}
//           <PlanSummary
//             planData={form.planData}
//             durationWeeks={form.durationWeeks}
//           />

//           <View style={{ height: Spacing.md }} />

//           {/* Week + Day selector */}
//           <WeekDaySelector
//             weeks={weeks}
//             activeWeek={activeWeek}
//             activeDay={activeDay}
//             onSelectWeek={setActiveWeek}
//             onSelectDay={setActiveDay}
//             onAddWeek={addWeek}
//             exerciseCounts={exerciseCounts}
//           />

//           <View style={{ height: Spacing.md }} />

//           {/* Exercises for active week/day */}
//           {currentExercises.length === 0 ? (
//             <View style={s.noExercises}>
//               <Icon name="dumbbell" size={28} color={Colors.textMuted} />
//               <Text style={s.noExercisesText}>
//                 No exercises for {activeDay}
//               </Text>
//               <Text style={s.noExercisesSub}>Tap the button below to add</Text>
//             </View>
//           ) : (
//             currentExercises.map((item, i) => (
//               <ExerciseRow
//                 key={`${activeWeek}-${activeDay}-${i}`}
//                 index={i}
//                 item={item}
//                 onChange={(field, val) => updateExercise(i, field, val)}
//                 onRemove={() => removeExercise(i)}
//               />
//             ))
//           )}

//           {/* Add exercise button */}
//           <TouchableOpacity style={s.addExerciseBtn} onPress={addExercise}>
//             <Icon name="plus" size={16} color={Colors.primary} />
//             <Text style={s.addExerciseBtnText}>Add Exercise</Text>
//           </TouchableOpacity>
//         </Card>

//         {/* Save button */}
//         <Button
//           label={
//             saveMutation.isPending
//               ? "Saving..."
//               : isEditMode
//                 ? "Update Plan"
//                 : "Create Plan"
//           }
//           onPress={handleSave}
//           loading={saveMutation.isPending}
//           style={s.bottomSaveBtn}
//         />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
//   saveBtn: {
//     backgroundColor: Colors.primary,
//     borderRadius: Radius.lg,
//     paddingHorizontal: Spacing.lg,
//     paddingVertical: 8,
//   },
//   saveBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
//   section: {},
//   sectionTitle: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "700",
//     marginBottom: Spacing.md,
//   },
//   fieldWrap: { marginBottom: Spacing.md },
//   fieldLabel: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: "500",
//     marginBottom: 8,
//     letterSpacing: 0.3,
//   },
//   chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
//   chip: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: Radius.full,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   chipActive: {
//     backgroundColor: Colors.primaryFaded,
//     borderColor: Colors.primary,
//   },
//   chipText: { color: Colors.textMuted, fontSize: Typography.xs },
//   chipTextActive: { color: Colors.primary, fontWeight: "700" },
//   diffBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     paddingVertical: 10,
//     borderRadius: Radius.lg,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   diffText: { color: Colors.textMuted, fontSize: Typography.xs },
//   toggleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     paddingVertical: Spacing.sm,
//     marginBottom: Spacing.sm,
//   },
//   toggleLabel: {
//     color: Colors.textPrimary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//   },
//   toggleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   toggle: {
//     width: 44,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     position: "relative",
//     justifyContent: "center",
//   },
//   toggleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
//   toggleThumb: {
//     position: "absolute",
//     left: 3,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: Colors.textMuted,
//   },
//   toggleThumbOn: { left: undefined, right: 3, backgroundColor: "#fff" },
//   memberList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
//   memberChip: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: Radius.full,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   memberChipActive: {
//     backgroundColor: Colors.primaryFaded,
//     borderColor: Colors.primary,
//   },
//   memberChipText: { color: Colors.textMuted, fontSize: Typography.xs },
//   memberChipTextActive: { color: Colors.primary, fontWeight: "700" },
//   plannerHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     justifyContent: "space-between",
//     marginBottom: Spacing.md,
//   },
//   plannerSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: 2,
//   },
//   noExercises: {
//     alignItems: "center",
//     paddingVertical: Spacing.xxl,
//     gap: Spacing.sm,
//   },
//   noExercisesText: {
//     color: Colors.textSecondary,
//     fontSize: Typography.sm,
//     fontWeight: "500",
//   },
//   noExercisesSub: { color: Colors.textMuted, fontSize: Typography.xs },
//   addExerciseBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.sm,
//     borderWidth: 1.5,
//     borderStyle: "dashed",
//     borderColor: Colors.primary + "50",
//     borderRadius: Radius.lg,
//     paddingVertical: 14,
//     marginTop: Spacing.sm,
//   },
//   addExerciseBtnText: {
//     color: Colors.primary,
//     fontSize: Typography.sm,
//     fontWeight: "600",
//   },
//   bottomSaveBtn: {},
// });

// mobile/src/screens/owner/AddWorkoutPlanScreen.tsx
// Full-screen create / edit workout plan for gym owners.
//
// planData structure (matches backend + member WorkoutsScreen):
//   { "Week 1": { "Monday": Exercise[], "Tuesday": [], ... }, "Week 2": { ... } }
//
// Flow:
//   Step 1 — Plan details (title, goal, difficulty, weeks, gym, assignment)
//   Step 2 — Build exercises per week → per day (add / edit / reorder / delete)
//   Save   — POST /api/owner/workouts  (create)
//          — PATCH /api/owner/workouts/:id (edit)

import { gymsApi, membersApi, workoutsApi } from "@/api/endpoints";
import { Card, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, GymMemberListItem, WorkoutPlan } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type Day = (typeof DAYS)[number];

const DIFFICULTIES = [
  { value: "BEGINNER", label: "Beginner", color: Colors.success },
  { value: "INTERMEDIATE", label: "Intermediate", color: Colors.warning },
  { value: "ADVANCED", label: "Advanced", color: Colors.error },
] as const;

const MAX_WEEKS = 12;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string; // kg — optional
  duration: string; // minutes — optional
  rest: string; // seconds — optional
  notes: string;
}

// planData: { "Week 1": { "Monday": Exercise[], ... }, ... }
type WeekData = Record<Day, Exercise[]>;
type PlanData = Record<string, WeekData>;

interface PlanForm {
  gymId: string;
  title: string;
  goal: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  isGlobal: boolean;
  assignedToMemberId: string;
}

function emptyExercise(): Exercise {
  return {
    name: "",
    sets: "",
    reps: "",
    weight: "",
    duration: "",
    rest: "",
    notes: "",
  };
}

function emptyWeek(): WeekData {
  return Object.fromEntries(DAYS.map((d) => [d, []])) as unknown as WeekData;
}

function buildInitialPlanData(weeks: number): PlanData {
  return Object.fromEntries(
    Array.from({ length: weeks }, (_, i) => [`Week ${i + 1}`, emptyWeek()]),
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sc.label}>{label}</Text>;
}
const sc = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
});

function Pill({
  label,
  active,
  color = Colors.primary,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        pl.pill,
        active && { borderColor: color, backgroundColor: color + "18" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[pl.txt, active && { color, fontWeight: "700" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const pl = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  txt: { color: Colors.textMuted, fontSize: Typography.xs },
});

function Toggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={tg.row} onPress={onToggle} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={tg.label}>{label}</Text>
      </View>
      <View style={[tg.track, value && tg.trackOn]}>
        <View style={[tg.thumb, value && tg.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}
const tg = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: { color: Colors.textPrimary, fontSize: Typography.sm },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: "center",
  },
  trackOn: { backgroundColor: Colors.primary },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  thumbOn: { alignSelf: "flex-end" },
});

// ── Exercise modal ─────────────────────────────────────────────────────────────

interface ExerciseModalProps {
  visible: boolean;
  exercise: Exercise;
  index: number | null; // null = new exercise
  onSave: (ex: Exercise) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function ExerciseModal({
  visible,
  exercise,
  index,
  onSave,
  onDelete,
  onClose,
}: ExerciseModalProps) {
  const [form, setForm] = useState<Exercise>(exercise);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setForm(exercise);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [visible, exercise]);

  const set = (k: keyof Exercise) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onPressSave = () => {
    if (!form.name.trim()) {
      Toast.show({ type: "error", text1: "Exercise name is required" });
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={em.header}>
            <TouchableOpacity onPress={onClose} style={em.closeBtn}>
              <Icon name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={em.title}>
              {index === null ? "Add Exercise" : "Edit Exercise"}
            </Text>
            {index !== null && onDelete ? (
              <TouchableOpacity
                onPress={() => {
                  onDelete();
                  onClose();
                }}
                style={em.deleteBtn}
              >
                <Icon name="trash-can-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: Spacing.lg,
              paddingBottom: 40,
              gap: Spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View>
              <SectionLabel label="EXERCISE NAME *" />
              <TextInput
                ref={nameRef}
                style={em.input}
                value={form.name}
                onChangeText={set("name")}
                placeholder="e.g. Barbell Squat"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Sets + Reps */}
            <View style={em.row2}>
              <View style={{ flex: 1 }}>
                <SectionLabel label="SETS" />
                <TextInput
                  style={em.input}
                  value={form.sets}
                  onChangeText={set("sets")}
                  placeholder="e.g. 4"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SectionLabel label="REPS" />
                <TextInput
                  style={em.input}
                  value={form.reps}
                  onChangeText={set("reps")}
                  placeholder="e.g. 12"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Weight + Rest */}
            <View style={em.row2}>
              <View style={{ flex: 1 }}>
                <SectionLabel label="WEIGHT (kg)" />
                <TextInput
                  style={em.input}
                  value={form.weight}
                  onChangeText={set("weight")}
                  placeholder="Optional"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SectionLabel label="REST (seconds)" />
                <TextInput
                  style={em.input}
                  value={form.rest}
                  onChangeText={set("rest")}
                  placeholder="e.g. 90"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Duration */}
            <View>
              <SectionLabel label="DURATION (minutes) — for cardio / timed exercises" />
              <TextInput
                style={em.input}
                value={form.duration}
                onChangeText={set("duration")}
                placeholder="Optional"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Notes */}
            <View>
              <SectionLabel label="NOTES / FORM CUES" />
              <TextInput
                style={[em.input, em.textarea]}
                value={form.notes}
                onChangeText={set("notes")}
                placeholder="e.g. Keep back straight, don't lock knees"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={em.saveBtn} onPress={onPressSave}>
              <Icon name="check" size={18} color="#fff" />
              <Text style={em.saveTxt}>
                {index === null ? "Add Exercise" : "Update Exercise"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const em = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  row2: { flexDirection: "row", gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  textarea: { minHeight: 80, paddingTop: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  saveTxt: { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
});

// ── Exercise row in list ──────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  ex: Exercise;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const meta = [
    ex.sets && `${ex.sets} sets`,
    ex.reps && `${ex.reps} reps`,
    ex.weight && `${ex.weight} kg`,
    ex.duration && `${ex.duration} min`,
    ex.rest && `Rest ${ex.rest}s`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View style={er.row}>
      {/* Number + reorder */}
      <View style={er.left}>
        <View style={er.num}>
          <Text style={er.numTxt}>{index + 1}</Text>
        </View>
        <View style={er.reorder}>
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={isFirst}
            style={[er.arrow, isFirst && er.arrowDisabled]}
          >
            <Icon
              name="chevron-up"
              size={14}
              color={isFirst ? Colors.border : Colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={isLast}
            style={[er.arrow, isLast && er.arrowDisabled]}
          >
            <Icon
              name="chevron-down"
              size={14}
              color={isLast ? Colors.border : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <Text style={er.name}>{ex.name}</Text>
        {!!meta && <Text style={er.meta}>{meta}</Text>}
        {!!ex.notes && (
          <Text style={er.notes} numberOfLines={1}>
            {ex.notes}
          </Text>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={er.actions}>
        <TouchableOpacity onPress={onEdit} style={er.actionBtn}>
          <Icon name="pencil-outline" size={15} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[er.actionBtn, er.deleteBtn]}
        >
          <Icon name="trash-can-outline" size={15} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const er = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { alignItems: "center", gap: 4, flexShrink: 0 },
  num: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  numTxt: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  reorder: { gap: 0 },
  arrow: { padding: 2 },
  arrowDisabled: { opacity: 0.3 },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  meta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  notes: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: "italic",
    marginTop: 2,
  },
  actions: { flexDirection: "row", gap: 4, flexShrink: 0 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { backgroundColor: Colors.errorFaded },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export function AddWorkoutPlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const qc = useQueryClient();

  // If route.params.plan is passed → edit mode
  const editPlan: WorkoutPlan | undefined = route.params?.plan;

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Plan form ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<PlanForm>({
    gymId: editPlan ? ((editPlan as any).gymId ?? "") : "",
    title: editPlan?.title ?? "",
    goal: editPlan?.goal ?? "",
    description: editPlan?.description ?? "",
    difficulty: editPlan?.difficulty ?? "BEGINNER",
    durationWeeks: editPlan?.durationWeeks ?? 4,
    isGlobal: editPlan?.isGlobal ?? false,
    assignedToMemberId: (editPlan as any)?.assignedToMemberId ?? "",
  });

  const setF = (k: keyof PlanForm) => (v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Plan data (exercises) ─────────────────────────────────────────────────
  const [planData, setPlanData] = useState<PlanData>(() => {
    if (editPlan && (editPlan as any).planData) {
      return (editPlan as any).planData as PlanData;
    }
    return buildInitialPlanData(4);
  });

  // Current week / day selection
  const [selWeek, setSelWeek] = useState("Week 1");
  const [selDay, setSelDay] = useState<Day>("Monday");

  // Exercise modal
  const [exModal, setExModal] = useState<{
    visible: boolean;
    exercise: Exercise;
    index: number | null;
  }>({ visible: false, exercise: emptyExercise(), index: null });

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: gyms = [], isLoading: gymsLoading } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const { data: membersResp, isLoading: membersLoading } = useQuery<any>({
    queryKey: ["ownerMembers", form.gymId],
    queryFn: () => membersApi.list({ gymId: form.gymId, status: "ACTIVE" }),
    enabled: !!form.gymId && !form.isGlobal,
    staleTime: 2 * 60_000,
  });
  const members: GymMemberListItem[] =
    membersResp?.members ?? (Array.isArray(membersResp) ? membersResp : []);

  // Auto-select gym if only one
  useEffect(() => {
    if (gyms.length === 1 && !form.gymId) {
      setF("gymId")(gyms[0].id);
    }
  }, [gyms]);

  // When duration weeks changes → sync planData keys
  useEffect(() => {
    setPlanData((prev) => {
      const next: PlanData = {};
      for (let i = 1; i <= form.durationWeeks; i++) {
        const key = `Week ${i}`;
        next[key] = prev[key] ?? emptyWeek();
      }
      // Reset selected week if it no longer exists
      if (!next[selWeek]) setSelWeek("Week 1");
      return next;
    });
  }, [form.durationWeeks]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data: object) =>
      editPlan
        ? workoutsApi.update(editPlan.id, data)
        : workoutsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerWorkouts"] });
      Toast.show({
        type: "success",
        text1: editPlan ? "Plan updated!" : "Workout plan created!",
        text2: editPlan ? undefined : "Your members can now see this plan.",
      });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: err?.message ?? "Failed to save plan",
      });
    },
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!form.gymId) return "Please select a gym";
    if (!form.title.trim()) return "Plan title is required";
    return null;
  };

  const onNextStep = () => {
    const err = validateStep1();
    if (err) {
      Toast.show({ type: "error", text1: err });
      return;
    }
    setStep(2);
  };

  const onSave = () => {
    const err = validateStep1();
    if (err) {
      Toast.show({ type: "error", text1: err });
      return;
    }

    // Count total exercises
    const totalEx = Object.values(planData).reduce(
      (ws, days) =>
        ws + Object.values(days).reduce((ds, exs) => ds + exs.length, 0),
      0,
    );

    if (totalEx === 0) {
      Alert.alert(
        "No exercises added",
        "You haven't added any exercises yet. Save an empty plan?",
        [
          { text: "Go back", style: "cancel" },
          { text: "Save anyway", onPress: () => doSave() },
        ],
      );
      return;
    }
    doSave();
  };

  const doSave = () => {
    saveMutation.mutate({
      gymId: form.gymId,
      title: form.title.trim(),
      goal: form.goal.trim() || null,
      description: form.description.trim() || null,
      difficulty: form.difficulty,
      durationWeeks: form.durationWeeks,
      isGlobal: form.isGlobal,
      assignedToMemberId: form.isGlobal
        ? null
        : form.assignedToMemberId || null,
      planData,
    });
  };

  // ── Exercise operations ────────────────────────────────────────────────────
  const currentExercises: Exercise[] = planData[selWeek]?.[selDay] ?? [];

  const setExercises = (exs: Exercise[]) => {
    setPlanData((prev) => ({
      ...prev,
      [selWeek]: { ...prev[selWeek], [selDay]: exs },
    }));
  };

  const openAddExercise = () => {
    setExModal({ visible: true, exercise: emptyExercise(), index: null });
  };

  const openEditExercise = (index: number) => {
    setExModal({
      visible: true,
      exercise: { ...currentExercises[index] },
      index,
    });
  };

  const onSaveExercise = (ex: Exercise) => {
    if (exModal.index === null) {
      // Add new
      setExercises([...currentExercises, ex]);
    } else {
      // Update existing
      const updated = [...currentExercises];
      updated[exModal.index] = ex;
      setExercises(updated);
    }
  };

  const deleteExercise = (index: number) => {
    setExercises(currentExercises.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, dir: "up" | "down") => {
    const arr = [...currentExercises];
    const other = dir === "up" ? index - 1 : index + 1;
    [arr[index], arr[other]] = [arr[other], arr[index]];
    setExercises(arr);
  };

  // Exercise count for a day across all weeks
  const dayCount = (week: string, day: Day) =>
    (planData[week]?.[day] ?? []).length;

  // Total exercises across all weeks
  const totalExercises = Object.values(planData).reduce(
    (ws, days) =>
      ws + Object.values(days).reduce((ds, exs) => ds + exs.length, 0),
    0,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
            style={s.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>
              {editPlan ? "Edit Workout Plan" : "New Workout Plan"}
            </Text>
            <Text style={s.headerSub}>
              Step {step} of 2 ·{" "}
              {step === 1 ? "Plan Details" : "Build Exercises"}
            </Text>
          </View>

          {/* Step indicator */}
          <View style={s.stepDots}>
            <View style={[s.dot, step >= 1 && s.dotActive]} />
            <View style={[s.dot, step >= 2 && s.dotActive]} />
          </View>
        </View>

        {/* ── STEP 1: Plan details ───────────────────────────────────── */}
        {step === 1 && (
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card>
              <SectionLabel label="GYM *" />
              {gymsLoading ? (
                <Skeleton height={44} />
              ) : gyms.length === 0 ? (
                <Text style={s.emptyHint}>
                  No gyms found. Create a gym first.
                </Text>
              ) : (
                <View style={s.pillRow}>
                  {gyms.map((g) => (
                    <Pill
                      key={g.id}
                      label={g.name}
                      active={form.gymId === g.id}
                      onPress={() => {
                        setF("gymId")(g.id);
                        setF("assignedToMemberId")("");
                      }}
                    />
                  ))}
                </View>
              )}

              <SectionLabel label="PLAN TITLE *" />
              <TextInput
                style={s.textInput}
                value={form.title}
                onChangeText={setF("title")}
                placeholder="e.g. 12-Week Mass Builder"
                placeholderTextColor={Colors.textMuted}
              />

              <SectionLabel label="GOAL" />
              <TextInput
                style={s.textInput}
                value={form.goal}
                onChangeText={setF("goal")}
                placeholder="e.g. Build muscle, Lose fat, Improve endurance"
                placeholderTextColor={Colors.textMuted}
              />

              <SectionLabel label="DESCRIPTION" />
              <TextInput
                style={[s.textInput, s.textarea]}
                value={form.description}
                onChangeText={setF("description")}
                placeholder="Brief overview of this plan…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Card>

            <Card>
              <SectionLabel label="DIFFICULTY" />
              <View style={s.pillRow}>
                {DIFFICULTIES.map((d) => (
                  <Pill
                    key={d.value}
                    label={d.label}
                    active={form.difficulty === d.value}
                    color={d.color}
                    onPress={() => setF("difficulty")(d.value)}
                  />
                ))}
              </View>

              <SectionLabel label="DURATION" />
              <View style={s.pillRow}>
                {[2, 4, 6, 8, 10, 12].map((w) => (
                  <Pill
                    key={w}
                    label={`${w}w`}
                    active={form.durationWeeks === w}
                    onPress={() => setF("durationWeeks")(w)}
                  />
                ))}
              </View>
            </Card>

            <Card>
              <SectionLabel label="ASSIGNMENT" />
              <Toggle
                label="Global plan (visible to all gym members)"
                value={form.isGlobal}
                onToggle={() => {
                  setF("isGlobal")(!form.isGlobal);
                  if (!form.isGlobal) setF("assignedToMemberId")("");
                }}
              />

              {!form.isGlobal && form.gymId && (
                <>
                  <SectionLabel label="ASSIGN TO SPECIFIC MEMBER (optional)" />
                  {membersLoading ? (
                    <Skeleton height={36} />
                  ) : members.length === 0 ? (
                    <Text style={s.emptyHint}>
                      No active members in this gym
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={[s.pillRow, { flexWrap: "nowrap" }]}>
                        <Pill
                          label="No specific member"
                          active={!form.assignedToMemberId}
                          onPress={() => setF("assignedToMemberId")("")}
                        />
                        {members.map((m) => (
                          <Pill
                            key={m.id}
                            label={m.profile.fullName}
                            active={form.assignedToMemberId === m.id}
                            onPress={() =>
                              setF("assignedToMemberId")(
                                form.assignedToMemberId === m.id ? "" : m.id,
                              )
                            }
                          />
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </>
              )}
            </Card>

            {/* Next */}
            <TouchableOpacity
              style={s.nextBtn}
              onPress={onNextStep}
              activeOpacity={0.85}
            >
              <Text style={s.nextTxt}>Next — Build Exercises</Text>
              <Icon name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── STEP 2: Build exercises ────────────────────────────────── */}
        {step === 2 && (
          <>
            {/* Plan summary bar */}
            <View style={s.summaryBar}>
              <View style={s.summaryItem}>
                <Icon name="dumbbell" size={14} color={Colors.primary} />
                <Text style={s.summaryTxt}>{totalExercises} exercises</Text>
              </View>
              <View style={s.summaryItem}>
                <Icon name="calendar-week" size={14} color={Colors.textMuted} />
                <Text style={s.summaryTxt}>{form.durationWeeks} weeks</Text>
              </View>
              <View style={s.summaryItem}>
                <Icon name="flag-outline" size={14} color={Colors.textMuted} />
                <Text style={s.summaryTxt}>
                  {form.title.slice(0, 20) || "Untitled"}
                </Text>
              </View>
            </View>

            {/* Week selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.weekScroll}
            >
              {Object.keys(planData).map((week) => {
                const cnt = Object.values(planData[week]).reduce(
                  (s, exs) => s + exs.length,
                  0,
                );
                return (
                  <TouchableOpacity
                    key={week}
                    style={[s.weekPill, selWeek === week && s.weekPillActive]}
                    onPress={() => setSelWeek(week)}
                  >
                    <Text
                      style={[s.weekTxt, selWeek === week && s.weekTxtActive]}
                    >
                      {week}
                    </Text>
                    {cnt > 0 && (
                      <Text
                        style={[
                          s.weekCnt,
                          selWeek === week && { color: "#fff" },
                        ]}
                      >
                        {cnt}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Day selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.dayScroll}
            >
              {DAYS.map((day) => {
                const cnt = dayCount(selWeek, day);
                const active = selDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[s.dayPill, active && s.dayPillActive]}
                    onPress={() => setSelDay(day)}
                  >
                    <Text style={[s.dayTxt, active && s.dayTxtActive]}>
                      {day.slice(0, 3)}
                    </Text>
                    {cnt > 0 && (
                      <Text style={[s.dayCnt, active && { color: "#fff" }]}>
                        {cnt}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exercise list */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: Spacing.lg,
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              {currentExercises.length === 0 ? (
                <View style={s.emptyExercises}>
                  <Icon name="dumbbell" size={32} color={Colors.textMuted} />
                  <Text style={s.emptyExTxt}>No exercises for {selDay}</Text>
                  <Text style={s.emptyExSub}>
                    Tap "Add Exercise" to get started
                  </Text>
                </View>
              ) : (
                <Card>
                  <Text style={s.dayHeader}>
                    {selWeek} · {selDay} · {currentExercises.length} exercise
                    {currentExercises.length !== 1 ? "s" : ""}
                  </Text>
                  {currentExercises.map((ex, i) => (
                    <ExerciseRow
                      key={i}
                      ex={ex}
                      index={i}
                      onEdit={() => openEditExercise(i)}
                      onDelete={() => {
                        Alert.alert("Remove", `Remove "${ex.name}"?`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => deleteExercise(i),
                          },
                        ]);
                      }}
                      onMoveUp={() => moveExercise(i, "up")}
                      onMoveDown={() => moveExercise(i, "down")}
                      isFirst={i === 0}
                      isLast={i === currentExercises.length - 1}
                    />
                  ))}
                </Card>
              )}
            </ScrollView>

            {/* Bottom action bar */}
            <View style={s.actionBar}>
              <TouchableOpacity
                style={s.addExBtn}
                onPress={openAddExercise}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={18} color={Colors.primary} />
                <Text style={s.addExTxt}>Add Exercise</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.saveBtn, saveMutation.isPending && s.saveBtnDisabled]}
                onPress={onSave}
                disabled={saveMutation.isPending}
                activeOpacity={0.85}
              >
                {saveMutation.isPending ? (
                  <Text style={s.saveTxt}>Saving…</Text>
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text style={s.saveTxt}>
                      {editPlan ? "Update Plan" : "Save Plan"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Exercise modal */}
      <ExerciseModal
        visible={exModal.visible}
        exercise={exModal.exercise}
        index={exModal.index}
        onSave={onSaveExercise}
        onDelete={
          exModal.index !== null
            ? () => deleteExercise(exModal.index!)
            : undefined
        }
        onClose={() => setExModal((m) => ({ ...m, visible: false }))}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "800",
  },
  headerSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  stepDots: { flexDirection: "row", gap: 5, flexShrink: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  // Step 1 scroll
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  // Inputs
  textInput: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  textarea: { minHeight: 80, paddingTop: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: "italic",
    paddingVertical: Spacing.sm,
  },
  // Next button
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  nextTxt: { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
  // Summary bar (step 2)
  summaryBar: {
    flexDirection: "row",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  summaryTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  // Week tabs
  weekScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  weekPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  weekPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  weekTxtActive: { color: "#fff", fontWeight: "700" },
  weekCnt: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  // Day tabs
  dayScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    minWidth: 44,
  },
  dayPillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  dayTxt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  dayTxtActive: { color: Colors.primary, fontWeight: "700" },
  dayCnt: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  // Empty state
  emptyExercises: {
    alignItems: "center",
    paddingVertical: 48,
    gap: Spacing.sm,
  },
  emptyExTxt: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  emptyExSub: { color: Colors.textMuted, fontSize: Typography.sm },
  dayHeader: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  addExTxt: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});
