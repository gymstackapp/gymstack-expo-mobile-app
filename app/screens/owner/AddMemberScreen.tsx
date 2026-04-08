// mobile/src/screens/owner/AddMemberScreen.tsx
// Simplified form: Gym selector, Full Name, Mobile Number only.
// Backend handles: check existing profile by mobile, create/link GymMember,
// send SMS if INVITED, send in-app notification if ACTIVE.

import { gymsApi, membersApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input, PlanGate } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Spacing } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function OwnerAddMemberScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddMember } = useSubscription();

  const [form, setForm] = useState({
    gymId: "",
    fullName: "",
    mobileNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      membersApi.create({
        gymId: form.gymId,
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMembers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Member added!" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to add member" }),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.gymId) e.gymId = "Please select a gym";
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const gymOptions = (gyms as any[]).map((g) => ({ label: g.name, value: g.id }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddMember} featureLabel="Add Member">
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Member" back />

          <Card style={{ marginTop: Spacing.lg }}>
            <Dropdown
              label="Gym *"
              value={form.gymId}
              onChange={(v) => set("gymId", v)}
              options={gymOptions}
              placeholder="Select gym"
              leftIcon="dumbbell"
              error={errors.gymId}
            />
            <Input
              label="Full Name *"
              value={form.fullName}
              onChangeText={(v) => set("fullName", v)}
              placeholder="Member's full name"
              leftIcon="account-outline"
              error={errors.fullName}
            />
            <Input
              label="Mobile Number *"
              value={form.mobileNumber}
              onChangeText={(v) => set("mobileNumber", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
              error={errors.mobileNumber}
            />
          </Card>

          <View style={{ marginTop: Spacing.lg }}>
            <Button
              label="Add Member"
              onPress={() => {
                if (validate()) mutation.mutate();
              }}
              loading={mutation.isPending}
            />
          </View>
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}
