// mobile/src/screens/owner/LockersScreen.tsx
// Gym owner locker management screen — list, assign, unassign, add, edit, delete.

import { gymsApi, lockersApi, membersApi } from "@/api/endpoints";
import { showAlert } from "@/components/AppAlert";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  EmptyState,
  Header,
  Input,
  SkeletonGroup,
} from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym, GymMemberListItem } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
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

type LockerStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

interface Locker {
  id: string;
  lockerNumber: string;
  status: LockerStatus;
  monthlyFee?: number | null;
  member?: {
    id: string;
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
  expiresAt?: string | null;
  notes?: string | null;
  feeCollected?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status filter pills
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Maintenance", value: "MAINTENANCE" },
];

function statusBadgeVariant(
  status: LockerStatus,
): "success" | "error" | "warning" | "default" {
  if (status === "AVAILABLE") return "success";
  if (status === "OCCUPIED") return "error";
  if (status === "MAINTENANCE") return "warning";
  return "default";
}

function statusLabel(status: LockerStatus): string {
  if (status === "AVAILABLE") return "Available";
  if (status === "OCCUPIED") return "Occupied";
  if (status === "MAINTENANCE") return "Maintenance";
  return status;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Locker card (grid item)
// ─────────────────────────────────────────────────────────────────────────────

interface LockerCardProps {
  locker: Locker;
  onPress: () => void;
  onLongPress: () => void;
}

function LockerCard({ locker, onPress, onLongPress }: LockerCardProps) {
  const isOccupied = locker.status === "OCCUPIED";
  const isMaintenance = locker.status === "MAINTENANCE";

  const borderColor = isOccupied
    ? Colors.error + "60"
    : isMaintenance
      ? Colors.warning + "60"
      : Colors.success + "60";

  const bgColor = isOccupied
    ? Colors.errorFaded
    : isMaintenance
      ? Colors.warningFaded
      : Colors.successFaded;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={[s.lockerCard, { borderColor, backgroundColor: bgColor }]}
    >
      {/* Locker number */}
      <Text style={s.lockerNumber} numberOfLines={1}>
        {locker.lockerNumber}
      </Text>

      {/* Status badge */}
      <Badge
        label={statusLabel(locker.status)}
        variant={statusBadgeVariant(locker.status)}
      />

      {/* Member info (occupied) */}
      {isOccupied && locker.member ? (
        <View style={{ marginTop: Spacing.xs, gap: 2 }}>
          <Text style={s.lockerMember} numberOfLines={1}>
            {locker.member.profile.fullName}
          </Text>
          {locker.expiresAt ? (
            <Text style={s.lockerExpiry} numberOfLines={1}>
              Exp: {fmtDate(locker.expiresAt)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Monthly fee */}
      {locker.monthlyFee ? (
        <Text style={s.lockerFee}>
          ₹{Number(locker.monthlyFee).toLocaleString("en-IN")}/mo
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal sheet header row
// ─────────────────────────────────────────────────────────────────────────────

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={s.modalHeader}>
      <Text style={s.modalTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={22} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OwnerLockersScreen() {
  const qc = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [gymId, setGymId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Add locker modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    lockerNumber: "",
    status: "AVAILABLE",
    monthlyFee: "",
  });

  // Assign modal
  const [assignLocker, setAssignLocker] = useState<Locker | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [assignForm, setAssignForm] = useState({
    memberId: "",
    expiresAt: "",
    notes: "",
    feeCollected: false,
  });

  // Edit modal
  const [editLocker, setEditLocker] = useState<Locker | null>(null);
  const [editLockerNumber, setEditLockerNumber] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  // Auto-select first gym
  useEffect(() => {
    if (!gymId && (gyms as Gym[]).length > 0) {
      setGymId((gyms as Gym[])[0].id);
    }
  }, [gyms, gymId]);

  const {
    data: lockers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Locker[]>({
    queryKey: ["ownerLockers", gymId, statusFilter],
    queryFn: () =>
      lockersApi.list(gymId, statusFilter || undefined) as Promise<Locker[]>,
    enabled: !!gymId,
    staleTime: 30_000,
  });

  const { data: membersData } = useQuery({
    queryKey: ["ownerMembers", gymId, memberSearch],
    queryFn: () =>
      membersApi.list({ gymId, search: memberSearch || undefined }),
    enabled: !!gymId && !!assignLocker,
    staleTime: 30_000,
  });

  const members: GymMemberListItem[] = useMemo(() => {
    const data = membersData as any;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.members)) return data.members;
    return [];
  }, [membersData]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const allLockers = lockers as Locker[];
  const totalCount = allLockers.length;
  const availableCount = allLockers.filter(
    (l) => l.status === "AVAILABLE",
  ).length;
  const occupiedCount = allLockers.filter(
    (l) => l.status === "OCCUPIED",
  ).length;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ownerLockers", gymId] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      lockersApi.create({
        gymId,
        lockerNumber: addForm.lockerNumber.trim(),
        status: addForm.status,
        monthlyFee: addForm.monthlyFee ? parseFloat(addForm.monthlyFee) : null,
      }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setAddForm({ lockerNumber: "", status: "AVAILABLE", monthlyFee: "" });
      Toast.show({ type: "success", text1: "Locker created!" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      lockersApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setEditLocker(null);
      Toast.show({ type: "success", text1: "Locker updated" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lockersApi.delete(id),
    onSuccess: () => {
      invalidate();
      Toast.show({ type: "success", text1: "Locker deleted" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      lockersApi.assign(assignLocker!.id, {
        memberId: assignForm.memberId,
        expiresAt: assignForm.expiresAt || undefined,
        notes: assignForm.notes || undefined,
        feeCollected: assignForm.feeCollected,
      }),
    onSuccess: () => {
      invalidate();
      setAssignLocker(null);
      setMemberSearch("");
      setAssignForm({ memberId: "", expiresAt: "", notes: "", feeCollected: false });
      Toast.show({ type: "success", text1: "Locker assigned!" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  const unassignMutation = useMutation({
    mutationFn: (lockerId: string) => lockersApi.unassign(lockerId),
    onSuccess: () => {
      invalidate();
      Toast.show({ type: "success", text1: "Locker unassigned" });
    },
    onError: (err: Error) =>
      Toast.show({ type: "error", text1: err.message }),
  });

  // ── Gym dropdown options ───────────────────────────────────────────────────
  const gymOptions = (gyms as Gym[]).map((g) => ({
    label: g.name,
    value: g.id,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLockerPress = (locker: Locker) => {
    if (locker.status === "AVAILABLE") {
      setAssignLocker(locker);
      setAssignForm({ memberId: "", expiresAt: "", notes: "", feeCollected: false });
      setMemberSearch("");
    } else if (locker.status === "OCCUPIED") {
      showAlert(
        `Locker ${locker.lockerNumber}`,
        locker.member
          ? `Assigned to ${locker.member.profile.fullName}`
          : "Currently occupied",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unassign",
            style: "destructive",
            onPress: () => unassignMutation.mutate(locker.id),
          },
        ],
      );
    } else {
      // MAINTENANCE — allow reassigning status
      showAlert(
        `Locker ${locker.lockerNumber}`,
        "This locker is under maintenance.",
        [{ text: "OK", style: "cancel" }],
      );
    }
  };

  const handleLockerLongPress = (locker: Locker) => {
    showAlert(`Locker ${locker.lockerNumber}`, "Choose an action", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => {
          setEditLocker(locker);
          setEditLockerNumber(locker.lockerNumber);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          showAlert(
            "Delete Locker",
            `Permanently delete locker "${locker.lockerNumber}"?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteMutation.mutate(locker.id),
              },
            ],
          ),
      },
    ]);
  };

  const handleAssign = () => {
    if (!assignForm.memberId) {
      Toast.show({ type: "error", text1: "Please select a member" });
      return;
    }
    assignMutation.mutate();
  };

  const handleCreate = () => {
    if (!addForm.lockerNumber.trim()) {
      Toast.show({ type: "error", text1: "Locker number is required" });
      return;
    }
    if (!gymId) {
      Toast.show({ type: "error", text1: "Please select a gym" });
      return;
    }
    createMutation.mutate();
  };

  const handleEdit = () => {
    if (!editLockerNumber.trim() || !editLocker) {
      Toast.show({ type: "error", text1: "Locker number is required" });
      return;
    }
    updateMutation.mutate({
      id: editLocker.id,
      data: { lockerNumber: editLockerNumber.trim() },
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <Header
          title="Lockers"
          back
          right={
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setShowAdd(true)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />

        {/* Gym selector */}
        {gymOptions.length > 0 && (
          <Dropdown
            label="Gym"
            value={gymId}
            onChange={setGymId}
            options={gymOptions}
            placeholder="Select gym"
            leftIcon="dumbbell"
          />
        )}

        {/* Status filter pills */}
        <View style={s.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              style={[
                s.pill,
                statusFilter === f.value && s.pillActive,
              ]}
            >
              <Text
                style={[
                  s.pillText,
                  statusFilter === f.value && s.pillTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats */}
        {!isLoading && allLockers.length > 0 && (
          <View style={s.statsRow}>
            <View style={s.statChip}>
              <Text style={s.statValue}>{totalCount}</Text>
              <Text style={s.statLabel}>Total</Text>
            </View>
            <View style={[s.statChip, { borderColor: Colors.success + "40", backgroundColor: Colors.successFaded }]}>
              <Text style={[s.statValue, { color: Colors.success }]}>
                {availableCount}
              </Text>
              <Text style={s.statLabel}>Available</Text>
            </View>
            <View style={[s.statChip, { borderColor: Colors.error + "40", backgroundColor: Colors.errorFaded }]}>
              <Text style={[s.statValue, { color: Colors.error }]}>
                {occupiedCount}
              </Text>
              <Text style={s.statLabel}>Occupied</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {!gymId ? (
        <EmptyState
          icon="lock-outline"
          title="No gym selected"
          subtitle="Select a gym above to manage lockers"
        />
      ) : isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="statGrid" count={6} itemHeight={110} gap={Spacing.sm} />
        </View>
      ) : allLockers.length === 0 ? (
        <EmptyState
          icon="lock-outline"
          title="No lockers found"
          subtitle={
            statusFilter
              ? `No ${statusFilter.toLowerCase()} lockers`
              : "Add lockers to manage them here"
          }
          action={
            !statusFilter ? (
              <TouchableOpacity
                style={s.emptyAction}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyActionText}>Add First Locker</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      ) : (
        <FlatList<Locker>
          data={allLockers}
          keyExtractor={(l) => l.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <LockerCard
              locker={item}
              onPress={() => handleLockerPress(item)}
              onLongPress={() => handleLockerLongPress(item)}
            />
          )}
        />
      )}

      {/* ── Add Locker Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <ModalHeader title="Add Locker" onClose={() => setShowAdd(false)} />

            <Input
              label="Locker Number *"
              value={addForm.lockerNumber}
              onChangeText={(v) => setAddForm((f) => ({ ...f, lockerNumber: v }))}
              placeholder="e.g. L-01 or 101"
              leftIcon="lock-outline"
            />

            <Dropdown
              label="Initial Status"
              value={addForm.status}
              onChange={(v) => setAddForm((f) => ({ ...f, status: v }))}
              options={[
                { label: "Available", value: "AVAILABLE" },
                { label: "Maintenance", value: "MAINTENANCE" },
              ]}
            />

            <Input
              label="Monthly Fee (₹)"
              value={addForm.monthlyFee}
              onChangeText={(v) => setAddForm((f) => ({ ...f, monthlyFee: v }))}
              keyboardType="numeric"
              placeholder="e.g. 500"
              leftIcon="currency-inr"
            />

            <Button
              label="Add Locker"
              onPress={handleCreate}
              loading={createMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Assign Locker Modal ────────────────────────────────────────────── */}
      <Modal
        visible={!!assignLocker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAssignLocker(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <ModalHeader
              title={
                assignLocker
                  ? `Assign Locker ${assignLocker.lockerNumber}`
                  : "Assign Locker"
              }
              onClose={() => setAssignLocker(null)}
            />

            {/* Member search */}
            <Input
              label="Search Member"
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Type member name..."
              leftIcon="magnify"
            />

            {/* Member list */}
            {members.length > 0 && (
              <View style={s.memberList}>
                {members.slice(0, 8).map((m) => {
                  const isSelected = assignForm.memberId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() =>
                        setAssignForm((f) => ({ ...f, memberId: m.id }))
                      }
                      style={[s.memberRow, isSelected && s.memberRowActive]}
                    >
                      <Avatar
                        name={m.profile.fullName}
                        uri={m.profile.avatarUrl ?? undefined}
                        size={34}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={s.memberName}>{m.profile.fullName}</Text>
                        {m.profile.mobileNumber ? (
                          <Text style={s.memberSub}>{m.profile.mobileNumber}</Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <Icon
                          name="check-circle"
                          size={18}
                          color={Colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Input
              label="Expiry Date (YYYY-MM-DD)"
              value={assignForm.expiresAt}
              onChangeText={(v) =>
                setAssignForm((f) => ({ ...f, expiresAt: v }))
              }
              placeholder="2025-12-31"
              leftIcon="calendar-outline"
            />

            <Input
              label="Notes"
              value={assignForm.notes}
              onChangeText={(v) =>
                setAssignForm((f) => ({ ...f, notes: v }))
              }
              placeholder="Optional notes..."
              multiline
              numberOfLines={2}
            />

            {/* Fee Collected toggle */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={s.toggleLabel}>Fee Collected</Text>
              <View style={s.toggleRow}>
                <TouchableOpacity
                  style={[
                    s.toggleBtn,
                    assignForm.feeCollected && s.toggleBtnActive,
                  ]}
                  onPress={() =>
                    setAssignForm((f) => ({ ...f, feeCollected: true }))
                  }
                >
                  <Text
                    style={[
                      s.toggleBtnText,
                      assignForm.feeCollected && s.toggleBtnTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.toggleBtn,
                    !assignForm.feeCollected && s.toggleBtnActive,
                  ]}
                  onPress={() =>
                    setAssignForm((f) => ({ ...f, feeCollected: false }))
                  }
                >
                  <Text
                    style={[
                      s.toggleBtnText,
                      !assignForm.feeCollected && s.toggleBtnTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              label="Assign Locker"
              onPress={handleAssign}
              loading={assignMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Edit Locker Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={!!editLocker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditLocker(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <ModalHeader
              title={
                editLocker ? `Edit Locker ${editLocker.lockerNumber}` : "Edit Locker"
              }
              onClose={() => setEditLocker(null)}
            />

            <Input
              label="Locker Number *"
              value={editLockerNumber}
              onChangeText={setEditLockerNumber}
              placeholder="e.g. L-01 or 101"
              leftIcon="lock-outline"
            />

            <Button
              label="Save Changes"
              onPress={handleEdit}
              loading={updateMutation.isPending}
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
  },

  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filter pills
  filterRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
    marginBottom: Spacing.md,
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
  pillText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
  },
  pillTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },

  // Locker grid
  grid: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lockerCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 110,
    gap: Spacing.xs,
  },
  lockerNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
  },
  lockerMember: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  lockerExpiry: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  lockerFee: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: Spacing.xs,
  },

  // Empty action
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

  // Modal shared
  modalScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },

  // Member picker in assign modal
  memberList: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberRowActive: {
    backgroundColor: Colors.primaryFaded,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  memberSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },

  // Fee collected toggle
  toggleLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  toggleBtnText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  toggleBtnTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
