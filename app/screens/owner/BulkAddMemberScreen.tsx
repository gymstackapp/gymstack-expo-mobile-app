// mobile/src/screens/owner/BulkAddMemberScreen.tsx
// Bulk-add members — mobile adaptation of the web bulk page.
// Two input modes: manual rows (name + mobile) or Excel / CSV file upload.
// Global settings (plan, dates, payment) always apply to the whole batch.
// Flow: form → preview (categorised results) → done (summary).

import { gymsApi, membersApi, membershipPlansApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, Input, PlanGate } from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string;
  name: string;
  mobile: string;
  errors: { name?: string; mobile?: string };
}

interface PreviewRow {
  name: string;
  mobile: string;
  normMobile?: string;
}

interface BulkPreview {
  newUsers: PreviewRow[];
  invited: PreviewRow[];
  onGymStack: PreviewRow[];
  alreadyHere: PreviewRow[];
  invalid: { name: string; mobile: string; reason: string }[];
}

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

type Step = "form" | "preview" | "done";
type InputMode = "manual" | "excel";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function normMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10);
}

let _rowId = 0;
function makeRow(): MemberRow {
  return { id: String(_rowId++), name: "", mobile: "", errors: {} };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHead({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionHead}>
      <Icon name={icon} size={14} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

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
      <View style={styles.payRow}>
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

function CategorySection({
  title,
  subtitle,
  rows,
  color,
  iconName,
}: {
  title: string;
  subtitle?: string;
  rows: { name: string; mobile: string }[];
  color: string;
  iconName: string;
}) {
  const [open, setOpen] = useState(true);
  if (rows.length === 0) return null;
  return (
    <View style={[styles.category, { borderColor: color + "50" }]}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <Icon name={iconName} size={16} color={color} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text
            style={{
              color,
              fontSize: Typography.sm,
              fontWeight: Typography.semibold,
            }}
          >
            {rows.length} {title}
          </Text>
          {subtitle ? (
            <Text style={styles.categorySubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      {open &&
        rows.map((r, i) => (
          <View
            key={i}
            style={[styles.categoryRow, i === 0 && styles.categoryRowFirst]}
          >
            <Text style={styles.categoryRowName}>{r.name}</Text>
            <Text style={styles.categoryRowMobile}>{r.mobile}</Text>
          </View>
        ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BulkAddMemberScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddMember } = useSubscription();

  const [step, setStep] = useState<Step>("form");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [loading, setLoading] = useState(false);

  // Excel feature availability (null = not yet checked)
  const [canExcel, setCanExcel] = useState<boolean | null>(null);

  // Global settings (applied to all rows in both modes)
  const [gymId, setGymId] = useState("");
  const [membershipPlanId, setMembershipPlanId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [paymentReceived, setPaymentReceived] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [globalErrors, setGlobalErrors] = useState<Record<string, string>>({});

  // Manual-mode rows
  const [rows, setRows] = useState<MemberRow[]>([
    makeRow(),
    makeRow(),
    makeRow(),
  ]);

  // Excel-mode file
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  // Preview & done state
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [confirmRows, setConfirmRows] = useState<any[]>([]);
  const [doneResult, setDoneResult] = useState<{
    added: number;
    skipped: number;
    total: number;
    failed: { name: string; mobile: string; reason: string }[];
  } | null>(null);

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

  // Check Excel feature availability once on mount
  useEffect(() => {
    membersApi
      .checkExcelFeature()
      .then((res: any) => setCanExcel(!res?.upgradeRequired))
      .catch(() => setCanExcel(false));
  }, []);

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

  const gymOptions = gymList.map((g) => ({ label: g.name, value: g.id }));
  const planOptions = [
    { label: "Select a plan…", value: "" },
    ...plans.map((p) => ({
      label: `${p.name} — ₹${Number(p.price).toLocaleString("en-IN")}`,
      value: p.id,
    })),
  ];
  const selectedPlan = plans.find((p) => p.id === membershipPlanId);

  const clearGlobalError = (key: string) =>
    setGlobalErrors((e) => ({ ...e, [key]: "" }));

  // ── Manual row management ───────────────────────────────────────────────────

  const updateRowName = (id: string, name: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, name, errors: { ...r.errors, name: undefined } }
          : r,
      ),
    );

  const updateRowMobile = (id: string, mobile: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, mobile, errors: { ...r.errors, mobile: undefined } }
          : r,
      ),
    );

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const hasCrossDup = (() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const n = normMobile(r.mobile);
      if (n.length === 10) counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return rows.some((r) => {
      const n = normMobile(r.mobile);
      return n.length === 10 && (counts.get(n) ?? 0) > 1;
    });
  })();

  // ── File picker ─────────────────────────────────────────────────────────────

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "text/comma-separated-values",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name ?? "upload",
          mimeType: asset.mimeType ?? "application/octet-stream",
        });
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not open file picker" });
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateGlobal = (): boolean => {
    const ge: Record<string, string> = {};
    if (!gymId) ge.gymId = "Please select a gym";
    if (!membershipPlanId) ge.membershipPlanId = "Select a membership plan";
    if (!startDate) ge.startDate = "Start date is required";
    if (!endDate) ge.endDate = "End date is required";
    if (paymentReceived === null) ge.paymentReceived = "Select Yes or No";
    setGlobalErrors(ge);
    return Object.keys(ge).length === 0;
  };

  const validateManualRows = (): boolean => {
    let valid = true;
    setRows((prev) =>
      prev.map((r) => {
        if (!r.name.trim() && !r.mobile.trim()) return r;
        const re: MemberRow["errors"] = {};
        if (!r.name.trim()) {
          re.name = "Name required";
          valid = false;
        }
        if (!r.mobile.trim()) {
          re.mobile = "Mobile required";
          valid = false;
        } else if (normMobile(r.mobile).length !== 10) {
          re.mobile = "10 digits required";
          valid = false;
        }
        return { ...r, errors: re };
      }),
    );
    const filled = rows.filter((r) => r.name.trim() || r.mobile.trim());
    if (filled.length === 0) {
      Toast.show({ type: "error", text1: "Add at least one member row" });
      return false;
    }
    return valid;
  };

  // ── Step 1 → 2: Preview ────────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!validateGlobal()) return;

    if (inputMode === "manual") {
      if (!validateManualRows()) return;
      if (hasCrossDup) {
        Toast.show({
          type: "error",
          text1: "Duplicate mobile numbers in this batch",
        });
        return;
      }
    } else {
      if (!pickedFile) {
        Toast.show({ type: "error", text1: "Please select a file first" });
        return;
      }
    }

    setLoading(true);
    try {
      let rawPreview: any;

      if (inputMode === "manual") {
        const filled = rows
          .filter((r) => r.name.trim() && r.mobile.trim())
          .map((r) => ({ name: r.name.trim(), mobile: r.mobile.trim() }));
        const data: any = await membersApi.bulkPreview({ gymId, rows: filled });
        rawPreview = data.preview;
      } else {
        const data: any = await membersApi.bulkUploadExcel(gymId, pickedFile!);
        rawPreview = data.preview;
      }

      // Attach global membership meta to every actionable row
      const attachMeta = (arr: PreviewRow[]) =>
        arr.map((r) => ({
          ...r,
          startDate,
          endDate,
          membershipPlanId,
          paymentReceived: paymentReceived as boolean,
        }));

      const p: BulkPreview = {
        newUsers: attachMeta(rawPreview?.newUsers ?? []),
        invited: attachMeta(rawPreview?.invited ?? []),
        onGymStack: attachMeta(rawPreview?.onGymStack ?? []),
        alreadyHere: rawPreview?.alreadyHere ?? [],
        invalid: rawPreview?.invalid ?? [],
      };

      setPreview(p);
      setConfirmRows([...p.newUsers, ...p.invited, ...p.onGymStack]);
      setStep("preview");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message ?? "Preview failed" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: Confirm ────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (confirmRows.length === 0) {
      Toast.show({ type: "error", text1: "No actionable rows to add" });
      return;
    }
    setLoading(true);
    try {
      const data: any = await membersApi.bulkConfirm({
        gymId,
        rows: confirmRows.map((r) => ({
          name: r.name,
          mobile: r.mobile,
          startDate: r.startDate,
          endDate: r.endDate,
          membershipPlanId: r.membershipPlanId,
          paymentReceived: r.paymentReceived,
        })),
      });
      qc.invalidateQueries({ queryKey: ["ownerMembers"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      setDoneResult(data);
      setStep("done");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to add members",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setInputMode("manual");
    setRows([makeRow(), makeRow(), makeRow()]);
    setPickedFile(null);
    setMembershipPlanId("");
    setEndDate("");
    setPaymentReceived(null);
    setPreview(null);
    setDoneResult(null);
    setGlobalErrors({});
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const headerTitle =
    step === "form"
      ? "Bulk Add Members"
      : step === "preview"
        ? "Review & Confirm"
        : "Done!";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlanGate allowed={canAddMember} featureLabel="Add Members">
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header
            title={headerTitle}
            back={step !== "done"}
            onBack={step === "preview" ? () => setStep("form") : undefined}
          />

          {/* ════════════════════════════════════ FORM STEP ══ */}
          {step === "form" && (
            <>
              {/* Global settings — always visible for both modes */}
              <Card style={{ marginTop: Spacing.md }}>
                <SectionHead icon="cog-outline" label="Global Settings" />
                <Text style={styles.sectionSubtitle}>
                  Applied to every member in this batch
                </Text>

                {gymList.length > 1 && (
                  <Dropdown
                    label="Gym *"
                    value={gymId}
                    onChange={(v) => {
                      setGymId(v);
                      clearGlobalError("gymId");
                    }}
                    options={gymOptions}
                    placeholder="Select gym"
                    leftIcon="dumbbell"
                    error={globalErrors.gymId}
                  />
                )}

                <Dropdown
                  label="Membership Plan *"
                  value={membershipPlanId}
                  onChange={(v) => {
                    setMembershipPlanId(v);
                    setPaymentReceived(null);
                    clearGlobalError("membershipPlanId");
                  }}
                  options={planOptions}
                  placeholder="Select a plan…"
                  leftIcon="tag-outline"
                  error={globalErrors.membershipPlanId}
                />

                <Input
                  label="Start Date *"
                  value={startDate}
                  onChangeText={(v) => {
                    setStartDate(v);
                    clearGlobalError("startDate");
                  }}
                  placeholder="YYYY-MM-DD"
                  leftIcon="calendar-start"
                  error={globalErrors.startDate}
                />

                <Input
                  label="End Date *"
                  value={endDate}
                  onChangeText={(v) => {
                    setEndDate(v);
                    clearGlobalError("endDate");
                  }}
                  placeholder="YYYY-MM-DD (auto-set from plan)"
                  leftIcon="calendar-end"
                  error={globalErrors.endDate}
                />

                {selectedPlan && (
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Plan Price</Text>
                    <Text style={styles.amountValue}>
                      ₹{Number(selectedPlan.price).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

                <PaymentToggle
                  value={paymentReceived}
                  onChange={(v) => {
                    setPaymentReceived(v);
                    clearGlobalError("paymentReceived");
                  }}
                  error={globalErrors.paymentReceived}
                />
              </Card>

              {/* Input mode tab switcher */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    inputMode === "manual" && styles.tabActive,
                  ]}
                  onPress={() => setInputMode("manual")}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="account-group-outline"
                    size={15}
                    color={
                      inputMode === "manual" ? Colors.primary : Colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      inputMode === "manual" && styles.tabTextActive,
                    ]}
                  >
                    Manual Entry
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    inputMode === "excel" && styles.tabActive,
                  ]}
                  onPress={() => setInputMode("excel")}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="file-excel-outline"
                    size={15}
                    color={
                      inputMode === "excel" ? Colors.primary : Colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      inputMode === "excel" && styles.tabTextActive,
                    ]}
                  >
                    Excel / CSV
                  </Text>
                  {canExcel === false && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>Pro+</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* ── Manual entry ── */}
              {inputMode === "manual" && (
                <View style={{ marginTop: Spacing.sm }}>
                  <View
                    style={[styles.sectionHead, { marginBottom: Spacing.sm }]}
                  >
                    <Icon
                      name="format-list-bulleted"
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>Members</Text>
                    {hasCrossDup && (
                      <View style={styles.dupWarning}>
                        <Icon
                          name="alert-outline"
                          size={12}
                          color={Colors.warning}
                        />
                        <Text style={styles.dupWarningText}>
                          Duplicate mobiles
                        </Text>
                      </View>
                    )}
                  </View>

                  {rows.map((row, i) => (
                    <View
                      key={row.id}
                      style={[
                        styles.rowCard,
                        (row.errors.name || row.errors.mobile) &&
                          styles.rowCardError,
                      ]}
                    >
                      <View style={styles.rowCardHeader}>
                        <Text style={styles.rowNum}>Member {i + 1}</Text>
                        <TouchableOpacity
                          onPress={() => removeRow(row.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon
                            name="close"
                            size={16}
                            color={Colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                      <Input
                        label="Full Name"
                        value={row.name}
                        onChangeText={(v) => updateRowName(row.id, v)}
                        placeholder="Member's full name"
                        leftIcon="account-outline"
                        autoCapitalize="words"
                        error={row.errors.name}
                        containerStyle={{ marginBottom: Spacing.sm }}
                      />
                      <Input
                        label="Mobile Number"
                        value={row.mobile}
                        onChangeText={(v) => updateRowMobile(row.id, v)}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                        leftIcon="phone-outline"
                        error={row.errors.mobile}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
                    <Icon name="plus" size={16} color={Colors.primary} />
                    <Text style={styles.addRowText}>Add Member Row</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Excel / CSV upload ── */}
              {inputMode === "excel" && (
                <Card style={{ marginTop: Spacing.sm }}>
                  <SectionHead
                    icon="file-excel-outline"
                    label="Excel / CSV Upload"
                  />

                  {canExcel === false ? (
                    /* Pro gate */
                    <View style={styles.proGate}>
                      <Icon
                        name="crown-outline"
                        size={20}
                        color={Colors.warning}
                      />
                      <Text style={styles.proGateTitle}>Pro plan required</Text>
                      <Text style={styles.proGateBody}>
                        Excel and CSV upload is available on the Pro plan and
                        above. Switch to Manual Entry to add members without an
                        upgrade.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Format hint */}
                      <View style={styles.formatHint}>
                        <Icon
                          name="information-outline"
                          size={14}
                          color={Colors.info}
                        />
                        <Text style={styles.formatHintText}>
                          Columns:{" "}
                          <Text style={{ fontWeight: "600" }}>Name</Text>,{" "}
                          <Text style={{ fontWeight: "600" }}>Mobile</Text>
                          {"\n"}Supported: .xlsx, .xls, .csv — max 2,000 rows
                        </Text>
                      </View>

                      {/* File picker */}
                      <TouchableOpacity
                        style={[
                          styles.filePicker,
                          pickedFile && styles.filePickerSelected,
                        ]}
                        onPress={handlePickFile}
                        activeOpacity={0.7}
                      >
                        {pickedFile ? (
                          <>
                            <Icon
                              name="file-check-outline"
                              size={28}
                              color={Colors.primary}
                            />
                            <Text
                              style={styles.filePickerName}
                              numberOfLines={1}
                            >
                              {pickedFile.name}
                            </Text>
                            <Text style={styles.filePickerChange}>
                              Tap to change
                            </Text>
                          </>
                        ) : (
                          <>
                            <Icon
                              name="file-upload-outline"
                              size={32}
                              color={Colors.textMuted}
                            />
                            <Text style={styles.filePickerPrompt}>
                              Tap to select file
                            </Text>
                            <Text style={styles.filePickerSub}>
                              .xlsx, .xls or .csv
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </Card>
              )}

              <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                <Button
                  label="Preview & Continue"
                  onPress={handlePreview}
                  loading={loading}
                  disabled={
                    (inputMode === "manual" && hasCrossDup) ||
                    (inputMode === "excel" && canExcel === false)
                  }
                />
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => navigation.goBack()}
                />
              </View>
            </>
          )}

          {/* ══════════════════════════════════ PREVIEW STEP ══ */}
          {step === "preview" && preview && (
            <View style={{ marginTop: Spacing.md }}>
              <CategorySection
                title="new members (SMS invite sent)"
                subtitle="Brand new to GymStack — will receive an SMS to complete their profile"
                rows={preview.newUsers}
                color={Colors.success}
                iconName="account-plus-outline"
              />
              <CategorySection
                title="members will be re-invited"
                subtitle="Already invited — a fresh SMS will be sent"
                rows={preview.invited}
                color={Colors.info}
                iconName="refresh"
              />
              <CategorySection
                title="existing GymStack users will be linked"
                subtitle="Already on GymStack — added silently with in-app notification"
                rows={preview.onGymStack}
                color={Colors.primary}
                iconName="link"
              />
              <CategorySection
                title="already in this gym (skipped)"
                rows={preview.alreadyHere}
                color={Colors.warning}
                iconName="alert-outline"
              />
              <CategorySection
                title="invalid rows (skipped)"
                rows={preview.invalid}
                color={Colors.error}
                iconName="close-circle-outline"
              />

              {confirmRows.length === 0 ? (
                <View style={styles.noActionBanner}>
                  <Icon name="alert-outline" size={16} color={Colors.warning} />
                  <Text style={styles.noActionText}>
                    No actionable rows — all members are already in this gym or
                    have invalid numbers.
                  </Text>
                </View>
              ) : (
                <Card style={{ marginTop: Spacing.md }}>
                  <Text
                    style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}
                  >
                    {confirmRows.length} member
                    {confirmRows.length !== 1 ? "s" : ""} will be added
                  </Text>
                  {confirmRows.slice(0, 5).map((r, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <Text style={styles.summaryName}>{r.name}</Text>
                      <Text
                        style={[
                          styles.summaryStatus,
                          {
                            color: r.paymentReceived
                              ? Colors.success
                              : Colors.textMuted,
                          },
                        ]}
                      >
                        {r.paymentReceived ? "Payment received" : "Pending"}
                      </Text>
                    </View>
                  ))}
                  {confirmRows.length > 5 && (
                    <Text style={styles.moreText}>
                      +{confirmRows.length - 5} more
                    </Text>
                  )}
                </Card>
              )}

              <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                <Button
                  label={`Confirm — Add ${confirmRows.length} Member${confirmRows.length !== 1 ? "s" : ""}`}
                  onPress={handleConfirm}
                  loading={loading}
                  disabled={confirmRows.length === 0}
                />
                <Button
                  label="Back"
                  variant="secondary"
                  onPress={() => setStep("form")}
                />
              </View>
            </View>
          )}

          {/* ════════════════════════════════════ DONE STEP ══ */}
          {step === "done" && doneResult && (
            <View style={{ marginTop: Spacing.md }}>
              <Card>
                <View style={styles.doneHeader}>
                  <View style={styles.doneIcon}>
                    <Icon
                      name="check-circle-outline"
                      size={28}
                      color={Colors.success}
                    />
                  </View>
                  <View>
                    <Text style={styles.doneTitle}>Bulk add complete!</Text>
                    <Text style={styles.doneSub}>
                      {doneResult.total} rows processed
                    </Text>
                  </View>
                </View>
                <View style={styles.doneStats}>
                  {[
                    {
                      value: doneResult.added,
                      label: "Added",
                      color: Colors.success,
                      bg: Colors.successFaded,
                    },
                    {
                      value: doneResult.skipped,
                      label: "Skipped",
                      color: Colors.warning,
                      bg: Colors.warningFaded,
                    },
                    {
                      value: doneResult.failed.length,
                      label: "Failed",
                      color: Colors.error,
                      bg: Colors.errorFaded,
                    },
                  ].map(({ value, label, color, bg }) => (
                    <View
                      key={label}
                      style={[
                        styles.statBox,
                        { borderColor: color + "40", backgroundColor: bg },
                      ]}
                    >
                      <Text style={[styles.statNum, { color }]}>{value}</Text>
                      <Text style={styles.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              {doneResult.failed.length > 0 && (
                <Card style={{ marginTop: Spacing.md }}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: Colors.error, marginBottom: Spacing.sm },
                    ]}
                  >
                    Failed rows
                  </Text>
                  {doneResult.failed.map((f, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <Text style={styles.summaryName}>
                        {f.name} ({f.mobile})
                      </Text>
                      <Text
                        style={{ color: Colors.error, fontSize: Typography.xs }}
                      >
                        {f.reason}
                      </Text>
                    </View>
                  ))}
                </Card>
              )}

              <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                <Button
                  label="View All Members"
                  onPress={() => navigation.goBack()}
                />
                <Button
                  label="Add More Members"
                  variant="secondary"
                  onPress={resetForm}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    flex: 1,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
    marginBottom: Spacing.md,
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
  amountLabel: { color: Colors.textMuted, fontSize: Typography.sm },
  amountValue: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  payRow: { flexDirection: "row", gap: Spacing.md },
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
  errorText: { color: Colors.error, fontSize: Typography.xs, marginTop: 4 },
  // Tab switcher
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    backgroundColor: Colors.primaryFaded,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  tabTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  proBadge: {
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  proBadgeText: {
    color: Colors.warning,
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  // Pro gate
  proGate: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  proGateTitle: {
    color: Colors.warning,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  proGateBody: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  // Format hint
  formatHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.infoFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.info + "30",
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  formatHintText: {
    flex: 1,
    color: Colors.info,
    fontSize: Typography.xs,
    lineHeight: 17,
  },
  // File picker
  filePicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
  },
  filePickerSelected: {
    borderColor: Colors.primary + "60",
    backgroundColor: Colors.primaryFaded,
  },
  filePickerPrompt: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  filePickerSub: { color: Colors.textMuted, fontSize: Typography.xs },
  filePickerName: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    maxWidth: "80%",
  },
  filePickerChange: { color: Colors.textMuted, fontSize: Typography.xs },
  // Dup warning
  dupWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  dupWarningText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  // Row cards
  rowCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rowCardError: { borderColor: Colors.error + "50" },
  rowCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  rowNum: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: "monospace",
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  addRowText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  // Category sections
  category: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  categorySubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  categoryRowFirst: { borderTopWidth: 1, borderTopColor: Colors.border },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    flex: 1,
  },
  categoryRowMobile: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: "monospace",
  },
  // No-action banner
  noActionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  noActionText: {
    flex: 1,
    color: Colors.warning,
    fontSize: Typography.sm,
    lineHeight: 18,
  },
  // Preview summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryName: { color: Colors.textPrimary, fontSize: Typography.sm, flex: 1 },
  summaryStatus: { fontSize: Typography.xs, fontWeight: Typography.medium },
  moreText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  // Done step
  doneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  doneIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.successFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  doneSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  doneStats: { flexDirection: "row", gap: Spacing.sm },
  statBox: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  statNum: { fontSize: Typography.xxl, fontWeight: Typography.bold },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
});
