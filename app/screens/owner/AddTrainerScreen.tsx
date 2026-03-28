// mobile/src/screens/owner/AddTrainerScreen.tsx
import { gymsApi, trainersApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input, PlanGate } from "@/components";
import { ImageUpload } from "@/components/ImageUpload";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const SPECIALIZATIONS = [
  "Strength Training",
  "Cardio",
  "Yoga",
  "Nutrition",
  "CrossFit",
  "Pilates",
  "Boxing",
  "Zumba",
  "Rehabilitation",
  "HIIT",
  "Calisthenics",
  "Swimming",
  "Cycling",
  "Functional Training",
  "Martial Arts",
];

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

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

export default function OwnerAddTrainerScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddTrainer } = useSubscription();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    gymId: "",
    fullName: "",
    email: "",
    mobileNumber: "",
    city: "",
    gender: "",
    dateOfBirth: "",
    experienceYears: "",
    bio: "",
    certifications: "",
  });
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const toggleSpec = (spec: string) => {
    setSpecializations((s) =>
      s.includes(spec) ? s.filter((x) => x !== spec) : [...s, spec]
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      trainersApi.create({
        ...form,
        avatarUrl: avatarUrl ?? undefined,
        experienceYears: parseInt(form.experienceYears) || 0,
        specializations,
        certifications: form.certifications
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerTrainers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Trainer added!" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to add trainer",
      }),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.gymId) e.gymId = "Select a gym";
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const gymOptions = (gyms as any[]).map((g: any) => ({
    label: g.name,
    value: g.id,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddTrainer} featureLabel="Add Trainer">
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Trainer" back />

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
              placeholder="Trainer's full name"
              leftIcon="account-outline"
              error={errors.fullName}
            />
            <Input
              label="Email *"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder="trainer@email.com"
              keyboardType="email-address"
              leftIcon="email-outline"
              error={errors.email}
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
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => set("city", v)}
              placeholder="City"
              leftIcon="city-variant-outline"
            />

            <SectionLabel text="Professional Details" />
            <Input
              label="Experience (years)"
              value={form.experienceYears}
              onChangeText={(v) => set("experienceYears", v)}
              keyboardType="numeric"
              leftIcon="briefcase-outline"
              placeholder="e.g. 3"
            />
            <Input
              label="Certifications (comma separated)"
              value={form.certifications}
              onChangeText={(v) => set("certifications", v)}
              placeholder="e.g. ACE, NASM, ISSA"
              leftIcon="certificate-outline"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Bio"
              value={form.bio}
              onChangeText={(v) => set("bio", v)}
              placeholder="Brief bio about the trainer..."
              leftIcon="text-account"
              multiline
              numberOfLines={3}
            />
          </Card>

          {/* Specializations */}
          <View style={{ marginTop: Spacing.lg }}>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: Typography.xs,
                fontWeight: "700",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: Spacing.sm,
              }}
            >
              Specializations
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
              {SPECIALIZATIONS.map((spec) => {
                const active = specializations.includes(spec);
                return (
                  <TouchableOpacity
                    key={spec}
                    onPress={() => toggleSpec(spec)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: Radius.full,
                      backgroundColor: active
                        ? Colors.primaryFaded
                        : Colors.surfaceRaised,
                      borderWidth: 1,
                      borderColor: active ? Colors.primary : Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? Colors.primary : Colors.textMuted,
                        fontSize: Typography.xs,
                        fontWeight: active ? "700" : "400",
                      }}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <Button
              label="Add Trainer"
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
