// // mobile/src/screens/owner/GymDetailScreen.tsx
// import React, { useState } from "react"
// import {
//   View, Text, ScrollView, TouchableOpacity,
//   StyleSheet, RefreshControl, Alert,
// } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { useNavigation, useRoute } from "@react-navigation/native"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import Icon from "react-native-vector-icons/MaterialCommunityIcons"
// import Toast from "react-native-toast-message"
// import { gymsApi, membershipPlansApi } from "@/api/endpoints"
// import { Header, Card, Badge, Skeleton, ListRow } from "@/components/common"
// import { Colors, Spacing, Typography, Radius } from "@/theme"
// import type { Gym, MembershipPlan } from "@/types/api"

// function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

// export function OwnerGymDetailScreen() {
//   const navigation = useNavigation()
//   const route      = useRoute()
//   const qc         = useQueryClient()
//   const { gymId }  = route.params as { gymId: string }
//   const [tab, setTab] = useState<"overview" | "plans">("overview")

//   const { data: gym, isLoading, refetch, isRefetching } = useQuery<Gym>({
//     queryKey: ["ownerGym", gymId],
//     queryFn:  () => gymsApi.get(gymId) as Promise<Gym>,
//     enabled:  !!gymId,
//   })

//   const { data: plans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
//     queryKey: ["ownerPlans", gymId],
//     queryFn:  () => membershipPlansApi.list(gymId) as Promise<MembershipPlan[]>,
//     enabled:  !!gymId,
//   })

//   const toggleMutation = useMutation({
//     mutationFn: () => gymsApi.update(gymId, { isActive: !gym?.isActive }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerGym", gymId] })
//       qc.invalidateQueries({ queryKey: ["ownerGyms"] })
//       Toast.show({ type: "success", text1: `Gym ${gym?.isActive ? "deactivated" : "activated"}` })
//     },
//   })

//   const deletePlanMutation = useMutation({
//     mutationFn: (planId: string) => membershipPlansApi.delete(planId),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] })
//       Toast.show({ type: "success", text1: "Plan deleted" })
//     },
//     onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
//   })

//   const confirmDeletePlan = (planId: string, planName: string) => {
//     Alert.alert("Delete Plan", `Delete "${planName}"?`, [
//       { text: "Cancel", style: "cancel" },
//       { text: "Delete", style: "destructive", onPress: () => deletePlanMutation.mutate(planId) },
//     ])
//   }

//   if (isLoading) {
//     return (
//       <SafeAreaView style={styles.safe}>
//         <View style={{ padding: Spacing.lg }}>
//           <Header title="Gym Details" back />
//           <Skeleton height={200} />
//         </View>
//       </SafeAreaView>
//     )
//   }

//   if (!gym) return null

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefetching}
//             onRefresh={refetch}
//             tintColor={Colors.primary}
//             colors={[Colors.primary]}
//           />
//         }
//       >
//         <Header
//           title={gym.name}
//           subtitle={gym.city ?? undefined}
//           back
//           right={
//             <TouchableOpacity
//               style={[styles.toggleBtn, { borderColor: gym.isActive ? Colors.success + "40" : Colors.border }]}
//               onPress={() => toggleMutation.mutate()}
//             >
//               <Icon
//                 name={gym.isActive ? "toggle-switch" : "toggle-switch-off"}
//                 size={22}
//                 color={gym.isActive ? Colors.success : Colors.textMuted}
//               />
//             </TouchableOpacity>
//           }
//         />

//         <View style={styles.cover}>
//           <Icon name="dumbbell" size={36} color={Colors.textMuted} />
//         </View>

//         <View style={styles.badges}>
//           <Badge label={gym.isActive ? "Active" : "Inactive"} variant={gym.isActive ? "success" : "default"} />
//           {gym.city ? <Badge label={gym.city} /> : null}
//         </View>

