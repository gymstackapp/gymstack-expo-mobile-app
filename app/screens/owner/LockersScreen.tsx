// mobile/src/screens/owner/LockersScreen.tsx
// Gym owner locker management — list, assign, unassign, add, edit, update assignment.

import { gymsApi, lockersApi, membersApi } from "@/api/endpoints";
import {
  Avatar,
  Button,
  Dropdown,
  EmptyState,
  Header,
  Input,
  SkeletonGroup,
  StatCard,
} from "@/components";
import { showAlert } from "@/components/AppAlert";
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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type LockerStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RESERVED";

const STATUS_META: Record<
  LockerStatus,
  {
    label: string;
    color: string;
    faded: string;
    border: string;
    icon: string;
    badgeVariant: "success" | "info" | "warning" | "default";
  }
> = {
  AVAILABLE: {
    label: "Available",
    color: Colors.success,
    faded: Colors.successFaded,
    border: Colors.success + "50",
    icon: "check-circle-outline",
    badgeVariant: "success",
  },
  ASSIGNED: {
    label: "Assigned",
    color: Colors.info,
    faded: Colors.infoFaded,
    border: Colors.info + "50",
    icon: "key-outline",
    badgeVariant: "info",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: Colors.warning,
    faded: Colors.warningFaded,
    border: Colors.warning + "50",
    icon: "wrench-outline",
    badgeVariant: "warning",
  },
  RESERVED: {
    label: "Reserved",
    color: Colors.purple,
    faded: Colors.purpleFaded,
    border: Colors.purple + "50",
    icon: "clock-outline",
    badgeVariant: "default",
  },
};

const SIZES = ["SMALL", "MEDIUM", "LARGE"];

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Reserved", value: "RESERVED" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  feeCollected: boolean;
  notes: string | null;
  member: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
      mobileNumber: string | null;
    };
  };
}

interface Locker {
  id: string;
  lockerNumber: string;
  floor: string | null;
  size: string | null;
  status: LockerStatus;
  monthlyFee: number | null;
  notes: string | null;
  assignments: Assignment[];
}

