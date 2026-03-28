// mobile/src/screens/owner/ExpensesScreen.tsx
// Gym owner expenses management screen — list, add, edit, delete.

import { expensesApi, gymsApi } from "@/api/endpoints";
import {
  Button,
  Card,
  Dropdown,
  EmptyState,
  Header,
  Input,
  SkeletonGroup,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  gymId: string;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  expenseDate: string;
  receiptUrl: string | null;
  gym?: { id: string; name: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "Last Year", value: "last_year" },
];

const CATEGORY_OPTIONS = [
  { label: "Rent", value: "Rent" },
  { label: "Utilities", value: "Utilities" },
  { label: "Salary", value: "Salary" },
  { label: "Equipment", value: "Equipment" },
  { label: "Maintenance", value: "Maintenance" },
  { label: "Marketing", value: "Marketing" },
  { label: "Supplies", value: "Supplies" },
  { label: "Other", value: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Rent: Colors.primary,
  Utilities: "#F59E0B",
  Salary: "#10B981",
  Equipment: "#8B5CF6",
  Maintenance: "#F97316",
  Marketing: "#EC4899",
  Supplies: "#06B6D4",
  Other: Colors.textMuted,
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtAmount(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Category Badge
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string | null }) {
  const label = category ?? "Other";
  const color = CATEGORY_COLORS[label] ?? Colors.textMuted;
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: color + "20", borderColor: color + "40" },
      ]}
    >
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blank form
// ─────────────────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  gymId: "",
  title: "",
  amount: "",
  category: "",
  expenseDate: todayISO(),
  description: "",
  receiptUrl: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OwnerExpensesScreen() {
  const qc = useQueryClient();

  // Filters
  const [gymId, setGymId] = useState("");
  const [range, setRange] = useState("this_month");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });

  // ── Gyms query ──────────────────────────────────────────────────────────────
  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  // ── Expenses query ──────────────────────────────────────────────────────────
  const {
    data: expenses = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Expense[]>({
    queryKey: ["ownerExpenses", gymId, range],
    queryFn: () =>
      expensesApi.list({
        gymId: gymId || undefined,
        range: range || undefined,
      }) as Promise<Expense[]>,
    staleTime: 60_000,
  });

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalAmount = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      expensesApi.create({
        gymId: form.gymId || gymId || (gyms as Gym[])[0]?.id,
        title: form.title.trim(),
        amount: parseFloat(form.amount) || 0,
        category: form.category || undefined,
        expenseDate: form.expenseDate,
        description: form.description.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      closeModal();
      Toast.show({ type: "success", text1: "Expense added!" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      expensesApi.update(editingId!, {
        title: form.title.trim(),
        amount: parseFloat(form.amount) || 0,
        category: form.category || undefined,
        expenseDate: form.expenseDate,
        description: form.description.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      closeModal();
      Toast.show({ type: "success", text1: "Expense updated!" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      Toast.show({ type: "success", text1: "Expense deleted" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...BLANK_FORM,
      gymId: gymId || (gyms as Gym[])[0]?.id || "",
      expenseDate: todayISO(),
    });
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      gymId: expense.gymId,
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category ?? "",
      expenseDate: expense.expenseDate?.slice(0, 10) ?? todayISO(),
      description: expense.description ?? "",
      receiptUrl: expense.receiptUrl ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Toast.show({ type: "error", text1: "Title is required" });
      return;
    }
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      Toast.show({ type: "error", text1: "Valid amount is required" });
      return;
    }
    if (!form.expenseDate) {
      Toast.show({ type: "error", text1: "Expense date is required" });
      return;
    }
    const effectiveGymId =
      form.gymId || gymId || (gyms as Gym[])[0]?.id;
    if (!effectiveGymId) {
      Toast.show({ type: "error", text1: "Please select a gym" });
      return;
    }
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const confirmDelete = (expense: Expense) => {
    showAlert(
      "Delete Expense",
      `Delete "${expense.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(expense.id),
        },
      ],
    );
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const multiGym = (gyms as Gym[]).length > 1;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <Header
          title="Expenses"
          menu
          right={
            <TouchableOpacity style={s.addBtn} onPress={openAdd}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />

        {/* Gym filter pills */}
        {multiGym && (
          <View style={s.pillsRow}>
            {[{ id: "", name: "All" } as Gym, ...(gyms as Gym[])].map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={[s.pill, gymId === g.id && s.pillActive]}
              >
                <Text
                  style={[s.pillText, gymId === g.id && s.pillTextActive]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Range filter */}
        <Dropdown
          label="Date Range"
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
          leftIcon="calendar-range"
        />

        {/* Summary stats */}
        {!isLoading && expenses.length > 0 && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Expenses</Text>
              <Text style={s.statValue}>{fmtAmount(totalAmount)}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Count</Text>
              <Text style={s.statValue}>{expenses.length}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup
            variant="card"
            count={4}
            itemHeight={88}
            gap={Spacing.md}
          />
        </View>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No expenses"
          subtitle="Track your gym expenses to manage finances better"
          action={
            <TouchableOpacity style={s.emptyAction} onPress={openAdd}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={s.emptyActionText}>Add Expense</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList<Expense>
          data={expenses}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.list}
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
            <View style={{ height: Spacing.md }} />
          )}
          renderItem={({ item: expense }) => (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => openEdit(expense)}
            >
              <Card>
                <View style={s.expenseRow}>
                  {/* Left: icon */}
                  <View style={s.expenseIconWrap}>
                    <Icon
                      name="cash-multiple"
                      size={20}
                      color={Colors.error}
                    />
                  </View>

                  {/* Middle: title + meta */}
                  <View style={s.expenseInfo}>
                    <Text style={s.expenseTitle} numberOfLines={1}>
                      {expense.title}
                    </Text>
                    <View style={s.expenseMeta}>
                      <CategoryBadge category={expense.category} />
                      <Text style={s.expenseDate}>
                        {fmtDate(expense.expenseDate)}
                      </Text>
                    </View>
                    {expense.gym?.name && multiGym && (
                      <Text style={s.expenseGym}>{expense.gym.name}</Text>
                    )}
                  </View>

                  {/* Right: amount + delete */}
                  <View style={s.expenseRight}>
                    <Text style={s.expenseAmount}>
                      {fmtAmount(Number(expense.amount))}
                    </Text>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => confirmDelete(expense)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="trash-can-outline"
                        size={16}
                        color={Colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Modal header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingId ? "Edit Expense" : "New Expense"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Gym selector — only if multiple gyms */}
            {multiGym && (
              <Dropdown
                label="Gym *"
                value={form.gymId}
                onChange={(v) => set("gymId", v)}
                options={(gyms as Gym[]).map((g) => ({
                  label: g.name,
                  value: g.id,
                }))}
                placeholder="Select gym"
                leftIcon="domain"
              />
            )}

            <Input
              label="Title *"
              value={form.title}
              onChangeText={(v) => set("title", v)}
              placeholder="e.g. Monthly Rent"
            />

            <Input
              label="Amount *"
              value={form.amount}
              onChangeText={(v) => set("amount", v)}
              keyboardType="numeric"
              placeholder="0"
            />

            <Dropdown
              label="Category"
              value={form.category}
              onChange={(v) => set("category", v)}
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
              leftIcon="tag-outline"
            />

            <Input
              label="Expense Date *"
              value={form.expenseDate}
              onChangeText={(v) => set("expenseDate", v)}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
            />

            <Input
              label="Description"
              value={form.description}
              onChangeText={(v) => set("description", v)}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
            />

            <Input
              label="Receipt URL"
              value={form.receiptUrl}
              onChangeText={(v) => set("receiptUrl", v)}
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
            />

            <Button
              label={editingId ? "Save Changes" : "Add Expense"}
              onPress={handleSubmit}
              loading={isMutating}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
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

  // Gym filter pills
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  pillText: { color: Colors.textMuted, fontSize: Typography.xs },
  pillTextActive: { color: Colors.primary, fontWeight: "700" },

  // Summary stats
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: "center",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },

  // List
  list: { padding: Spacing.lg, paddingBottom: 32 },

  // Expense card row
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  expenseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseInfo: { flex: 1, gap: 4 },
  expenseTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "600",
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  expenseDate: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  expenseGym: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  expenseAmount: {
    color: Colors.error,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  deleteBtn: {
    padding: 2,
  },

  // Category badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Empty state action
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

  // Modal
  modalScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
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
});