//         <View style={styles.tabs}>
//           {(["overview", "plans"] as const).map(t => (
//             <TouchableOpacity
//               key={t}
//               onPress={() => setTab(t)}
//               style={[styles.tab, tab === t && styles.tabActive]}
//             >
//               <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
//                 {t === "overview" ? "Overview" : `Plans (${plans.length})`}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {tab === "overview" && (
//           <View style={styles.section}>
//             <Card>
//               <ListRow icon="account-group-outline" label="Total Members" value={String(gym._count?.members ?? 0)} iconColor={Colors.primary} iconBg={Colors.primaryFaded} bordered />
//               <ListRow icon="account-tie-outline"   label="Trainers"      value={String(gym._count?.trainers ?? 0)} iconColor={Colors.info} iconBg={Colors.infoFaded} bordered />
//               {gym.contactNumber ? <ListRow icon="phone-outline"       label="Contact"  value={gym.contactNumber} iconColor={Colors.success} iconBg={Colors.successFaded} bordered /> : null}
//               {gym.address       ? <ListRow icon="map-marker-outline"  label="Address"  value={gym.address}       /> : null}
//             </Card>

//             {gym.services?.length > 0 && (
//               <View style={styles.tagsSection}>
//                 <Text style={styles.tagSectionTitle}>Services</Text>
//                 <View style={styles.tags}>
//                   {gym.services.map((sv: string) => (
//                     <View key={sv} style={styles.tag}><Text style={styles.tagText}>{sv}</Text></View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {gym.facilities?.length > 0 && (
//               <View style={styles.tagsSection}>
//                 <Text style={styles.tagSectionTitle}>Facilities</Text>
//                 <View style={styles.tags}>
//                   {gym.facilities.map((f: string) => (
//                     <View key={f} style={styles.tag}><Text style={styles.tagText}>{f}</Text></View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             <View style={styles.actions}>
//               <TouchableOpacity style={styles.action} onPress={() => (navigation as any).navigate("OwnerMembers", { gymId })}>
//                 <Icon name="account-group-outline" size={18} color={Colors.primary} />
//                 <Text style={styles.actionText}>View Members</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.action} onPress={() => (navigation as any).navigate("OwnerTrainers", { gymId })}>
//                 <Icon name="account-tie-outline" size={18} color={Colors.info} />
//                 <Text style={styles.actionText}>View Trainers</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         {tab === "plans" && (
//           <View style={styles.section}>
//             <TouchableOpacity style={styles.addPlanBtn} onPress={() => (navigation as any).navigate("OwnerPlans", { gymId })}>
//               <Icon name="plus" size={16} color={Colors.primary} />
//               <Text style={styles.addPlanText}>Add Membership Plan</Text>
//             </TouchableOpacity>