interface Stats {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
  reserved: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal header row
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
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="close" size={22} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Locker card
// ─────────────────────────────────────────────────────────────────────────────

interface LockerCardProps {
  locker: Locker;
  onEdit: (l: Locker) => void;
  onAssign: (l: Locker) => void;
  onUnassign: (l: Locker) => void;
  onUpdateAssignment: (l: Locker) => void;
  releasingId: string | null;
}

function LockerCard({
  locker,
  onEdit,
  onAssign,
  onUnassign,
  onUpdateAssignment,
  releasingId,
}: LockerCardProps) {
  const meta = STATUS_META[locker.status] ?? STATUS_META.AVAILABLE;
  const active = locker.assignments?.find((a) => a.isActive);
  const days = daysUntil(active?.expiresAt);
  const isExpired = days !== null && days <= 0;
  const isExpiring = days !== null && days > 0 && days <= 7;

  return (
    <View
      style={[
        s.card,
        { borderColor: meta.border, backgroundColor: meta.faded },
      ]}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardNumber} numberOfLines={1}>
            # {locker.lockerNumber}
          </Text>
          {locker.floor || locker.size ? (
            <Text style={s.cardMeta} numberOfLines={1}>
              {[locker.floor, locker.size].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>
        <View style={s.cardBadgeRow}>
          <View style={[s.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[s.statusLabel, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* ── Monthly fee ─────────────────────────────────────────────────── */}
      {locker.monthlyFee != null && locker.monthlyFee > 0 ? (
        <Text style={s.feeText}>
          ₹{Number(locker.monthlyFee).toLocaleString("en-IN")}/mo
        </Text>
      ) : null}

      {/* ── Assigned member ─────────────────────────────────────────────── */}
      {active ? (
        <View style={s.memberCard}>
          <View style={s.memberAvatarWrap}>
            <Text style={s.memberAvatarText}>
              {active.member.profile.fullName[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.memberNameRow}>
              <Text style={s.memberName} numberOfLines={1}>
                {active.member.profile.fullName}
              </Text>
              <Text
                style={[
                  s.feeBadge,
                  active.feeCollected ? s.feePaid : s.feeUnpaid,
                ]}
              >
                {active.feeCollected ? "Paid" : "Unpaid"}
              </Text>
            </View>
            {active.member.profile.mobileNumber ? (
              <Text style={s.memberPhone} numberOfLines={1}>
                {active.member.profile.mobileNumber}
              </Text>
            ) : null}
            {active.expiresAt ? (
              <View
                style={[
                  s.expiryRow,
                  isExpired
                    ? s.expiryExpired
                    : isExpiring
                      ? s.expiryWarning
                      : s.expiryNormal,
                ]}
              >
                <Icon
                  name="calendar-outline"
                  size={10}
                  color={
                    isExpired
                      ? Colors.error
                      : isExpiring
                        ? Colors.warning
                        : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    s.expiryText,
                    {
                      color: isExpired
                        ? Colors.error
                        : isExpiring
                          ? Colors.warning
                          : Colors.textMuted,
                    },
                  ]}
                >
                  {isExpired
                    ? "Expired"
                    : isExpiring
                      ? `Expires in ${days}d`
                      : `Expires ${fmtDate(active.expiresAt)}`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : locker.status === "AVAILABLE" ? (
        <View style={s.emptySlot}>
          <Text style={s.emptySlotText}>Unoccupied</Text>
        </View>
      ) : null}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <View style={s.cardActions}>
        {locker.status === "AVAILABLE" && (
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnPrimary]}
            onPress={() => onAssign(locker)}
          >
            <Icon
              name="account-plus-outline"
              size={13}
              color={Colors.primary}
            />
            <Text style={[s.actionBtnText, { color: Colors.primary }]}>
              Assign
            </Text>
          </TouchableOpacity>
        )}

        {locker.status === "ASSIGNED" && (
          <>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDefault]}
              onPress={() => onUpdateAssignment(locker)}
            >
              <Icon
                name="pencil-outline"
                size={13}
                color={Colors.textSecondary}
              />
              <Text style={[s.actionBtnText, { color: Colors.textSecondary }]}>
                Update
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDanger]}
              onPress={() => onUnassign(locker)}
              disabled={releasingId === locker.id}
            >
              <Icon
                name={
                  releasingId === locker.id
                    ? "loading"
                    : "account-remove-outline"
                }
                size={13}
                color={Colors.error}
              />
              <Text style={[s.actionBtnText, { color: Colors.error }]}>
                Release
              </Text>
            </TouchableOpacity>
          </>
        )}

        {(locker.status === "MAINTENANCE" || locker.status === "RESERVED") && (
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDefault, { flex: 1 }]}
            onPress={() => onEdit(locker)}
          >
            <Icon name="wrench-outline" size={13} color={Colors.textMuted} />
            <Text style={[s.actionBtnText, { color: Colors.textMuted }]}>
              Edit Status
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  const [search, setSearch] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);

  // Add modal
  const emptyAdd = {
    lockerNumber: "",
    floor: "",
    size: "",
    monthlyFee: "",
    status: "AVAILABLE",
    notes: "",
  };
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);

  // Edit modal
  const [editLocker, setEditLocker] = useState<Locker | null>(null);

  // Assign modal
  const [assignLocker, setAssignLocker] = useState<Locker | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const emptyAssign = {
    memberId: "",
    expiresAt: "",
    notes: "",
    feeCollected: false,
  };
  const [assignForm, setAssignForm] = useState(emptyAssign);

  // Bulk add modal
  const emptyBulk = { prefix: "", from: "1", to: "10", floor: "", monthlyFee: "" };
  const [showBulk, setShowBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState(emptyBulk);

  // Update assignment modal
  const [updateLocker, setUpdateLocker] = useState<Locker | null>(null);
  const emptyUpdate = { expiresAt: "", notes: "", feeCollected: false };
  const [updateForm, setUpdateForm] = useState(emptyUpdate);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!gymId && (gyms as Gym[]).length > 0) {
      setGymId((gyms as Gym[])[0].id);
    }
  }, [gyms, gymId]);

