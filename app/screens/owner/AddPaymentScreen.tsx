// mobile/src/screens/owner/AddPaymentScreen.tsx
import { membersApi, membershipPlansApi, paymentsApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

  // Member search (used when no memberId is pre-selected)
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .then((res: any) => setPlans(Array.isArray(res) ? res : (res?.plans ?? [])))
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

  // Debounced member search (only active when no memberId pre-provided)
  useEffect(() => {
    if (memberId) return;
    if (!memberSearch.trim()) {
      setMemberResults([]);
      return;
    }
    setSearchLoading(true);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      try {
        const data: any = await membersApi.list({
          search: memberSearch,
          page: 1,
        });
        setMemberResults(data.members ?? []);
      } catch {
        setMemberResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [memberSearch, memberId]);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      paymentsApi.create({
        ...form,
        gymId:
          form.gymId || (member as any)?.gym?.id || selectedMember?.gym?.id,
        amount: parseFloat(form.amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["ownerMember", form.memberId || memberId],
      });
      qc.invalidateQueries({ queryKey: ["ownerPayments"] });
      Toast.show({ type: "success", text1: "Payment recorded!" });
      navigation.goBack();
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to record payment",
      }),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!memberId && !form.memberId) e.memberId = "Select a member";
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

  const memberName = (member as any)?.profile?.fullName ?? "Member";

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

        {memberId ? (
          /* Pre-selected member banner */
          <View
            style={{
              backgroundColor: Colors.primaryFaded,
              borderRadius: Radius.lg,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
            }}
          >
            <Text
              style={{ color: Colors.primary, fontWeight: "700", fontSize: 14 }}
            >
              {memberName}
            </Text>
            {(member as any)?.gym?.name ? (
              <Text
                style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}
              >
                {(member as any).gym.name}
              </Text>
            ) : null}
          </View>
        ) : (
          /* Member search */
          <View style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: Typography.xs,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              Member *
            </Text>
            {selectedMember ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primaryFaded,
                  borderRadius: Radius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.primary + "33",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Colors.primary,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {selectedMember.profile.fullName}
                  </Text>
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {selectedMember.gym?.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMember(null);
                    setForm((f) => ({ ...f, memberId: "", gymId: "" }));
                    setMemberSearch("");
                  }}
                >
                  <Icon
                    name="close-circle"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.surfaceRaised,
                    borderRadius: Radius.lg,
                    borderWidth: 1,
                    borderColor: errors.memberId
                      ? Colors.error + "60"
                      : Colors.border,
                    paddingHorizontal: Spacing.md,
                    height: 48,
                  }}
                >
                  <Icon
                    name="magnify"
                    size={18}
                    color={Colors.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                    placeholder="Search member by name..."
                    placeholderTextColor={Colors.textMuted}
                    style={{
                      flex: 1,
                      color: Colors.textPrimary,
                      fontSize: Typography.sm,
                    }}
                  />
                </View>
                {errors.memberId ? (
                  <Text
                    style={{
                      color: Colors.error,
                      fontSize: Typography.xs,
                      marginTop: 4,
                    }}
                  >
                    {errors.memberId}
                  </Text>
                ) : null}
                {searchLoading && (
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: Typography.xs,
                      marginTop: 4,
                    }}
                  >
                    Searching...
                  </Text>
                )}
                {memberResults.length > 0 && (
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
                    {memberResults.slice(0, 6).map((m: any) => (
                      <TouchableOpacity
                        key={m.id}
                        style={{
                          padding: Spacing.md,
                          borderBottomWidth: 1,
                          borderBottomColor: Colors.border,
                        }}
                        onPress={() => {
                          setSelectedMember(m);
                          setForm((f) => ({
                            ...f,
                            memberId: m.id,
                            gymId: m.gym?.id ?? "",
                          }));
                          setMemberSearch("");
                          setMemberResults([]);
                          if (m.gym?.id)
                            membershipPlansApi
                              .list(m.gym.id)
                              .then((res: any) => setPlans(Array.isArray(res) ? res : (res?.plans ?? [])))
                              .catch(() => setPlans([]));
                        }}
                      >
                        <Text
                          style={{
                            color: Colors.textPrimary,
                            fontSize: Typography.sm,
                            fontWeight: "600",
                          }}
                        >
                          {m.profile.fullName}
                        </Text>
                        <Text
                          style={{
                            color: Colors.textMuted,
                            fontSize: Typography.xs,
                            marginTop: 1,
                          }}
                        >
                          {m.gym?.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
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
