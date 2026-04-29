// mobile/src/screens/owner/AddMemberScreen.tsx
// Full-featured add-member form — mirrors the web app:
//   Required: gym, name, mobile, plan, start date, end date, payment received
//   Optional: email, gender, date of birth, address, goals, avatar URL
//   Features: debounced mobile status check, auto end-date from plan duration

import { api } from "@/api/client";
import { gymsApi, membersApi, membershipPlansApi } from "@/api/endpoints";
import {
  Button,
  Card,
  DatePickerInput,
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
import React, { useEffect, useRef, useState } from "react";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: "Select gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().split("T")[0];
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

type MobileStatus =
  | "idle"
  | "checking"
  | "available"
  | "exists_active"
  | "exists_invited";

// ── Section header helper ─────────────────────────────────────────────────────

function SectionHead({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionHead}>
      <Icon name={icon} size={14} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

// ── Payment toggle ────────────────────────────────────────────────────────────

function PaymentToggle({
  value,
  onChange,
  error,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={styles.fieldLabel}>Payment Received *</Text>
      <View style={styles.paymentRow}>
        <TouchableOpacity
          style={[styles.payBtn, value === true && styles.payBtnYes]}
          onPress={() => onChange(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.payBtnText, value === true && styles.payBtnTextYes]}
          >
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payBtn, value === false && styles.payBtnNo]}
          onPress={() => onChange(false)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.payBtnText, value === false && styles.payBtnTextNo]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function OwnerAddMemberScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddMember } = useSubscription();

  // Required fields
  const [gymId, setGymId] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [membershipPlanId, setMembershipPlanId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [paymentReceived, setPaymentReceived] = useState<boolean | null>(null);

  // Optional fields
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [goals, setGoals] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [mobileStatus, setMobileStatus] = useState<MobileStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<any[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });
  const gymList = gyms as any[];

  // Pre-select first gym
  useEffect(() => {
    if (gymList.length > 0 && !gymId) setGymId(gymList[0].id);
  }, [gymList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load plans when gym changes
  useEffect(() => {
    if (!gymId) return;
    membershipPlansApi
      .list(gymId)
      .then((d) => setPlans(d as any[]))
      .catch(() => setPlans([]));
    setMembershipPlanId("");
    setEndDate("");
    setPaymentReceived(null);
  }, [gymId]);

  // Auto-compute end date from plan duration
  useEffect(() => {
    if (!membershipPlanId || !startDate) {
      setEndDate("");
      return;
    }
    const plan = plans.find((p) => p.id === membershipPlanId);
    if (plan?.durationMonths)
      setEndDate(addMonths(startDate, plan.durationMonths));
  }, [membershipPlanId, startDate, plans]);

  // Debounced mobile status check
  const checkMobile = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(-10);
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

  const clearError = (key: string) => setErrors((e) => ({ ...e, [key]: "" }));

  const selectedPlan = plans.find((p) => p.id === membershipPlanId);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!gymId) e.gymId = "Please select a gym";
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
    else if (mobileNumber.replace(/\D/g, "").length !== 10)
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (!membershipPlanId) e.membershipPlanId = "Membership plan is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "End date is required";
    if (paymentReceived === null)
      e.paymentReceived = "Please confirm payment status";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () =>
      membersApi.create({
        gymId,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        membershipPlanId: membershipPlanId || undefined,
        startDate,
        endDate: endDate || undefined,
        paymentReceived: paymentReceived ?? false,
        email: email.trim() || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
        goals: goals.trim()
          ? goals
              .split(/[\n,]/)
              .map((g) => g.trim())
              .filter(Boolean)
          : undefined,
        avatarUrl: avatarUrl || undefined,
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

  const gymOptions = gymList.map((g) => ({ label: g.name, value: g.id }));
  const planOptions = [
    { label: "Select a plan…", value: "" },
    ...plans
      ?.filter((p) => p?.isActive)
      .map((p) => ({
        label: `${p.name} — ₹${Number(p.price).toLocaleString("en-IN")} / ${p.durationMonths}mo`,
        value: p.id,
      })),
  ];

  // Mobile hint props for the Input component
  const mobileSuccess =
    mobileStatus === "available"
      ? "New member — an SMS will be sent"
      : undefined;
  const mobileHint =
    mobileStatus === "exists_active"
      ? "Existing GymStack user — will be linked to your gym"
      : mobileStatus === "exists_invited"
        ? "Already invited — a fresh SMS will be sent"
        : undefined;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddMember} featureLabel="Add Member">
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Add Member" back />

          {/* SMS callout */}
          <View style={styles.infoBanner}>
            <Icon
              name="message-text-outline"
              size={15}
              color={Colors.primary}
            />
            <Text style={styles.infoBannerText}>
              The member will receive an SMS to complete their profile. You only
              need their name, mobile, and plan to get started.
            </Text>
          </View>

          {/* ── Member Details ── */}
          <Card style={{ marginTop: Spacing.md }}>
            <SectionHead icon="account-outline" label="Member Details" />

            {gymList.length > 1 && (
              <Dropdown
                label="Gym *"
                value={gymId}
                onChange={(v) => {
                  setGymId(v);
                  clearError("gymId");
                }}
                options={gymOptions}
                placeholder="Select gym"
                leftIcon="dumbbell"
                error={errors.gymId}
              />
            )}

            <Input
              label="Full Name *"
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                clearError("fullName");
              }}
              placeholder="Member's full name"
              leftIcon="account-outline"
              autoCapitalize="words"
              error={errors.fullName}
            />

            <Input
              label="Mobile Number *"
              value={mobileNumber}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 10);
                setMobileNumber(digits);
                setMobileStatus("idle");
                clearError("mobileNumber");
                checkMobile(digits);
              }}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon="phone-outline"
              checking={mobileStatus === "checking"}
              success={mobileSuccess}
              hint={mobileHint}
              error={errors.mobileNumber}
            />

            {/* Optional fields */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="member@example.com"
              keyboardType="email-address"
              leftIcon="email-outline"
            />

            <Dropdown
              label="Gender"
              value={gender}
              onChange={setGender}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              leftIcon="gender-male-female"
            />

            <DatePickerInput
              label="Date of Birth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="Select date of birth"
              maxDate="today"
            />

            <Input
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Street, city, state"
              leftIcon="map-marker-outline"
              autoCapitalize="sentences"
            />

            <Input
              label="Goals"
              value={goals}
              onChangeText={setGoals}
              placeholder="Weight loss, Build muscle… (comma-separated)"
              leftIcon="target"
              multiline
              numberOfLines={2}
              autoCapitalize="sentences"
            />

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={styles.fieldLabel}>Profile Photo (optional)</Text>
              <ImageUpload
                value={avatarUrl}
                onChange={setAvatarUrl}
                folder="avatars"
                size={80}
                shape="circle"
                placeholder="Add Photo"
              />
            </View>
          </Card>

          {/* ── Membership ── */}
          <Card style={{ marginTop: Spacing.md }}>
            <SectionHead icon="credit-card-outline" label="Membership" />

            <Dropdown
              label="Membership Plan *"
              value={membershipPlanId}
              onChange={(v) => {
                setMembershipPlanId(v);
                setPaymentReceived(null);
                clearError("membershipPlanId");
              }}
              options={planOptions}
              placeholder="Select a plan…"
              leftIcon="tag-outline"
              error={errors.membershipPlanId}
            />

            {membershipPlanId ? (
              <>
                <DatePickerInput
                  label="Start Date *"
                  value={startDate}
                  onChange={(v) => {
                    setStartDate(v);
                    clearError("startDate");
                  }}
                  placeholder="Select start date"
                  error={errors.startDate}
                />

                <DatePickerInput
                  label="End Date *"
                  value={endDate}
                  onChange={(v) => {
                    setEndDate(v);
                    clearError("endDate");
                  }}
                  placeholder="Select end date"
                  error={errors.endDate}
                />

                {selectedPlan && (
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>
                      ₹{Number(selectedPlan.price).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

                <PaymentToggle
                  value={paymentReceived}
                  onChange={(v) => {
                    setPaymentReceived(v);
                    clearError("paymentReceived");
                  }}
                  error={errors.paymentReceived}
                />

                {paymentReceived === true && selectedPlan && (
                  <Text style={styles.payHint}>
                    ₹{Number(selectedPlan.price).toLocaleString("en-IN")} will
                    be recorded in gym revenue.
                  </Text>
                )}
                {paymentReceived === false && (
                  <Text style={[styles.payHint, { color: Colors.warning }]}>
                    Member will be added but no payment will be recorded.
                  </Text>
                )}
              </>
            ) : null}
          </Card>

          <View style={{ marginTop: Spacing.lg }}>
            <Button
              label="Add Member"
              onPress={() => {
                if (validate()) mutation.mutate();
              }}
              loading={mutation.isPending}
              disabled={mobileStatus === "checking"}
            />
          </View>
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoBannerText: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.sm,
    lineHeight: 18,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  amountLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  amountValue: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  paymentRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  payBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnYes: {
    backgroundColor: Colors.successFaded,
    borderColor: Colors.success + "80",
  },
  payBtnNo: {
    backgroundColor: Colors.errorFaded,
    borderColor: Colors.error + "80",
  },
  payBtnText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  payBtnTextYes: { color: Colors.success },
  payBtnTextNo: { color: Colors.error },
  errorText: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  payHint: {
    color: Colors.success,
    fontSize: Typography.xs,
    marginTop: -4,
    marginBottom: Spacing.sm,
  },
});
