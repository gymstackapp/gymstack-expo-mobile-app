// mobile/src/screens/owner/AddMemberScreen.tsx
import { gymsApi, membersApi, membershipPlansApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input, PlanGate } from "@/components";
import { ImageUpload } from "@/components/ImageUpload";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const BLOOD_GROUP_OPTIONS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
].map((b) => ({ label: b, value: b }));

const FITNESS_GOAL_OPTIONS = [
  { label: "Weight Loss", value: "Weight Loss" },
  { label: "Muscle Gain", value: "Muscle Gain" },
  { label: "General Fitness", value: "General Fitness" },
  { label: "Endurance", value: "Endurance" },
  { label: "Flexibility", value: "Flexibility" },
  { label: "Rehabilitation", value: "Rehabilitation" },
];

const WORKOUT_TIME_OPTIONS = [
  { label: "Early Morning (5am–7am)", value: "Early Morning" },
  { label: "Morning (7am–10am)", value: "Morning" },
  { label: "Afternoon (12pm–3pm)", value: "Afternoon" },
  { label: "Evening (5pm–8pm)", value: "Evening" },
  { label: "Night (8pm–11pm)", value: "Night" },
];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: Colors.textMuted,
        fontSize: Typography.xs,
        fontWeight: "700",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
      }}
    >
      {text}
    </Text>
  );
}

export default function OwnerAddMemberScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddMember } = useSubscription();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    gymId: "",
    fullName: "",
    email: "",
    mobileNumber: "",
    membershipPlanId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    city: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    healthConditions: "",
    fitnessGoal: "",
    preferredWorkoutTime: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<any[]>([]);

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });

  // Load plans when gym changes
  useEffect(() => {
    if (form.gymId) {
      membershipPlansApi
        .list(form.gymId)
        .then(setPlans)
        .catch(() => setPlans([]));
    } else {
      setPlans([]);
    }
  }, [form.gymId]);

  // Auto-calculate end date when plan or start date changes
  useEffect(() => {
    if (form.membershipPlanId && form.startDate) {
      const plan = plans.find((p) => p.id === form.membershipPlanId);
      if (plan?.durationMonths) {
        setForm((f) => ({
          ...f,
          endDate: addMonths(form.startDate, plan.durationMonths),
        }));
      }
    }
  }, [form.membershipPlanId, form.startDate, plans]);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      membersApi.create({
        ...form,
        avatarUrl: avatarUrl ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMembers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Member added!" });
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
    ...plans.map((p) => ({
      label: `${p.name} — ₹${p.price} · ${p.durationMonths}mo`,
      value: p.id,
    })),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddMember} featureLabel="Add Member">
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Member" back />

          {/* Avatar */}
          <View style={{ alignItems: "center", marginVertical: Spacing.lg }}>
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="avatars"
              size={90}
              shape="circle"
              placeholder="Add Photo"
            />
          </View>

          <Card>
            <SectionLabel text="Basic Info" />
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
            <Dropdown
              label="Gender"
              value={form.gender}
              onChange={(v) => set("gender", v)}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              leftIcon="gender-male-female"
            />
            <Input
              label="Date of Birth"
              value={form.dateOfBirth}
              onChangeText={(v) => set("dateOfBirth", v)}
              placeholder="YYYY-MM-DD"
              leftIcon="cake-variant-outline"
            />

            <SectionLabel text="Address" />
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => set("city", v)}
              placeholder="City"
              leftIcon="city-variant-outline"
            />
            <Input
              label="Address"
              value={form.address}
              onChangeText={(v) => set("address", v)}
              placeholder="Street address"
              leftIcon="map-marker-outline"
              multiline
              numberOfLines={2}
            />

            <SectionLabel text="Membership" />
            <Dropdown
              label="Membership Plan"
              value={form.membershipPlanId}
              onChange={(v) => set("membershipPlanId", v)}
              options={planOptions}
              placeholder="Select a plan"
              leftIcon="tag-outline"
            />
            <Input
              label="Start Date *"
              value={form.startDate}
              onChangeText={(v) => set("startDate", v)}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-start"
              error={errors.startDate}
            />
            <Input
              label="End Date (auto-calculated)"
              value={form.endDate}
              onChangeText={(v) => set("endDate", v)}
              placeholder="Auto-filled from plan"
              leftIcon="calendar-end"
            />

            <SectionLabel text="Health Info" />
            <Dropdown
              label="Blood Group"
              value={form.bloodGroup}
              onChange={(v) => set("bloodGroup", v)}
              options={BLOOD_GROUP_OPTIONS}
              placeholder="Select blood group"
              leftIcon="water-outline"
            />
            <Input
              label="Health Conditions"
              value={form.healthConditions}
              onChangeText={(v) => set("healthConditions", v)}
              placeholder="e.g. Diabetes, Hypertension (if any)"
              leftIcon="heart-pulse"
              multiline
              numberOfLines={2}
            />
            <Dropdown
              label="Fitness Goal"
              value={form.fitnessGoal}
              onChange={(v) => set("fitnessGoal", v)}
              options={FITNESS_GOAL_OPTIONS}
              placeholder="Select fitness goal"
              leftIcon="bullseye-arrow"
            />
            <Dropdown
              label="Preferred Workout Time"
              value={form.preferredWorkoutTime}
              onChange={(v) => set("preferredWorkoutTime", v)}
              options={WORKOUT_TIME_OPTIONS}
              placeholder="Select preferred time"
              leftIcon="clock-outline"
            />

            <SectionLabel text="Emergency Contact" />
            <Input
              label="Emergency Contact Name"
              value={form.emergencyContactName}
              onChangeText={(v) => set("emergencyContactName", v)}
              placeholder="Contact person's name"
              leftIcon="account-alert-outline"
            />
            <Input
              label="Emergency Contact Phone"
              value={form.emergencyContactPhone}
              onChangeText={(v) => set("emergencyContactPhone", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-alert-outline"
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
