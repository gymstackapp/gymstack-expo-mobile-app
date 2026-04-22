// mobile/src/screens/owner/AddTrainerScreen.tsx
// Core fields: gym, fullName, mobileNumber (required)
// Optional: experienceYears, certifications, bio, specializations
// Backend handles: profile lookup by mobile, create/link trainer, send SMS/notification

import { gymsApi, trainersApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input, PlanGate } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const SPECIALIZATIONS = [
  "Weight Training", "Cardio", "Yoga", "Zumba", "CrossFit",
  "Boxing", "HIIT", "Pilates", "Nutrition", "Swimming",
  "Personal Training", "Stretching", "Rehabilitation", "Dance Fitness", "Martial Arts",
];

export default function OwnerAddTrainerScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddTrainer } = useSubscription();

  const [form, setForm] = useState({
    gymId:          "",
    fullName:       "",
    mobileNumber:   "",
    bio:            "",
    experienceYears: "0",
    certifications: "",
    specializations: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn:  gymsApi.list,
    staleTime: 5 * 60_000,
  });

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const toggleSpec = (s: string) =>
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter((x) => x !== s)
        : [...f.specializations, s],
    }));

  const mutation = useMutation({
    mutationFn: () =>
      trainersApi.create({
        gymId:        form.gymId,
        fullName:     form.fullName,
        mobileNumber: form.mobileNumber,
        bio:          form.bio.trim() || undefined,
        experienceYears: parseInt(form.experienceYears) || 0,
        certifications: form.certifications
          ? form.certifications.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        specializations: form.specializations,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerTrainers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Trainer added!" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to add trainer" }),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.gymId) e.gymId = "Select a gym";
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
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
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Trainer" back />

          {/* SMS callout */}
          <View style={styles.callout}>
            <Icon name="message-text-outline" size={16} color={Colors.primary} style={{ marginTop: 1 }} />
            <Text style={styles.calloutText}>
              The trainer will receive an SMS to complete their profile. You only
              need their name and mobile number to get started.
            </Text>
          </View>

          {/* Required fields */}
          <Card>
            <Text style={styles.sectionTitle}>Trainer Details</Text>
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
              label="Mobile Number *"
              value={form.mobileNumber}
              onChangeText={(v) => set("mobileNumber", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
              error={errors.mobileNumber}
            />
          </Card>

          {/* Optional fields */}
          <Card>
            <Text style={styles.sectionTitle}>
              Professional Details{" "}
              <Text style={styles.optional}>(optional)</Text>
            </Text>

            <Input
              label="Years of Experience"
              value={form.experienceYears}
              onChangeText={(v) => set("experienceYears", v)}
              placeholder="0"
              keyboardType="number-pad"
              leftIcon="briefcase-outline"
            />
            <Input
              label="Certifications (comma separated)"
              value={form.certifications}
              onChangeText={(v) => set("certifications", v)}
              placeholder="ACE, NASM, ISSA..."
              leftIcon="certificate-outline"
            />
            <Input
              label="Bio"
              value={form.bio}
              onChangeText={(v) => set("bio", v)}
              placeholder="Brief introduction about the trainer..."
              multiline
              numberOfLines={3}
            />

            {/* Specializations */}
            <View style={{ marginTop: Spacing.xs }}>
              <Text style={styles.fieldLabel}>Specializations</Text>
              <View style={styles.specGrid}>
                {SPECIALIZATIONS.map((s) => {
                  const active = form.specializations.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleSpec(s)}
                      style={[
                        styles.specToggle,
                        active ? styles.specActive : styles.specInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.specText,
                          { color: active ? Colors.primary : Colors.textMuted },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Card>

          <Button
            label="Add Trainer"
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

const styles = StyleSheet.create({
  callout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  calloutText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    flex: 1,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  optional: {
    color: Colors.textMuted,
    fontWeight: "400",
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  specActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary + "50",
  },
  specInactive: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  specText: { fontSize: 12 },
});
