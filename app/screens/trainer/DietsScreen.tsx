// app/screens/trainer/DietsScreen.tsx
// Trainer diet plan manager: list → create/edit (modal) → per-day time slots → food items.
// planData format: { "Monday__08:00 AM": [{ name, qty, calories, protein, carbs, fat }] }

import { trainerDietsApi, trainerMembersApi } from "@/api/endpoints";
import { Avatar, Card, EmptyState, Header, Input, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
type Day = typeof DAYS[number];

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"] as const;

// ── Types ──────────────────────────────────────────────────────────────────────

interface FoodItem { name: string; qty: string; calories: string; protein: string; carbs: string; fat: string }

interface DietPlan {
  id: string; title: string; goal: string | null;
  caloriesTarget: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
  isGlobal: boolean; createdAt: string; planData: any;
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null;
  gym: { name: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slotKey(day: Day, h: string, m: string, p: string) { return `${day}__${h}:${m} ${p}`; }
function slotLabel(day: Day, key: string) { return key.replace(`${day}__`, ""); }
function blank(): FoodItem { return { name: "", qty: "", calories: "", protein: "", carbs: "", fat: "" }; }

// ── Time picker ────────────────────────────────────────────────────────────────

function TimePicker({ hour, minute, period, onChange }: { hour: string; minute: string; period: string; onChange: (h: string, m: string, p: string) => void }) {
  return (
    <View style={tp.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, maxWidth: 180 }}>
        {HOURS.map((h) => (
          <TouchableOpacity key={h} onPress={() => onChange(h, minute, period)} style={[tp.pill, hour === h && tp.pillActive]}>
            <Text style={[tp.pillTxt, hour === h && tp.pillActiveTxt]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={tp.sep}>:</Text>
      <View style={tp.group}>
        {MINUTES.map((m) => (
          <TouchableOpacity key={m} onPress={() => onChange(hour, m, period)} style={[tp.pill, minute === m && tp.pillActive]}>
            <Text style={[tp.pillTxt, minute === m && tp.pillActiveTxt]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={tp.group}>
        {PERIODS.map((p) => (
          <TouchableOpacity key={p} onPress={() => onChange(hour, minute, p)} style={[tp.pill, period === p && tp.pillActive]}>
            <Text style={[tp.pillTxt, period === p && tp.pillActiveTxt]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const tp = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexWrap: "wrap" },
  group: { flexDirection: "row", gap: Spacing.xs },
  sep: { color: Colors.textMuted, fontSize: Typography.lg, fontWeight: "700" },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceRaised },
  pillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  pillTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  pillActiveTxt: { color: Colors.primary, fontWeight: "700" },
});

// ── Food item row ──────────────────────────────────────────────────────────────

function FoodItemRow({ item, onChange, onRemove }: { item: FoodItem; onChange: (f: keyof FoodItem, v: string) => void; onRemove: () => void }) {
  return (
    <View style={fi.wrap}>
      <View style={fi.header}>
        <Input label="Food / Item" value={item.name} onChangeText={(v) => onChange("name", v)} placeholder="e.g. Oats" style={fi.nameInput} />
        <TouchableOpacity style={fi.removeBtn} onPress={onRemove}>
          <Icon name="close-circle-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <View style={fi.macros}>
        {([["qty","Qty"],["calories","Cal"],["protein","P(g)"],["carbs","C(g)"],["fat","F(g)"]] as [keyof FoodItem, string][]).map(([f, label]) => (
          <View key={f} style={{ flex: 1 }}>
            <Input label={label} value={item[f]} onChangeText={(v) => onChange(f, v)}
              keyboardType={f === "qty" ? "default" : "numeric"} placeholder={f === "qty" ? "100g" : "0"} />
          </View>
        ))}
      </View>
    </View>
  );
}
const fi = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  nameInput: { flex: 1 },
  removeBtn: { paddingTop: 24, flexShrink: 0 },
  macros: { flexDirection: "row", gap: Spacing.xs },
});

// ── Plan builder modal ─────────────────────────────────────────────────────────

function PlanModal({
  visible, editing, members, onClose, onSave, isSaving,
}: {
  visible: boolean; editing: DietPlan | null; members: any[];
  onClose: () => void; onSave: (payload: object) => void; isSaving: boolean;
}) {
  const [title, setTitle]               = useState("");
  const [goal, setGoal]                 = useState("");
  const [calories, setCalories]         = useState("");
  const [protein, setProtein]           = useState("");
  const [carbs, setCarbs]               = useState("");
  const [fat, setFat]                   = useState("");
  const [freeForAll, setFreeForAll]     = useState(false);
  const [memberId, setMemberId]         = useState("");
  const [planData, setPlanData]         = useState<Record<string, FoodItem[]>>({});
  const [activeDay, setActiveDay]       = useState<Day>("Monday");
  const [slotH, setSlotH]               = useState("08");
  const [slotM, setSlotM]               = useState("00");
  const [slotP, setSlotP]               = useState("AM");
  const [showMembers, setShowMembers]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title); setGoal(editing.goal ?? "");
      setCalories(editing.caloriesTarget?.toString() ?? "");
      setProtein(editing.proteinG?.toString() ?? "");
      setCarbs(editing.carbsG?.toString() ?? "");
      setFat(editing.fatG?.toString() ?? "");
      setFreeForAll(editing.isGlobal); setMemberId(editing.assignedMember?.id ?? "");
      setPlanData(editing.planData ?? {});
    } else {
      setTitle(""); setGoal(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
      setFreeForAll(false); setMemberId(""); setPlanData({});
    }
    setActiveDay("Monday"); setSlotH("08"); setSlotM("00"); setSlotP("AM");
  }, [visible, editing]);

  const daySlots = Object.keys(planData).filter((k) => k.startsWith(`${activeDay}__`)).sort();

  function addSlot() {
    const key = slotKey(activeDay, slotH, slotM, slotP);
    if (planData[key]) { Toast.show({ type: "error", text1: "Slot already exists" }); return; }
    setPlanData((d) => ({ ...d, [key]: [blank()] }));
  }

  function addFood(key: string) { setPlanData((d) => ({ ...d, [key]: [...(d[key] ?? []), blank()] })); }

  function removeFood(key: string, idx: number) {
    setPlanData((d) => {
      const items = (d[key] ?? []).filter((_, i) => i !== idx);
      if (items.length === 0) { const n = { ...d }; delete n[key]; return n; }
      return { ...d, [key]: items };
    });
  }

  function updateFood(key: string, idx: number, field: keyof FoodItem, value: string) {
    setPlanData((d) => {
      const items = [...(d[key] ?? [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...d, [key]: items };
    });
  }

  function removeSlot(key: string) { setPlanData((d) => { const n = { ...d }; delete n[key]; return n; }); }

  const handleSave = () => {
    if (!title.trim()) { Toast.show({ type: "error", text1: "Plan title is required" }); return; }
    onSave({
      title: title.trim(), goal: goal.trim() || null,
      caloriesTarget: calories ? Number(calories) : null,
      proteinG: protein ? Number(protein) : null,
      carbsG: carbs ? Number(carbs) : null,
      fatG: fat ? Number(fat) : null,
      isGlobal: freeForAll,
      memberId: !freeForAll && memberId ? memberId : undefined,
      planData,
    });
  };

  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={pm.header}>
          <TouchableOpacity onPress={onClose}><Icon name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
          <Text style={pm.headerTitle}>{editing ? "Edit Diet Plan" : "New Diet Plan"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[pm.saveBtn, isSaving && { opacity: 0.5 }]}>{isSaving ? "Saving…" : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60, gap: Spacing.lg }}>
          {/* Metadata */}
          <Card style={{ gap: Spacing.md }}>
            <Input label="Plan Title *" value={title} onChangeText={setTitle} placeholder="e.g. Weight Loss Plan" leftIcon="food-apple-outline" />
            <Input label="Goal" value={goal} onChangeText={setGoal} placeholder="e.g. Fat loss, muscle gain" leftIcon="target" />
            <View style={pm.macroRow}>
              <View style={{ flex: 1 }}><Input label="Calories (kcal)" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="2200" /></View>
              <View style={{ flex: 1 }}><Input label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="150" /></View>
            </View>
            <View style={pm.macroRow}>
              <View style={{ flex: 1 }}><Input label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="200" /></View>
              <View style={{ flex: 1 }}><Input label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="60" /></View>
            </View>
          </Card>

          {/* Toggle + member assign */}
          <Card style={{ gap: Spacing.md }}>
            <View style={pm.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={pm.toggleTitle}>Available to all members</Text>
                <Text style={pm.toggleSub}>Share this plan with your entire gym</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setFreeForAll((v) => !v); if (!freeForAll) setMemberId(""); }}
                style={[pm.toggle, freeForAll && { backgroundColor: Colors.primary }]}
              >
                <View style={[pm.toggleThumb, freeForAll && pm.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
            {!freeForAll && (
              <>
                <Text style={pm.label}>Assign to Member</Text>
                <TouchableOpacity style={pm.memberSelector} onPress={() => setShowMembers(true)}>
                  {selectedMember ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                      <Avatar name={selectedMember.profile?.fullName ?? ""} url={selectedMember.profile?.avatarUrl} size={26} />
                      <Text style={pm.memberTxt}>{selectedMember.profile?.fullName}</Text>
                    </View>
                  ) : (
                    <Text style={pm.memberPlaceholder}>— No specific member —</Text>
                  )}
                  <Icon name="chevron-down" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Day tabs */}
          <View>
            <Text style={pm.label}>Meal Schedule</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, paddingBottom: Spacing.sm }}>
              {DAYS.map((day) => {
                const cnt = Object.keys(planData).filter((k) => k.startsWith(`${day}__`)).length;
                const active = day === activeDay;
                return (
                  <TouchableOpacity key={day} onPress={() => setActiveDay(day)} style={[pm.dayTab, active && pm.dayTabActive]}>
                    <Text style={[pm.dayTabTxt, active && pm.dayTabTxtActive]}>{day.slice(0, 3)}</Text>
                    {cnt > 0 && <View style={[pm.dayBadge, active && { backgroundColor: Colors.primary }]}><Text style={pm.dayBadgeTxt}>{cnt}</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Add slot */}
            <Card style={{ gap: Spacing.sm }}>
              <Text style={pm.label}>Add time slot for {activeDay}</Text>
              <TimePicker hour={slotH} minute={slotM} period={slotP} onChange={(h, m, p) => { setSlotH(h); setSlotM(m); setSlotP(p); }} />
              <TouchableOpacity style={pm.addSlotBtn} onPress={addSlot}>
                <Icon name="plus" size={13} color={Colors.primary} />
                <Text style={pm.addSlotTxt}>Add {slotH}:{slotM} {slotP}</Text>
              </TouchableOpacity>
            </Card>

            {/* Existing slots */}
            {daySlots.length === 0 ? (
              <Text style={pm.emptyDay}>No meal slots for {activeDay} yet.</Text>
            ) : (
              <View style={{ gap: Spacing.md }}>
                {daySlots.map((key) => {
                  const label = slotLabel(activeDay, key);
                  const items = planData[key] ?? [];
                  const slotCals = items.reduce((s, it) => s + (parseFloat(it.calories) || 0), 0);
                  return (
                    <View key={key}>
                      <View style={pm.slotHeader}>
                        <View style={pm.slotTime}>
                          <Text style={pm.slotTimeTxt}>{label}</Text>
                        </View>
                        {slotCals > 0 && <Text style={pm.slotCals}>{slotCals} kcal</Text>}
                        <TouchableOpacity onPress={() => removeSlot(key)} style={{ marginLeft: "auto" as any }}>
                          <Icon name="trash-can-outline" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                      <View style={{ gap: Spacing.sm }}>
                        {items.map((item, idx) => (
                          <FoodItemRow key={idx} item={item}
                            onChange={(f, v) => updateFood(key, idx, f, v)}
                            onRemove={() => removeFood(key, idx)} />
                        ))}
                        <TouchableOpacity style={pm.addFoodBtn} onPress={() => addFood(key)}>
                          <Icon name="plus" size={13} color={Colors.textMuted} />
                          <Text style={pm.addFoodTxt}>Add food item</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Member picker */}
        <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
          <View style={pm.sheetOverlay}>
            <View style={pm.sheet}>
              <View style={pm.sheetHeader}>
                <Text style={pm.sheetTitle}>Select Member</Text>
                <TouchableOpacity onPress={() => setShowMembers(false)}><Icon name="close" size={20} color={Colors.textMuted} /></TouchableOpacity>
              </View>
              <TouchableOpacity style={pm.sheetRow} onPress={() => { setMemberId(""); setShowMembers(false); }}>
                <Text style={pm.sheetRowTxt}>— No specific member —</Text>
                {!memberId && <Icon name="check" size={16} color={Colors.primary} />}
              </TouchableOpacity>
              <FlatList
                data={members}
                keyExtractor={(m) => m.id}
                renderItem={({ item: m }) => (
                  <TouchableOpacity style={pm.sheetRow} onPress={() => { setMemberId(m.id); setShowMembers(false); }}>
                    <Avatar name={m.profile?.fullName ?? ""} url={m.profile?.avatarUrl} size={32} />
                    <Text style={[pm.sheetRowTxt, { flex: 1 }]}>{m.profile?.fullName}</Text>
                    {memberId === m.id && <Icon name="check" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const pm = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  saveBtn: { color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" },
  macroRow: { flexDirection: "row", gap: Spacing.sm },
  label: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600", marginBottom: Spacing.sm },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  toggleTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  toggleSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: Radius.full, backgroundColor: Colors.border, justifyContent: "center", paddingHorizontal: 3 },
  toggleThumb: { width: 18, height: 18, borderRadius: Radius.full, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: "flex-end" },
  memberSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  memberTxt: { color: Colors.textPrimary, fontSize: Typography.sm },
  memberPlaceholder: { color: Colors.textMuted, fontSize: Typography.sm },
  dayTab: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceRaised },
  dayTabActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  dayTabTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  dayTabTxtActive: { color: Colors.primary },
  dayBadge: { backgroundColor: Colors.border, borderRadius: Radius.full, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  dayBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  addSlotBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, alignSelf: "flex-start", backgroundColor: Colors.primaryFaded, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.primary + "40" },
  addSlotTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  emptyDay: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: "center", paddingVertical: Spacing.md },
  slotHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  slotTime: { backgroundColor: Colors.primaryFaded, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 3 },
  slotTimeTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "700" },
  slotCals: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "600" },
  addFoodBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed" },
  addFoodTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingBottom: 32, maxHeight: "70%" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetRowTxt: { color: Colors.textPrimary, fontSize: Typography.sm },
});

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, onEdit, onDelete, isDeleting }: { plan: DietPlan; onEdit: () => void; onDelete: () => void; isDeleting: boolean }) {
  const totalSlots = Object.keys(plan.planData ?? {}).length;
  const totalItems = Object.values(plan.planData ?? {}).reduce((s: number, arr: any) => s + arr.length, 0);

  return (
    <Card style={{ opacity: isDeleting ? 0.5 : 1, gap: Spacing.sm }}>
      <View style={pc.top}>
        {plan.isGlobal && <View style={pc.globalBadge}><Text style={pc.globalTxt}>All Members</Text></View>}
        {plan.caloriesTarget && (
          <View style={pc.calsBadge}>
            <Icon name="fire" size={11} color={Colors.primary} />
            <Text style={pc.calsTxt}>{plan.caloriesTarget} kcal</Text>
          </View>
        )}
      </View>

      <Text style={pc.name}>{plan.title}</Text>
      {plan.goal && <Text style={pc.goal}>🎯 {plan.goal}</Text>}

      {(plan.proteinG || plan.carbsG || plan.fatG) && (
        <View style={pc.macros}>
          {plan.proteinG && <Text style={[pc.macro, { color: "#60a5fa", backgroundColor: "#60a5fa12" }]}>P {plan.proteinG}g</Text>}
          {plan.carbsG   && <Text style={[pc.macro, { color: "#eab308", backgroundColor: "#eab30812" }]}>C {plan.carbsG}g</Text>}
          {plan.fatG     && <Text style={[pc.macro, { color: "#f87171", backgroundColor: "#f8717112" }]}>F {plan.fatG}g</Text>}
        </View>
      )}

      <View style={pc.meta}>
        <Text style={pc.metaTxt}>{totalItems} items · {totalSlots} slot{totalSlots !== 1 ? "s" : ""}</Text>
        {plan.assignedMember ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Avatar name={plan.assignedMember.profile.fullName} url={plan.assignedMember.profile.avatarUrl} size={16} />
            <Text style={pc.metaTxt}>{plan.assignedMember.profile.fullName}</Text>
          </View>
        ) : (
          <Text style={[pc.metaTxt, { color: Colors.textMuted + "60" }]}>Unassigned</Text>
        )}
      </View>

      <View style={pc.actions}>
        <TouchableOpacity style={pc.actionBtn} onPress={onEdit}>
          <Icon name="pencil-outline" size={13} color={Colors.primary} />
          <Text style={[pc.actionTxt, { color: Colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.actionBtn} onPress={onDelete} disabled={isDeleting}>
          <Icon name={isDeleting ? "loading" : "archive-outline"} size={13} color={Colors.error} />
          <Text style={[pc.actionTxt, { color: Colors.error }]}>{isDeleting ? "Archiving…" : "Archive"}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const pc = StyleSheet.create({
  top: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  globalBadge: { backgroundColor: Colors.purpleFaded, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  globalTxt: { color: Colors.purple, fontSize: 10, fontWeight: "700" },
  calsBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.primaryFaded, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  calsTxt: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  goal: { color: Colors.primary + "BB", fontSize: Typography.xs },
  macros: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  macro: { fontSize: 10, fontWeight: "700", borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  metaTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 6 },
  actionTxt: { fontSize: Typography.xs, fontWeight: "600" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function DietsScreen() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing]           = useState<DietPlan | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const { data: plans = [], isLoading, refetch, isRefetching } = useQuery<DietPlan[]>({
    queryKey: ["trainerDiets"],
    queryFn: () => trainerDietsApi.list() as Promise<DietPlan[]>,
    staleTime: 60_000,
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["trainerMembers"],
    queryFn: () => trainerMembersApi.list() as Promise<any[]>,
    staleTime: 300_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => trainerDietsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainerDiets"] }); setModalVisible(false); setEditing(null); Toast.show({ type: "success", text1: "Diet plan created!" }); },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to create plan" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => trainerDietsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainerDiets"] }); setModalVisible(false); setEditing(null); Toast.show({ type: "success", text1: "Plan updated!" }); },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to update plan" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainerDietsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainerDiets"] }); Toast.show({ type: "success", text1: "Plan archived" }); },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to archive" }),
    onSettled: () => setDeletingId(null),
  });

  const handleSave = (payload: object) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          menu
          title="Diet Plans"
          subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
          right={
            <TouchableOpacity style={s.addBtn} onPress={() => { setEditing(null); setModalVisible(true); }}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={3} itemHeight={140} gap={Spacing.md} />
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          icon="food-apple-outline"
          title="No diet plans yet"
          subtitle="Create meal schedules with macros for your members"
          action={
            <TouchableOpacity style={s.emptyAction} onPress={() => { setEditing(null); setModalVisible(true); }}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={s.emptyActionTxt}>Create Plan</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onEdit={() => { setEditing(item); setModalVisible(true); }}
              onDelete={() => { setDeletingId(item.id); deleteMutation.mutate(item.id); }}
              isDeleting={deletingId === item.id}
            />
          )}
        />
      )}

      <PlanModal
        visible={modalVisible}
        editing={editing}
        members={members}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  addBtn: { width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  emptyAction: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  emptyActionTxt: { color: "#fff", fontWeight: "700", fontSize: Typography.sm },
});