  const {
    data: lockersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ownerLockers", gymId, statusFilter],
    queryFn: () => lockersApi.list(gymId, statusFilter || undefined),
    enabled: !!gymId,
    staleTime: 30_000,
  });

  // Handle both `Locker[]` and `{ lockers, stats }` response shapes
  const lockers: Locker[] = useMemo(() => {
    const d = lockersData as any;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.lockers)) return d.lockers;
    return [];
  }, [lockersData]);

  const stats: Stats = useMemo(() => {
    const d = lockersData as any;
    const fromApi = d?.stats;
    if (fromApi) return fromApi;
    // Compute from list if API doesn't return stats
    return {
      total: lockers.length,
      available: lockers.filter((l) => l.status === "AVAILABLE").length,
      assigned: lockers.filter((l) => l.status === "ASSIGNED").length,
      maintenance: lockers.filter((l) => l.status === "MAINTENANCE").length,
      reserved: lockers.filter((l) => l.status === "RESERVED").length,
    };
  }, [lockersData, lockers]);

  const { data: membersData } = useQuery({
    queryKey: ["ownerMembers", gymId, memberSearch],
    queryFn: () =>
      membersApi.list({ gymId, search: memberSearch || undefined }),
    enabled: !!gymId && !!assignLocker,
    staleTime: 30_000,
  });

  const members: GymMemberListItem[] = useMemo(() => {
    const d = membersData as any;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.members)) return d.members;
    return [];
  }, [membersData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return lockers;
    const q = search.toLowerCase();
    return lockers.filter(
      (l) =>
        l.lockerNumber.toLowerCase().includes(q) ||
        l.assignments
          ?.find((a) => a.isActive)
          ?.member.profile.fullName.toLowerCase()
          .includes(q),
    );
  }, [lockers, search]);

  const gymOptions = (gyms as Gym[]).map((g) => ({
    label: g.name,
    value: g.id,
  }));

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["ownerLockers", gymId] });

  const createMutation = useMutation({
    mutationFn: () =>
      lockersApi.create({
        gymId,
        lockerNumber: addForm.lockerNumber.trim(),
        floor: addForm.floor || null,
        size: addForm.size || null,
        status: addForm.status,
        monthlyFee: addForm.monthlyFee ? parseFloat(addForm.monthlyFee) : null,
        notes: addForm.notes || null,
      }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setAddForm(emptyAdd);
      Toast.show({ type: "success", text1: "Locker created!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: () =>
      lockersApi.create({
        gymId,
        bulk: true,
        prefix: bulkForm.prefix,
        from: parseInt(bulkForm.from) || 1,
        to: parseInt(bulkForm.to) || 10,
        floor: bulkForm.floor || null,
        monthlyFee: bulkForm.monthlyFee ? parseFloat(bulkForm.monthlyFee) : null,
      }),
    onSuccess: (d: any) => {
      invalidate();
      setShowBulk(false);
      setBulkForm(emptyBulk);
      const created = d?.created?.length ?? 0;
      const skipped = d?.skipped?.length ?? 0;
      Toast.show({
        type: "success",
        text1: `Created ${created} lockers${skipped ? `, skipped ${skipped} existing` : ""}`,
      });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      lockersApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setEditLocker(null);
      Toast.show({ type: "success", text1: "Locker updated" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lockersApi.delete(id),
    onSuccess: () => {
      invalidate();
      setEditLocker(null);
      Toast.show({ type: "success", text1: "Locker deleted" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
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
      setAssignForm(emptyAssign);
      Toast.show({ type: "success", text1: "Locker assigned!" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const unassignMutation = useMutation({
    mutationFn: (lockerId: string) => lockersApi.unassign(lockerId),
    onSuccess: () => {
      invalidate();
      setReleasingId(null);
      Toast.show({ type: "success", text1: "Locker released" });
    },
    onError: (err: Error) => {
      setReleasingId(null);
      Toast.show({ type: "error", text1: err.message });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: () =>
      lockersApi.updateAssignment(updateLocker!.id, {
        expiresAt: updateForm.expiresAt || undefined,
        notes: updateForm.notes || undefined,
        feeCollected: updateForm.feeCollected,
      }),
    onSuccess: () => {
      invalidate();
      setUpdateLocker(null);
      Toast.show({ type: "success", text1: "Assignment updated" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = () => {
    if (!addForm.lockerNumber.trim()) {
      Toast.show({ type: "error", text1: "Locker number is required" });
      return;
    }
    createMutation.mutate();
  };

  const handleEditSave = () => {
    if (!editLocker || !editLocker.lockerNumber.trim()) {
      Toast.show({ type: "error", text1: "Locker number is required" });
      return;
    }
    updateMutation.mutate({ id: editLocker.id, data: editLocker });
  };

  const handleDeleteLocker = (locker: Locker) => {
    showAlert(
      `Delete locker #${locker.lockerNumber}?`,
      "This will permanently remove the locker and all assignment history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(locker.id),
        },
      ],
    );
  };

  const handleAssign = () => {
    if (!assignForm.memberId) {
      Toast.show({ type: "error", text1: "Please select a member" });
      return;
    }
    assignMutation.mutate();
  };

  const handleUnassign = (locker: Locker) => {
    showAlert(
      `Release locker #${locker.lockerNumber}?`,
      "The member will lose access and the locker will become available again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: () => {
            setReleasingId(locker.id);
            unassignMutation.mutate(locker.id);
          },
        },
      ],
    );
  };

  const handleBulkCreate = () => {
    const from = parseInt(bulkForm.from);
    const to = parseInt(bulkForm.to);
    if (!from || !to || from > to) {
      Toast.show({ type: "error", text1: "Invalid range — From must be ≤ To" });
      return;
    }
    bulkCreateMutation.mutate();
  };

  const handleOpenUpdateAssignment = (locker: Locker) => {
    const active = locker.assignments?.find((a) => a.isActive);
    setUpdateLocker(locker);
    setUpdateForm({
      expiresAt: active?.expiresAt ? active.expiresAt.split("T")[0] : "",
      notes: active?.notes ?? "",
      feeCollected: active?.feeCollected ?? false,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <Header
          title="Lockers"
          back
          right={
            gymId ? (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Gym selector — dropdown only when multiple gyms */}
        {gymOptions.length > 1 ? (
          <View style={s.gymRow}>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Gym"
                value={gymId}
                onChange={setGymId}
                options={gymOptions}
                placeholder="Select gym"
                leftIcon="dumbbell"
              />
            </View>
            {gymId && (
              <TouchableOpacity
                style={s.bulkBtn}
                onPress={() => setShowBulk(true)}
              >
                <Icon name="layers-plus" size={15} color={Colors.textSecondary} />
                <Text style={s.bulkBtnText}>Bulk Add</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : gymOptions.length === 1 ? (
          <View style={s.gymRow}>
            <View style={s.gymNameChip}>
              <Icon name="dumbbell" size={13} color={Colors.textMuted} />
              <Text style={s.gymNameText} numberOfLines={1}>
                {gymOptions[0].label}
              </Text>
            </View>
            <TouchableOpacity
              style={s.bulkBtn}
              onPress={() => setShowBulk(true)}
            >
              <Icon name="layers-plus" size={15} color={Colors.textSecondary} />
              <Text style={s.bulkBtnText}>Bulk Add</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Status filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={s.filterRow}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              style={[s.pill, statusFilter === f.value && s.pillActive]}
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
        </ScrollView>
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {!gymId ? (
        <EmptyState
          icon="lock-outline"
          title="No gym selected"
          subtitle="Select a gym above to manage lockers"
        />
      ) : isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup
            variant="statGrid"
            count={6}
            itemHeight={110}
            gap={Spacing.sm}
          />
        </View>
      ) : (
        <FlatList<Locker>
          data={filtered}
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
          ListHeaderComponent={
            <>
              {/* Search */}
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search locker or member…"
                leftIcon="magnify"
              />

              {/* Stats row */}
              {lockers.length > 0 && (
                <View style={s.statsGrid}>
                  <StatCard
                    icon="lock-outline"
                    label="Total"
                    value={stats.total}
                    color={Colors.textPrimary}
                    bg={Colors.surfaceRaised}
                    style={{ flex: 1 }}
                  />
                  <StatCard
                    icon="check-circle-outline"
                    label="Available"
                    value={stats.available}
                    color={Colors.success}
                    bg={Colors.successFaded}
                    style={{ flex: 1 }}
                  />
                  <StatCard
                    icon="key-outline"
                    label="Assigned"
                    value={stats.assigned}
                    color={Colors.info}
                    bg={Colors.infoFaded}
                    style={{ flex: 1 }}
                  />
                  <StatCard
                    icon="wrench-outline"
                    label="Maint."
                    value={stats.maintenance}
                    color={Colors.warning}
                    bg={Colors.warningFaded}
                    style={{ flex: 1 }}
                  />
                  <StatCard
                    icon="clock-outline"
                    label="Reserved"
                    value={stats.reserved}
                    color={Colors.purple}
                    bg={Colors.purpleFaded}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <EmptyState
              icon="lock-outline"
              title="No lockers found"
              subtitle={
                search
                  ? "No lockers match your search"
                  : statusFilter
                    ? `No ${statusFilter.toLowerCase()} lockers`
                    : "Add lockers to manage them here"
              }
              action={
                !search && !statusFilter ? (
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
          }
          renderItem={({ item }) => (
            <LockerCard
              locker={item}
              onEdit={setEditLocker}
              onAssign={(l) => {
                setAssignLocker(l);
                setAssignForm(emptyAssign);
                setMemberSearch("");
              }}
              onUnassign={handleUnassign}
              onUpdateAssignment={handleOpenUpdateAssignment}
              releasingId={releasingId}
            />
          )}
        />
      )}

      {/* ── Add Locker Modal ──────────────────────────────────────────────── */}
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
            <ModalHeader
              title="Add Locker"
              onClose={() => {
                setShowAdd(false);
                setAddForm(emptyAdd);
              }}
            />

            <Input
              label="Locker Number *"
              value={addForm.lockerNumber}
              onChangeText={(v) =>
                setAddForm((f) => ({ ...f, lockerNumber: v }))
              }
              placeholder="e.g. A-01"
              leftIcon="lock-outline"
            />

            <Input
              label="Floor / Zone"
              value={addForm.floor}
              onChangeText={(v) => setAddForm((f) => ({ ...f, floor: v }))}
              placeholder="e.g. Ground Floor"
              leftIcon="layers-outline"
            />

            <Dropdown
              label="Size"
              value={addForm.size}
              onChange={(v) => setAddForm((f) => ({ ...f, size: v }))}
              options={[
                { label: "Any", value: "" },
                ...SIZES.map((s) => ({ label: s, value: s })),
              ]}
            />

            <Input
              label="Monthly Fee (₹)"
              value={addForm.monthlyFee}
              onChangeText={(v) => setAddForm((f) => ({ ...f, monthlyFee: v }))}
              keyboardType="numeric"
              placeholder="0"
              leftIcon="currency-inr"
            />

            <Dropdown
              label="Initial Status"
              value={addForm.status}
              onChange={(v) => setAddForm((f) => ({ ...f, status: v }))}
              options={[
                { label: "Available", value: "AVAILABLE" },
                { label: "Maintenance", value: "MAINTENANCE" },
                { label: "Reserved", value: "RESERVED" },
              ]}
            />

            <Input
              label="Notes"
              value={addForm.notes}
              onChangeText={(v) => setAddForm((f) => ({ ...f, notes: v }))}
              placeholder="Optional"
              multiline
              numberOfLines={2}
            />

            <Button
              label="Add Locker"
              onPress={handleCreate}
              loading={createMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Edit Locker Modal ─────────────────────────────────────────────── */}
      {editLocker && (
        <Modal
          visible
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
                title={`Edit Locker #${editLocker.lockerNumber}`}
                onClose={() => setEditLocker(null)}
              />

              <Input
                label="Locker Number *"
                value={editLocker.lockerNumber}
                onChangeText={(v) =>
                  setEditLocker((l) => (l ? { ...l, lockerNumber: v } : l))
                }
                placeholder="e.g. A-01"
                leftIcon="lock-outline"
              />

              <Input
                label="Floor / Zone"
                value={editLocker.floor ?? ""}
                onChangeText={(v) =>
                  setEditLocker((l) => (l ? { ...l, floor: v || null } : l))
                }
                placeholder="e.g. Ground Floor"
                leftIcon="layers-outline"
              />

              <Dropdown
                label="Size"
                value={editLocker.size ?? ""}
                onChange={(v) =>
                  setEditLocker((l) => (l ? { ...l, size: v || null } : l))
                }
                options={[
                  { label: "Any", value: "" },
                  ...SIZES.map((sz) => ({ label: sz, value: sz })),
                ]}
              />

              <Input
                label="Monthly Fee (₹)"
                value={
                  editLocker.monthlyFee != null
                    ? String(editLocker.monthlyFee)
                    : ""
                }
                onChangeText={(v) =>
                  setEditLocker((l) =>
                    l ? { ...l, monthlyFee: v ? parseFloat(v) : null } : l,
                  )
                }
                keyboardType="numeric"
                placeholder="0"
                leftIcon="currency-inr"
              />

              {editLocker.status !== "ASSIGNED" && (
                <Dropdown
                  label="Status"
                  value={editLocker.status}
                  onChange={(v) =>
                    setEditLocker((l) =>
                      l ? { ...l, status: v as LockerStatus } : l,
                    )
                  }
                  options={[
                    { label: "Available", value: "AVAILABLE" },
                    { label: "Maintenance", value: "MAINTENANCE" },
                    { label: "Reserved", value: "RESERVED" },
                  ]}
                />
              )}

              <Input
                label="Notes"
                value={editLocker.notes ?? ""}
                onChangeText={(v) =>
                  setEditLocker((l) => (l ? { ...l, notes: v || null } : l))
                }
                placeholder="Optional"
                multiline
                numberOfLines={2}
              />

              <Button
                label="Save Changes"
                onPress={handleEditSave}
                loading={updateMutation.isPending}
              />

              {/* Delete button */}
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDeleteLocker(editLocker)}
                disabled={deleteMutation.isPending}
              >
                <Icon name="trash-can-outline" size={16} color={Colors.error} />
                <Text style={s.deleteBtnText}>Delete Locker</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── Assign Locker Modal ───────────────────────────────────────────── */}
      {assignLocker && (
        <Modal
          visible
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
                title={`Assign Locker #${assignLocker.lockerNumber}`}
                onClose={() => {
                  setAssignLocker(null);
                  setAssignForm(emptyAssign);
                }}
              />

              {/* Monthly fee hint */}
              {assignLocker.monthlyFee != null &&
                assignLocker.monthlyFee > 0 && (
                  <View style={s.feeHint}>
                    <Icon
                      name="currency-inr"
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={s.feeHintText}>
                      Monthly fee: ₹
                      {Number(assignLocker.monthlyFee).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

              {/* Member search */}
              <Input
                label="Search Member"
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Type member name…"
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
                          url={m.profile.avatarUrl ?? undefined}
                          size={34}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.memberNameList}>
                            {m.profile.fullName}
                          </Text>
                          {m.profile.mobileNumber ? (
                            <Text style={s.memberSubList}>
                              {m.profile.mobileNumber}
                            </Text>
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
                onChangeText={(v) => setAssignForm((f) => ({ ...f, notes: v }))}
                placeholder="Optional notes…"
                multiline
                numberOfLines={2}
              />

              {/* Fee collected toggle */}
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Fee Collected</Text>
                  {assignLocker.monthlyFee != null &&
                    assignLocker.monthlyFee > 0 &&
                    assignForm.feeCollected && (
                      <Text style={s.switchSub}>
                        ₹
                        {Number(assignLocker.monthlyFee).toLocaleString(
                          "en-IN",
                        )}{" "}
                        added to revenue
                      </Text>
                    )}
                </View>
                <Switch
                  value={assignForm.feeCollected}
                  onValueChange={(v) =>
                    setAssignForm((f) => ({ ...f, feeCollected: v }))
                  }
                  trackColor={{ true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <Button
                label="Assign Locker"
                onPress={handleAssign}
                loading={assignMutation.isPending}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── Bulk Add Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showBulk}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBulk(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <ModalHeader
              title="Bulk Add Lockers"
              onClose={() => {
                setShowBulk(false);
                setBulkForm(emptyBulk);
              }}
            />

            <View style={s.bulkHint}>
              <Icon name="information-outline" size={13} color={Colors.textMuted} />
              <Text style={s.bulkHintText}>
                Creates lockers like A01, A02 … A10 (prefix + zero-padded number)
              </Text>
            </View>

            <Input
              label="Prefix (optional)"
              value={bulkForm.prefix}
              onChangeText={(v) => setBulkForm((f) => ({ ...f, prefix: v }))}
              placeholder="e.g. A, B, L-"
              leftIcon="text"
            />

            <View style={s.bulkRangeRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="From"
                  value={bulkForm.from}
                  onChangeText={(v) => setBulkForm((f) => ({ ...f, from: v }))}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="To"
                  value={bulkForm.to}
                  onChangeText={(v) => setBulkForm((f) => ({ ...f, to: v }))}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
            </View>

            {/* Preview count */}
            {bulkForm.from && bulkForm.to && (
              <Text style={s.bulkCountText}>
                Will create{" "}
                {Math.max(
                  0,
                  (parseInt(bulkForm.to) || 0) -
                    (parseInt(bulkForm.from) || 0) +
                    1,
                )}{" "}
                lockers
              </Text>
            )}

            <Input
              label="Floor / Zone"
              value={bulkForm.floor}
              onChangeText={(v) => setBulkForm((f) => ({ ...f, floor: v }))}
              placeholder="e.g. Ground Floor"
              leftIcon="layers-outline"
            />

            <Input
              label="Monthly Fee (₹)"
              value={bulkForm.monthlyFee}
              onChangeText={(v) => setBulkForm((f) => ({ ...f, monthlyFee: v }))}
              keyboardType="numeric"
              placeholder="0"
              leftIcon="currency-inr"
            />

            <Button
              label="Create Lockers"
              onPress={handleBulkCreate}
              loading={bulkCreateMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Update Assignment Modal ───────────────────────────────────────── */}
      {updateLocker && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setUpdateLocker(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
            <ScrollView
              contentContainerStyle={s.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <ModalHeader
                title={`Update Assignment — #${updateLocker.lockerNumber}`}
                onClose={() => setUpdateLocker(null)}
              />

              <Input
                label="New Expiry Date (YYYY-MM-DD)"
                value={updateForm.expiresAt}
                onChangeText={(v) =>
                  setUpdateForm((f) => ({ ...f, expiresAt: v }))
                }
                placeholder="2025-12-31"
                leftIcon="calendar-outline"
              />

              <Input
                label="Notes"
                value={updateForm.notes}
                onChangeText={(v) => setUpdateForm((f) => ({ ...f, notes: v }))}
                placeholder="Optional notes…"
                multiline
                numberOfLines={2}
              />

              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Fee Collected</Text>
                  {!updateLocker.assignments?.find((a) => a.isActive)
                    ?.feeCollected &&
                    updateForm.feeCollected &&
                    updateLocker.monthlyFee != null &&
                    updateLocker.monthlyFee > 0 && (
                      <Text style={s.switchSub}>
                        ₹
                        {Number(updateLocker.monthlyFee).toLocaleString(
                          "en-IN",
                        )}{" "}
                        added to revenue
                      </Text>
                    )}
                </View>
                <Switch
                  value={updateForm.feeCollected}
                  onValueChange={(v) =>
                    setUpdateForm((f) => ({ ...f, feeCollected: v }))
                  }
                  trackColor={{ true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <Button
                label="Update Assignment"
                onPress={() => updateAssignmentMutation.mutate()}
                loading={updateAssignmentMutation.isPending}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
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

  // Gym row
  gymRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gymNameChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  gymNameText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
    flex: 1,
  },
  bulkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  bulkBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },

  // Filter pills
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: "row", gap: Spacing.xs, paddingBottom: 2 },
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
  pillTextActive: { color: Colors.primary, fontWeight: "700" },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },

  // Locker grid
  grid: { padding: Spacing.lg, paddingBottom: 40 },
  columnWrapper: { gap: Spacing.sm, marginBottom: Spacing.sm },

  // Locker card
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  cardNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  cardMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  cardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  feeText: {
    color: Colors.textMuted,
    fontSize: 10,
  },

  // Member mini-card inside locker card
  memberCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.infoFaded,
    borderWidth: 1,
    borderColor: Colors.info + "40",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  memberAvatarText: {
    color: Colors.info,
    fontSize: 11,
    fontWeight: "700",
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  memberPhone: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  feeBadge: {
    fontSize: 9,
    fontWeight: "700",
    flexShrink: 0,
  },
  feePaid: { color: Colors.success },
  feeUnpaid: { color: Colors.warning },

  // Expiry
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  expiryExpired: { backgroundColor: Colors.errorFaded },
  expiryWarning: { backgroundColor: Colors.warningFaded },
  expiryNormal: { backgroundColor: "transparent" },
  expiryText: { fontSize: 9, fontWeight: "600" },

  // Empty slot
  emptySlot: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptySlotText: { color: Colors.textDisabled, fontSize: 10 },

  // Action buttons inside card
  cardActions: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary + "40",
  },
  actionBtnDefault: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  actionBtnDanger: {
    backgroundColor: Colors.errorFaded,
    borderColor: Colors.error + "30",
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // Empty state
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
  modalScroll: { padding: Spacing.lg, paddingBottom: 40 },
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
    flex: 1,
    marginRight: Spacing.sm,
  },

  // Fee hint in assign modal
  feeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feeHintText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
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
  memberRowActive: { backgroundColor: Colors.primaryFaded },
  memberNameList: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  memberSubList: { color: Colors.textMuted, fontSize: Typography.xs },

  // Switch row
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  switchLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  switchSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },

  // Bulk add modal
  bulkHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bulkHintText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    flex: 1,
    lineHeight: 16,
  },
  bulkRangeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bulkCountText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },

  // Delete button in edit modal
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorFaded,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  deleteBtnText: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