//             {plansLoading ? (
//               <Skeleton height={80} />
//             ) : plans.length === 0 ? (
//               <View style={styles.emptyPlans}>
//                 <Icon name="tag-outline" size={32} color={Colors.textMuted} />
//                 <Text style={styles.emptyPlansText}>No plans yet</Text>
//               </View>
//             ) : (
//               plans.map((plan: MembershipPlan) => (
//                 <Card key={plan.id} style={{ marginBottom: Spacing.sm }}>
//                   <View style={styles.planRow}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.planName}>{plan.name}</Text>
//                       <Text style={styles.planMeta}>
//                         {plan.durationMonths} month{plan.durationMonths !== 1 ? "s" : ""} · {fmt(plan.price)}
//                       </Text>
//                     </View>
//                     <TouchableOpacity
//                       onPress={() => confirmDeletePlan(plan.id, plan.name)}
//                       hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                     >
//                       <Icon name="trash-can-outline" size={18} color={Colors.error} />
//                     </TouchableOpacity>
//                   </View>
//                   {plan.features?.length > 0 && (
//                     <View style={styles.features}>
//                       {plan.features.slice(0, 3).map((f: string) => (
//                         <View key={f} style={styles.featureRow}>
//                           <Icon name="check" size={12} color={Colors.success} />
//                           <Text style={styles.featureText}>{f}</Text>
//                         </View>
//                       ))}
//                     </View>
//                   )}
//                 </Card>
//               ))
//             )}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   safe:         { flex: 1, backgroundColor: Colors.bg },
//   scroll:       { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
//   toggleBtn:    { width: 38, height: 38, borderRadius: Radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
//   cover:        { height: 140, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
//   badges:       { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
//   tabs:         { flexDirection: "row", backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.lg },
//   tab:          { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: Radius.md },
//   tabActive:    { backgroundColor: Colors.primary },
//   tabText:      { color: Colors.textMuted, fontSize: Typography.sm, fontWeight: "500" },
//   tabTextActive:{ color: "#fff", fontWeight: "700" },
//   section:      { gap: Spacing.md },
//   tagsSection:  { gap: Spacing.sm },
//   tagSectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
//   tags:         { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
//   tag:          { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
//   tagText:      { color: Colors.textSecondary, fontSize: Typography.xs },
//   actions:      { flexDirection: "row", gap: Spacing.sm },
//   action:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md },
//   actionText:   { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
//   addPlanBtn:   { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed", paddingVertical: Spacing.md, justifyContent: "center" },
//   addPlanText:  { color: Colors.primary, fontSize: Typography.sm, fontWeight: "600" },
//   emptyPlans:   { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
//   emptyPlansText: { color: Colors.textMuted, fontSize: Typography.sm },
//   planRow:      { flexDirection: "row", alignItems: "center", gap: Spacing.md },
//   planName:     { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "600" },
//   planMeta:     { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
//   features:     { marginTop: Spacing.sm, gap: 4 },
//   featureRow:   { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
//   featureText:  { color: Colors.textSecondary, fontSize: Typography.xs },
// })

import { gymsApi, membershipPlansApi } from "@/api/endpoints";
import { Badge, Card, Header, ListRow, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, MembershipPlan } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

const OwnerGymDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();
  const { gymId } = route.params as { gymId: string };
  const [tab, setTab] = useState<"overview" | "plans">("overview");
  const {
    data: gym,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Gym>({
    queryKey: ["ownerGym", gymId],
    queryFn: () => gymsApi.get(gymId) as Promise<Gym>,
    enabled: !!gymId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<
    MembershipPlan[]
  >({
    queryKey: ["ownerPlans", gymId],
    queryFn: () => membershipPlansApi.list(gymId) as Promise<MembershipPlan[]>,
    enabled: !!gymId,
  });

  const toggleMutation = useMutation({
    mutationFn: () => gymsApi.update(gymId, { isActive: !gym?.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerGym", gymId] });
      qc.invalidateQueries({ queryKey: ["ownerGyms"] });
      Toast.show({
        type: "success",
        text1: `Gym ${gym?.isActive ? "deactivated" : "activated"}`,
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => membershipPlansApi.delete(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerPlans", gymId] });
      Toast.show({ type: "success", text1: "Plan deleted" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const confirmDeletePlan = (planId: string, planName: string) => {
    Alert.alert("Delete Plan", `Delete "${planName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlanMutation.mutate(planId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Gym Details" back />
          <Skeleton height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym) return null;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Header
          title={gym.name}
          subtitle={gym.city ?? undefined}
          back
          right={
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  borderColor: gym.isActive
                    ? Colors.success + "40"
                    : Colors.border,
                },
              ]}
            >
              <Icon
                name={gym.isActive ? "toggle-switch" : "toggle-switch-off"}
                size={22}
                color={gym.isActive ? Colors.success : Colors.textMuted}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.cover}>
          <Icon name="dumbbell" size={36} color={Colors.textMuted} />
        </View>
        <View style={styles.badges}>
          <Badge
            label={gym.isActive ? "Active" : "Inactive"}
            variant={gym.isActive ? "success" : "default"}
          />
          {gym.city ? <Badge label={gym.city} /> : null}
        </View>
        <View style={styles.tabs}>
          {(["overview", "plans"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "overview" ? "Overview" : `Plans (${plans.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === "overview" && (
          <View style={styles.section}>
            <Card>
              <ListRow
                icon="account-group-outline"
                label="Total Members"
                value={String(gym._count?.members ?? 0)}
                iconColor={Colors.primary}
                iconBg={Colors.primaryFaded}
                bordered
              />
              <ListRow
                icon="account-tie-outline"
                label="Trainers"
                value={String(gym._count?.trainers ?? 0)}
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
                bordered
              />
              {gym.contactNumber ? (
                <ListRow
                  icon="phone-outline"
                  label="Contact"
                  value={gym.contactNumber}
                  iconColor={Colors.success}
                  iconBg={Colors.successFaded}
                  bordered
                />
              ) : null}
              {gym.address ? (
                <ListRow
                  icon="map-marker-outline"
                  label="Address"
                  value={gym.address}
                />
              ) : null}
            </Card>

            {gym.services?.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagSectionTitle}>Services</Text>
                <View style={styles.tags}>
                  {gym.services.map((sv: string) => (
                    <View key={sv} style={styles.tag}>
                      <Text style={styles.tagText}>{sv}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {gym.facilities?.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagSectionTitle}>Facilities</Text>
                <View style={styles.tags}>
                  {gym.facilities.map((f: string) => (
                    <View key={f} style={styles.tag}>
                      <Text style={styles.tagText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.action}
                onPress={() =>
                  (navigation as any).navigate("OwnerMembers", { gymId })
                }
              >
                <Icon
                  name="account-group-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.actionText}>View Members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action}
                onPress={() =>
                  (navigation as any).navigate("OwnerTrainers", { gymId })
                }
              >
                <Icon
                  name="account-tie-outline"
                  size={18}
                  color={Colors.info}
                />
                <Text style={styles.actionText}>View Trainers</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {tab === "plans" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addPlanBtn}
              onPress={() =>
                (navigation as any).navigate("OwnerPlans", { gymId })
              }
            >
              <Icon name="plus" size={16} color={Colors.primary} />
              <Text style={styles.addPlanText}>Add Membership Plan</Text>
            </TouchableOpacity>

            {plansLoading ? (
              <Skeleton height={80} />
            ) : plans.length === 0 ? (
              <View style={styles.emptyPlans}>
                <Icon name="tag-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyPlansText}>No plans yet</Text>
              </View>
            ) : (
              plans.map((plan: MembershipPlan) => (
                <Card key={plan.id} style={{ marginBottom: Spacing.sm }}>
                  <View style={styles.planRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planMeta}>
                        {plan.durationMonths} month
                        {plan.durationMonths !== 1 ? "s" : ""} ·{" "}
                        {fmt(plan.price)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDeletePlan(plan.id, plan.name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="trash-can-outline"
                        size={18}
                        color={Colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                  {plan.features?.length > 0 && (
                    <View style={styles.features}>
                      {plan.features.slice(0, 3).map((f: string) => (
                        <View key={f} style={styles.featureRow}>
                          <Icon name="check" size={12} color={Colors.success} />
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OwnerGymDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  toggleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    height: 140,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  badges: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  section: { gap: Spacing.md },
  tagsSection: { gap: Spacing.sm },
  tagSectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  tag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { color: Colors.textSecondary, fontSize: Typography.xs },
  actions: { flexDirection: "row", gap: Spacing.sm },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  addPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    paddingVertical: Spacing.md,
    justifyContent: "center",
  },
  addPlanText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  emptyPlans: { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyPlansText: { color: Colors.textMuted, fontSize: Typography.sm },
  planRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  planName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  planMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  features: { marginTop: Spacing.sm, gap: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  featureText: { color: Colors.textSecondary, fontSize: Typography.xs },
});
