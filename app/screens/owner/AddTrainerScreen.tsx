// mobile/src/screens/owner/AddTrainerScreen.tsx
// Core fields: gym, fullName, mobileNumber (required)
// Optional: experienceYears, certifications, bio, specializations
// Backend handles: profile lookup by mobile, create/link trainer, send SMS/notification

import { api } from "@/api/client";
import { gymsApi, trainersApi } from "@/api/endpoints";
import {
  Button,
  Card,
  Dropdown,
  Header,
  ImageUpload,
  Input,
  PlanGate,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
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
  "Weight Training",
  "Cardio",
  "Yoga",
  "Zumba",
  "CrossFit",
  "Boxing",
  "HIIT",
  "Pilates",
  "Nutrition",
  "Swimming",
  "Personal Training",
  "Stretching",
  "Rehabilitation",
  "Dance Fitness",
  "Martial Arts",
];

const GENDER_OPTIONS = [
  { label: "Select gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

export default function OwnerAddTrainerScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddTrainer } = useSubscription();

  const [form, setForm] = useState({
    gymId: "",
    fullName: "",
    mobileNumber: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    avatarUrl: "",
    bio: "",
    experienceYears: "0",
    certifications: "",
    specializations: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  type MobileStatus =
    | "idle"
    | "checking"
    | "available"
    | "exists_active"
    | "exists_invited";
  const [mobileStatus, setMobileStatus] = useState<MobileStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkMobile = (digits: string) => {
    if (digits.length !== 10) {
      setMobileStatus("idle");
      return;
    }
    setMobileStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data: any = await api.get("/api/auth/check-mobile-status", {
          mobile: digits,
        });
        if (data.status === "NOT_FOUND") setMobileStatus("available");
        else if (data.status === "ACTIVE") setMobileStatus("exists_active");
        else setMobileStatus("exists_invited");
      } catch {
        setMobileStatus("idle");
      }
    }, 500);
  };

  const mobileSuccess =
    mobileStatus === "available" ? "New user — an SMS will be sent" : undefined;
  const mobileHint =
    mobileStatus === "exists_active"
      ? "Existing GymStack user — will be linked to your gym"
      : mobileStatus === "exists_invited"
        ? "Already invited — a fresh SMS will be sent"
        : undefined;

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
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
        gymId: form.gymId,
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        email: form.email.trim() || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
        bio: form.bio.trim() || undefined,
        experienceYears: parseInt(form.experienceYears) || 0,
        certifications: form.certifications
          ? form.certifications
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
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
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to add trainer",
      }),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.gymId) e.gymId = "Select a gym";
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
    else if (form.mobileNumber.length !== 10)
      e.mobileNumber = "Enter a valid 10-digit mobile number";
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
            gap: Spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Trainer" back />

          {/* SMS callout */}
          <View style={styles.callout}>
            <Icon
              name="message-text-outline"
              size={16}
              color={Colors.primary}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.calloutText}>
              The trainer will receive an SMS to complete their profile. You
              only need their name and mobile number to get started.
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
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 10);
                set("mobileNumber", digits);
                setMobileStatus("idle");
                checkMobile(digits);
              }}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon="phone-outline"
              checking={mobileStatus === "checking"}
              success={mobileSuccess}
              hint={mobileHint}
              error={errors.mobileNumber}
            />
          </Card>

          {/* Optional profile fields */}
          <Card>
            <Text style={styles.sectionTitle}>
              Profile Details <Text style={styles.optional}>(optional)</Text>
            </Text>
            <ImageUpload
              value={form.avatarUrl}
              onChange={(v) => set("avatarUrl", v ?? "")}
              folder="avatars"
              size={80}
              shape="circle"
              placeholder="Add Photo"
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder="trainer@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email-outline"
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
              label="Address"
              value={form.address}
              onChangeText={(v) => set("address", v)}
              placeholder="Street, city, state"
              leftIcon="map-marker-outline"
              autoCapitalize="sentences"
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
            disabled={mobileStatus === "checking"}
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
