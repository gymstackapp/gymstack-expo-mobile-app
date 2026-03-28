// mobile/src/screens/owner/AddPaymentScreen.tsx
import { membersApi, membershipPlansApi, paymentsApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input } from "@/components";
import { Colors, Spacing } from "@/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const PAYMENT_METHOD_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "CARD" },
  { label: "Net Banking", value: "NET_BANKING" },
  { label: "Cheque", value: "CHEQUE" },
];

const STATUS_OPTIONS = [
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
];

export default function AddPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();

  const { memberId, gymId: initialGymId } = (route.params as any) ?? {};

  const [form, setForm] = useState({
    memberId: memberId ?? "",
    gymId: initialGymId ?? "",
    membershipPlanId: "",
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    status: "COMPLETED",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<any[]>([]);

  // If memberId is provided, fetch member info for display
  const { data: member } = useQuery({
    queryKey: ["ownerMember", memberId],
    queryFn: () => membersApi.get(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60_000,
  });

  // Load plans when gymId is known
  useEffect(() => {
    const gId = form.gymId || (member as any)?.gym?.id;
    if (gId) {
      membershipPlansApi
        .list(gId)
        .then(setPlans)
        .catch(() => setPlans([]));
    }
  }, [form.gymId, member]);

  // Auto-fill amount from selected plan
  useEffect(() => {
    if (form.membershipPlanId) {
      const plan = plans.find((p) => p.id === form.membershipPlanId);
      if (plan?.price) {
        setForm((f) => ({ ...f, amount: String(plan.price) }));
      }
    }
  }, [form.membershipPlanId, plans]);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      paymentsApi.create({
        ...form,
        gymId: form.gymId || (member as any)?.gym?.id,
        amount: parseFloat(form.amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMember", memberId] });
      qc.invalidateQueries({ queryKey: ["ownerPayments"] });
      Toast.show({ type: "success", text1: "Payment recorded!" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Failed to record payment" }),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(parseFloat(form.amount)))
      e.amount = "Enter a valid amount";
    if (!form.paymentDate) e.paymentDate = "Payment date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const planOptions = [
    { label: "No plan", value: "" },
    ...plans.map((p) => ({
      label: `${p.name} — ₹${p.price}`,
      value: p.id,
    })),
  ];

  const memberName =
    (member as any)?.profile?.fullName ?? "Member";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Add Payment" back />

        {memberId && (
          <View
            style={{
              backgroundColor: Colors.primaryFaded,
              borderRadius: 10,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
            }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {memberName}
            </Text>
            {(member as any)?.gym?.name ? (
              <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {(member as any).gym.name}
              </Text>
            ) : null}
          </View>
        )}

        <Card>
          <Dropdown
            label="Membership Plan"
            value={form.membershipPlanId}
            onChange={(v) => set("membershipPlanId", v)}
            options={planOptions}
            placeholder="Select plan (optional)"
            leftIcon="tag-outline"
          />
          <Input
            label="Amount (₹) *"
            value={form.amount}
            onChangeText={(v) => set("amount", v)}
            keyboardType="numeric"
            leftIcon="currency-inr"
            placeholder="0.00"
            error={errors.amount}
          />
          <Dropdown
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(v) => set("paymentMethod", v)}
            options={PAYMENT_METHOD_OPTIONS}
            leftIcon="credit-card-outline"
          />
          <Input
            label="Payment Date *"
            value={form.paymentDate}
            onChangeText={(v) => set("paymentDate", v)}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            error={errors.paymentDate}
          />
          <Dropdown
            label="Status"
            value={form.status}
            onChange={(v) => set("status", v)}
            options={STATUS_OPTIONS}
            leftIcon="check-circle-outline"
          />
          <Input
            label="Notes"
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
            placeholder="Optional notes..."
            leftIcon="note-text-outline"
            multiline
            numberOfLines={2}
          />
        </Card>

        <View style={{ marginTop: Spacing.lg }}>
          <Button
            label="Record Payment"
            onPress={() => {
              if (validate()) mutation.mutate();
            }}
            loading={mutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
