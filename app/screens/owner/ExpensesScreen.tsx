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
  PlanGate,
  SkeletonGroup,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
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
  title: string;
  amount: number;
  category: string;
  description: string | null;
  expenseDate: string;
  receiptUrl: string | null;
  gym: {
    name: string;
  };
  gymId: string;
  addedBy: {
    fullName: string;
  };
}

interface ExpenseForm {
  gymId: string;
  title: string;
  amount: string;
  category: string;
  description: string;
  expenseDate: string;
  receiptUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "ELECTRICITY",
  "WATER",
  "RENT",
  "EQUIPMENT_PURCHASE",
  "EQUIPMENT_MAINTENANCE",
  "STAFF_SALARY",
  "MARKETING",
  "CLEANING",
  "INSURANCE",
  "INTERNET",
  "SOFTWARE",
  "MISCELLANEOUS",
];

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY: "Electricity",
  WATER: "Water",
  RENT: "Rent",
  EQUIPMENT_PURCHASE: "Equipment Purchase",
  EQUIPMENT_MAINTENANCE: "Equipment Maintenance",
  STAFF_SALARY: "Staff Salary",
  MARKETING: "Marketing",
  CLEANING: "Cleaning",
  INSURANCE: "Insurance",
  INTERNET: "Internet",
  SOFTWARE: "Software",
  MISCELLANEOUS: "Miscellaneous",
};

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY: "#F59E0B",
  WATER: "#3B82F6",
  RENT: "#8B5CF6",
  EQUIPMENT_PURCHASE: "#F97316",
  EQUIPMENT_MAINTENANCE: "#EF4444",
  STAFF_SALARY: "#10B981",
  MARKETING: "#EC4899",
  CLEANING: "#14B8A6",
  INSURANCE: "#6366F1",
  INTERNET: "#06B6D4",
  SOFTWARE: "#8B5CF6",
  MISCELLANEOUS: "#6B7280",
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "last_90_days", label: "This Quarter (90 days)" },
  { key: "financial_year", label: "Financial Year (Apr–Mar)" },
  { key: "custom", label: "Custom Range" },
];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const label = CATEGORY_LABELS[category || "MISCELLANEOUS"] || "Miscellaneous";
  const color =
    CATEGORY_COLORS[category || "MISCELLANEOUS"] ||
    CATEGORY_COLORS.MISCELLANEOUS;
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
  category: "MISCELLANEOUS",
  description: "",
  expenseDate: localDateString(),
  receiptUrl: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OwnerExpensesScreen() {
  const qc = useQueryClient();
  const { hasExpenses } = useSubscription();

  // Filters
  const [gymId, setGymId] = useState("");
  const [range, setRange] = useState("");
  const [category, setCategory] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [gymId, range, category, customStart, customEnd]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>({ ...BLANK_FORM });

  // ── Gyms query ──────────────────────────────────────────────────────────────
  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  // ── Expenses query ──────────────────────────────────────────────────────────
  const {
    data: expensesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "ownerExpenses",
      gymId,
      range,
      category,
      customStart,
      customEnd,
      page,
    ],
    queryFn: () => {
      const params: any = { range: range || "last_30_days", page };
      if (gymId) params.gymId = gymId;
      if (category) params.category = category;
      if (range === "custom" && customStart && customEnd) {
        params.customStart = customStart;
        params.customEnd = customEnd;
      }
      return expensesApi.list(params) as Promise<{
        expenses: Expense[];
        totalAmount: number;
        byCategory: { category: string; total: number; count: number }[];
        total: number;
        pages: number;
      }>;
    },
    staleTime: 60_000,
  });

  const expenses = expensesData?.expenses || [];
  const totalAmount = expensesData?.totalAmount || 0;
  const byCategory = expensesData?.byCategory || [];
  const totalPages = expensesData?.pages ?? 1;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      expensesApi.create({
        gymId: form.gymId || gymId || (gyms as Gym[])[0]?.id,
        title: form.title.trim(),
        amount: parseFloat(form.amount) || 0,
        category: form.category,
        expenseDate: form.expenseDate,
        description: form.description.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      closeModal();
      Toast.show({ type: "success", text1: "Expense added!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      expensesApi.update(editingId!, {
        title: form.title.trim(),
        amount: parseFloat(form.amount) || 0,
        category: form.category,
        expenseDate: form.expenseDate,
        description: form.description.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      closeModal();
      Toast.show({ type: "success", text1: "Expense updated!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerExpenses"] });
      Toast.show({ type: "success", text1: "Expense deleted" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...BLANK_FORM,
      gymId: gymId || (gyms as Gym[])[0]?.id || "",
      expenseDate: localDateString(),
    });
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      gymId: expense.gymId || "",
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      expenseDate: expense.expenseDate?.slice(0, 10) ?? localDateString(),
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
    const effectiveGymId = form.gymId || gymId || (gyms as Gym[])[0]?.id;
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
  const maxCategory = Math.max(...byCategory.map((b) => b.total), 1);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <Header
          title="Expenses"
          menu
          subtitle="Track your gym operating costs"
          right={
            <TouchableOpacity style={s.addBtn} onPress={openAdd}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />

        {/* Filters */}
        <View style={s.filtersRow}>
          {/* Gym filter */}
          {multiGym && (
            <Dropdown
              label="Gym"
              value={gymId}
              onChange={setGymId}
              options={[
                { value: "", label: "All Gyms" },
                ...gyms.map((g) => ({ value: g.id, label: g.name })),
              ]}
              placeholder="All Gyms"
              leftIcon="domain"
              containerStyle={{ flex: 1 }}
            />
          )}
          {/* Range dropdown - simplified for RN */}
          <Dropdown
            label="Date Range"
            value={range}
            onChange={setRange}
            options={[
              { value: "", label: "Select range" },
              ...RANGES.map((r) => ({ value: r.key, label: r.label })),
            ]}
            placeholder="Select range"
            leftIcon="calendar-range"
            containerStyle={{ flex: 1 }}
          />

          {/* Category filter */}
          <Dropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "", label: "All Categories" },
              ...CATEGORIES.map((c) => ({
                value: c,
                label: CATEGORY_LABELS[c],
              })),
            ]}
            placeholder="All Categories"
            leftIcon="tag-outline"
            containerStyle={{ flex: 1 }}
          />
        </View>

        {/* Custom range inputs */}
        {range === "custom" && (
          <View style={s.customRangeRow}>
            <Input
              label="Start Date"
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="End Date"
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="YYYY-MM-DD"
            />
          </View>
        )}

        {/* Summary cards */}
        {!isLoading && expenses.length > 0 && (
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Total Expenses</Text>
              <Text style={s.summaryValue}>{fmt(totalAmount)}</Text>
              <Text style={s.summarySub}>{expenses.length} transactions</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Avg per Transaction</Text>
              <Text style={s.summaryValue}>
                {expenses.length ? fmt(totalAmount / expenses.length) : "₹0"}
              </Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Top Category</Text>
              <Text style={s.summaryValue}>
                {byCategory[0] ? CATEGORY_LABELS[byCategory[0].category] : "—"}
              </Text>
              {byCategory[0] && (
                <Text style={s.summarySub}>{fmt(byCategory[0].total)}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <PlanGate allowed={hasExpenses} featureLabel="Expense Management">
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <View style={s.breakdownCard}>
              <Text style={s.breakdownTitle}>By Category</Text>
              <View style={s.breakdownList}>
                {byCategory.map((b) => (
                  <View key={b.category} style={s.breakdownItem}>
                    <View style={s.breakdownLeft}>
                      <Text
                        style={[
                          s.breakdownBadge,
                          {
                            backgroundColor: CATEGORY_COLORS[b.category] + "20",
                            borderColor: CATEGORY_COLORS[b.category] + "40",
                            color: CATEGORY_COLORS[b.category],
                          },
                        ]}
                      >
                        {CATEGORY_LABELS[b.category]}
                      </Text>
                      <Text style={s.breakdownAmount}>{fmt(b.total)}</Text>
                    </View>
                    <View style={s.progressBar}>
                      <View
                        style={[
                          s.progressFill,
                          {
                            width: `${(b.total / maxCategory) * 100}%`,
                            backgroundColor: CATEGORY_COLORS[b.category] + "60",
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Expense list */}
          <View style={s.listSection}>
            <Text style={s.listTitle}>Transactions</Text>
            {isLoading ? (
              <View style={s.loading}>
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
                            color="#EF4444"
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
                              {new Date(expense.expenseDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </Text>
                          </View>
                          {expense.gym?.name && multiGym && (
                            <Text style={s.expenseGym}>{expense.gym.name}</Text>
                          )}
                          {expense.description && (
                            <Text style={s.expenseDesc} numberOfLines={1}>
                              {expense.description}
                            </Text>
                          )}
                        </View>

                        {/* Right: amount + edit */}
                        <View style={s.expenseRight}>
                          <Text style={s.expenseAmount}>
                            −{fmt(Number(expense.amount))}
                          </Text>
                          <View style={{ flexDirection: "row", gap: 5 }}>
                            <TouchableOpacity
                              style={s.editBtn}
                              onPress={() => openEdit(expense)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Icon
                                name="pencil"
                                size={20}
                                color={Colors.textMuted}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={s.deleteBtn}
                              onPress={() => confirmDelete(expense)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Icon
                                name="trash-can-outline"
                                size={20}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            )}
            {totalPages > 1 && (
              <View style={s.pagination}>
                <TouchableOpacity
                  style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Icon
                    name="chevron-left"
                    size={16}
                    color={page === 1 ? Colors.textMuted : Colors.primary}
                  />
                  <Text
                    style={[s.pageBtnText, page === 1 && s.pageBtnTextDisabled]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text style={s.pageInfo}>
                  Page {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[s.pageBtn, page === totalPages && s.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Text
                    style={[
                      s.pageBtnText,
                      page === totalPages && s.pageBtnTextDisabled,
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
            )}
          </View>
        </ScrollView>

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
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: CATEGORY_LABELS[c],
                }))}
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

              {/* <Input
              label="Receipt URL"
              value={form.receiptUrl}
              onChangeText={(v) => set("receiptUrl", v)}
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
            /> */}

              <Button
                label={editingId ? "Save Changes" : "Add Expense"}
                onPress={handleSubmit}
                loading={isMutating}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </PlanGate>
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

  // Filters
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  customRangeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "semibold",
    marginBottom: 4,
  },
  summaryValue: {
    color: Colors.error,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  summarySub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },

  // Breakdown
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  breakdownTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  breakdownList: {
    gap: Spacing.md,
  },
  breakdownItem: {
    gap: Spacing.sm,
  },
  breakdownLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  breakdownAmount: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
  },
  progressBar: {
    height: 5,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.sm,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.sm,
  },

  // List
  listSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  loading: {
    paddingVertical: Spacing.xl,
  },
  list: { paddingBottom: 32 },

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
  expenseDesc: {
    color: Colors.textMuted,
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
  editBtn: {
    padding: 2,
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

  // Pagination
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
