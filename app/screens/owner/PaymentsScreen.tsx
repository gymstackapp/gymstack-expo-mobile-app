// mobile/src/screens/owner/PaymentsScreen.tsx
import {
  gymsApi,
  membersApi,
  membershipPlansApi,
  paymentsApi,
} from "@/api/endpoints";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
  Gym,
  GymMemberListItem,
  MembersListResponse,
  MembershipPlan,
  OwnerPayment,
  PaymentsListResponse,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

const METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"];

export default function OwnerPaymentsScreen() {
  const { hasPayments } = useSubscription();
  const qc = useQueryClient();
  const [gymId, setGymId] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [gymId]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    gymId: "",
    memberId: "",
    membershipPlanId: "",
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [members, setMembers] = useState<GymMemberListItem[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, refetch, isRefetching } =
    useQuery<PaymentsListResponse>({
      queryKey: ["ownerPayments", gymId, page],
      queryFn: () =>
        paymentsApi.list({
          gymId: gymId || undefined,
          page,
        }) as Promise<PaymentsListResponse>,
      enabled: hasPayments,
      staleTime: 60_000,
    });

  const payments: OwnerPayment[] = data?.payments ?? [];
  const monthTotal: number = data?.monthTotal ?? 0;
  const totalPages: number = data?.pages ?? 1;

  useEffect(() => {
    if (form.gymId) {
      membersApi
        .list({ gymId: form.gymId })
        .then((d: unknown) =>
          setMembers((d as MembersListResponse).members ?? []),
        )
        .catch(() => {});
      membershipPlansApi
        .list(form.gymId)
        .then((p: unknown) => setPlans(p as MembershipPlan[]))
        .catch(() => {});
    }
  }, [form.gymId]);

  const addMutation = useMutation({
    mutationFn: () => paymentsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerPayments"] });
      setShowAdd(false);
      setForm((f) => ({
        ...f,
        memberId: "",
        membershipPlanId: "",
        amount: "",
        notes: "",
      }));
      Toast.show({ type: "success", text1: "Payment recorded! 💳" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <SafeAreaView style={ps.safe}>
      <View style={ps.top}>
        <Header
          menu
          title="Payments"
          subtitle={`${fmt(monthTotal)} this month`}
          right={
            hasPayments ? (
              <TouchableOpacity
                style={ps.addBtn}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />
        {gyms.length > 1 && (
          <View style={ps.pills}>
            {[{ id: "", name: "All" } as Gym, ...gyms].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[ps.pill, gymId === g.id && ps.pillA]}
              >
                <Text style={[ps.pillT, gymId === g.id && ps.pillTA]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PlanGate allowed={hasPayments} featureLabel="Payment Management">
        {isLoading ? (
          <View style={{ padding: Spacing.lg }}>
            <SkeletonGroup count={5} itemHeight={70} gap={Spacing.sm} />
          </View>
        ) : payments.length === 0 ? (
          <EmptyState
            icon="credit-card-outline"
            title="No payments yet"
            subtitle="Record your first payment"
            action={
              <TouchableOpacity
                style={ps.emptyAction}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="plus" size={16} color="#fff" />
                <Text style={ps.emptyActionText}>Record Payment</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <FlatList<OwnerPayment>
            data={payments}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.sm }} />
            )}
            renderItem={({ item: p }) => (
              <Card style={ps.payCard}>
                <View style={ps.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ps.payName}>
                      {p.member?.profile?.fullName}
                    </Text>
                    <Text style={ps.paySub}>
                      {p.gym?.name} · {p.planNameSnapshot ?? "Payment"}
                    </Text>
                    <Text style={ps.payDate}>
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                      {" · "}
                      {p.paymentMethod ?? "CASH"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={ps.payAmount}>{fmt(p.amount)}</Text>
                    <Badge
                      label={p.status}
                      variant={p.status === "COMPLETED" ? "success" : "warning"}
                    />
                  </View>
                </View>
              </Card>
            )}
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={ps.pagination}>
                  <TouchableOpacity
                    style={[ps.pageBtn, page === 1 && ps.pageBtnDisabled]}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <Icon
                      name="chevron-left"
                      size={16}
                      color={page === 1 ? Colors.textMuted : Colors.primary}
                    />
                    <Text
                      style={[
                        ps.pageBtnText,
                        page === 1 && ps.pageBtnTextDisabled,
                      ]}
                    >
                      Prev
                    </Text>
                  </TouchableOpacity>
                  <Text style={ps.pageInfo}>
                    Page {page} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      ps.pageBtn,
                      page === totalPages && ps.pageBtnDisabled,
                    ]}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <Text
                      style={[
                        ps.pageBtnText,
                        page === totalPages && ps.pageBtnTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={
                        page === totalPages ? Colors.textMuted : Colors.primary
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </PlanGate>

      {/* Add Payment Modal */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={{
              padding: Spacing.lg,
              paddingBottom: 40,
              gap: Spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={ps.modalHeader}>
              <Text style={ps.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={ps.fieldLabel}>Gym *</Text>
              <View style={ps.chips}>
                {gyms.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => set("gymId", g.id)}
                    style={[ps.chip, form.gymId === g.id && ps.chipA]}
                  >
                    <Text style={[ps.chipT, form.gymId === g.id && ps.chipTA]}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={ps.fieldLabel}>Member *</Text>
              {form.memberId ? (
                <View style={ps.selectedMember}>
                  <Icon
                    name="account-circle-outline"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={ps.selectedMemberName} numberOfLines={1}>
                    {members.find((m) => m.id === form.memberId)?.profile
                      ?.fullName ?? "Unknown"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      set("memberId", "");
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
                <View style={ps.dropdown}>
                  <View
                    style={[
                      ps.searchBox,
                      {
                        borderRadius: 0,
                        borderWidth: 0,
                        borderBottomWidth: 1,
                        backgroundColor: "transparent",
                      },
                    ]}
                  >
                    <Icon name="magnify" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={ps.searchInput}
                      value={memberSearch}
                      onChangeText={setMemberSearch}
                      placeholder="Search member…"
                      placeholderTextColor={Colors.textMuted}
                    />
                    {memberSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setMemberSearch("")}>
                        <Icon name="close" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {!form.gymId ? (
                    <View style={ps.dropdownEmpty}>
                      <Text style={ps.dropdownEmptyText}>
                        Select a gym first
                      </Text>
                    </View>
                  ) : (
                    (() => {
                      const filtered = members
                        .filter(
                          (m) =>
                            !memberSearch ||
                            m.profile?.fullName
                              ?.toLowerCase()
                              .includes(memberSearch.toLowerCase()),
                        )
                        .slice(0, 10);
                      return filtered.length === 0 ? (
                        <View style={ps.dropdownEmpty}>
                          <Text style={ps.dropdownEmptyText}>
                            No members found
                          </Text>
                        </View>
                      ) : (
                        filtered.map((m) => (
                          <TouchableOpacity
                            key={m.id}
                            style={ps.dropdownItem}
                            onPress={() => {
                              set("memberId", m.id);
                              setMemberSearch("");
                            }}
                          >
                            <Icon
                              name="account-outline"
                              size={14}
                              color={Colors.textMuted}
                            />
                            <Text style={ps.dropdownText} numberOfLines={1}>
                              {m.profile?.fullName}
                            </Text>
                          </TouchableOpacity>
                        ))
                      );
                    })()
                  )}
                </View>
              )}
            </View>

            <View>
              <Text style={ps.fieldLabel}>Plan</Text>
              <View style={ps.chips}>
                {[{ id: "", name: "None" } as MembershipPlan, ...plans].map(
                  (p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => set("membershipPlanId", p.id)}
                      style={[
                        ps.chip,
                        form.membershipPlanId === p.id && ps.chipA,
                      ]}
                    >
                      <Text
                        style={[
                          ps.chipT,
                          form.membershipPlanId === p.id && ps.chipTA,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>

            <Input
              label="Amount (₹) *"
              value={form.amount}
              onChangeText={(v) => set("amount", v)}
              keyboardType="numeric"
              leftIcon="currency-inr"
            />
            <Input
              label="Payment Date"
              value={form.paymentDate}
              onChangeText={(v) => set("paymentDate", v)}
              leftIcon="calendar-outline"
            />

            <View>
              <Text style={ps.fieldLabel}>Payment Method</Text>
              <View style={ps.chips}>
                {METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => set("paymentMethod", m)}
                    style={[ps.chip, form.paymentMethod === m && ps.chipA]}
                  >
                    <Text
                      style={[ps.chipT, form.paymentMethod === m && ps.chipTA]}
                    >
                      {m.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Notes"
              value={form.notes}
              onChangeText={(v) => set("notes", v)}
              placeholder="Optional note..."
            />

            <Button
              label="Record Payment"
              onPress={() => {
                if (!form.gymId || !form.memberId || !form.amount) {
                  Toast.show({
                    type: "error",
                    text1: "Gym, member and amount are required",
                  });
                  return;
                }
                addMutation.mutate();
              }}
              loading={addMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pills: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillA: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  pillT: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTA: { color: Colors.primary, fontWeight: "700" },
  payCard: {},
  payRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  payName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  paySub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  payDate: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  payAmount: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipA: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipT: { color: Colors.textMuted, fontSize: Typography.xs },
  chipTA: { color: Colors.primary, fontWeight: "700" },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.sm,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  pageBtnDisabled: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  pageBtnText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  pageBtnTextDisabled: { color: Colors.textMuted },
  pageInfo: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },

  // Member search dropdown
  selectedMember: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  selectedMemberName: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    paddingVertical: 0,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  dropdownEmpty: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dropdownEmptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontStyle: "italic",
  },
});
