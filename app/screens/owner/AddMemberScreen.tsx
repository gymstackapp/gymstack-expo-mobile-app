// mobile/src/screens/owner/AddMemberScreen.tsx
import { gymsApi, membersApi, membershipPlansApi } from "@/api/endpoints";
import { Button, Card, Header, Input, PlanGate } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function Select({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: Typography.xs,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: Colors.surfaceRaised,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: Spacing.md,
          height: 52,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: selected ? Colors.textPrimary : Colors.textMuted,
            fontSize: Typography.base,
          }}
        >
          {selected?.label ?? `Select ${label}`}
        </Text>
        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View
          style={{
            backgroundColor: Colors.surfaceRaised,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          {options.map((o) => (
            <TouchableOpacity
              key={o.value}
              onPress={() => {
                onSelect(o.value);
                setOpen(false);
              }}
              style={{
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ color: Colors.textPrimary, fontSize: Typography.sm }}
              >
                {o.label}
              </Text>
              {value === o.value && (
                <Icon name="check" size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function OwnerAddMemberScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddMember } = useSubscription();

  const [form, setForm] = useState({
    gymId: "",
    fullName: "",
    email: "",
    mobileNumber: "",
    membershipPlanId: "",
    startDate: new Date().toISOString().split("T")[0],
    city: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<any[]>([]);

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (form.gymId) {
      membershipPlansApi
        .list(form.gymId)
        .then(setPlans)
        .catch(() => setPlans([]));
    }
  }, [form.gymId]);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const mutation = useMutation({
    mutationFn: () => membersApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMembers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Member added! 🎉" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to add member",
      }),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.gymId) e.gymId = "Please select a gym";
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.startDate) e.startDate = "Start date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const gymOptions = (gyms as any[]).map((g) => ({
    label: g.name,
    value: g.id,
  }));
  const planOptions = [
    { label: "No plan", value: "" },
    ...plans.map((p) => ({ label: `${p.name} — ₹${p.price}`, value: p.id })),
  ];
  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddMember} featureLabel="Add Member">
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
            gap: Spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Member" back />
          <Card>
            <Select
              label="Gym *"
              value={form.gymId}
              options={gymOptions}
              onSelect={(v) => set("gymId", v)}
            />
            {errors.gymId ? (
              <Text
                style={{
                  color: Colors.error,
                  fontSize: Typography.xs,
                  marginTop: -8,
                  marginBottom: Spacing.md,
                }}
              >
                {errors.gymId}
              </Text>
            ) : null}
            <Input
              label="Full Name *"
              value={form.fullName}
              onChangeText={(v) => set("fullName", v)}
              placeholder="Member's full name"
              leftIcon="account-outline"
              error={errors.fullName}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder="member@email.com"
              keyboardType="email-address"
              leftIcon="email-outline"
            />
            <Input
              label="Mobile Number"
              value={form.mobileNumber}
              onChangeText={(v) => set("mobileNumber", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
            />
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => set("city", v)}
              placeholder="City"
              leftIcon="city-variant-outline"
            />
            <Select
              label="Gender"
              value={form.gender}
              options={genderOptions}
              onSelect={(v) => set("gender", v)}
            />
            <Select
              label="Membership Plan"
              value={form.membershipPlanId}
              options={planOptions}
              onSelect={(v) => set("membershipPlanId", v)}
            />
            <Input
              label="Start Date *"
              value={form.startDate}
              onChangeText={(v) => set("startDate", v)}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-outline"
              error={errors.startDate}
            />
          </Card>
          <Button
            label="Add Member"
            onPress={() => {
              if (validate()) mutation.mutate();
            }}
            loading={mutation.isPending}
          />
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}
