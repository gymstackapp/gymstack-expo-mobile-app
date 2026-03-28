// mobile/src/screens/shared/ProfileScreen.tsx
import { profileApi } from "@/api/endpoints";
import { Button, Card, Dropdown, Header, ImageUpload, Input } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { useAuthStore } from "@/store/authStore";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ROLE_LABELS: Record<string, string> = {
  owner: "Gym Owner",
  trainer: "Trainer",
  member: "Member",
};

export function ProfileScreen() {
  const { profile, logout, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? "",
    mobileNumber: profile?.mobileNumber ?? "",
    city: profile?.city ?? "",
    gender: profile?.gender ?? "",
  });

  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: (data: object) => profileApi.update(data as any),
    onSuccess: (updated: any) => {
      updateProfile(updated);
      setEditing(false);
      setForm({
        fullName: updated.fullName ?? "",
        mobileNumber: updated.mobileNumber ?? "",
        city: updated.city ?? "",
        gender: updated.gender ?? "",
      });
      Toast.show({ type: "success", text1: "Profile updated!" });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  const pwMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      setShowPwForm(false);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      Toast.show({ type: "success", text1: "Password changed successfully!" });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  // ── Actions ──────────────────────────────────────────────────────────────

  const onSave = () => {
    if (!form.fullName.trim()) {
      Toast.show({ type: "error", text1: "Name is required" });
      return;
    }
    updateMutation.mutate(form);
  };

  const onAvatarChange = (url: string | null) => {
    updateMutation.mutate({ avatarUrl: url });
  };

  const onCancelEdit = () => {
    setForm({
      fullName: profile?.fullName ?? "",
      mobileNumber: profile?.mobileNumber ?? "",
      city: profile?.city ?? "",
      gender: profile?.gender ?? "",
    });
    setEditing(false);
  };

  const onChangePasswordPress = () => {
    showAlert(
      "Change Password",
      "You'll need your current password to set a new one. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => setShowPwForm(true),
        },
      ],
    );
  };

  const onSubmitPassword = () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm) {
      Toast.show({ type: "error", text1: "All fields are required" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      Toast.show({ type: "error", text1: "Passwords don't match" });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 8 characters",
      });
      return;
    }
    showAlert(
      "Confirm Password Change",
      "Are you sure you want to update your password?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          style: "destructive",
          onPress: () =>
            pwMutation.mutate({
              currentPassword: pwForm.currentPassword,
              newPassword: pwForm.newPassword,
            }),
        },
      ],
    );
  };

  const onLogout = () => {
    showAlert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const INFO_ROWS = [
    { icon: "account-outline", label: "Full Name", value: profile?.fullName },
    { icon: "email-outline", label: "Email", value: profile?.email },
    { icon: "phone-outline", label: "Mobile", value: profile?.mobileNumber },
    { icon: "map-marker-outline", label: "City", value: profile?.city },
    { icon: "gender-male-female", label: "Gender", value: profile?.gender },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header menu title="Profile" style={{ marginBottom: Spacing.lg }} />

        {/* ── Hero ────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <ImageUpload
              value={profile?.avatarUrl ?? null}
              onChange={onAvatarChange}
              folder="avatars"
              size={88}
              shape="circle"
              placeholder="Photo"
              showOverlay={false}
              style={styles.avatarUpload}
            />
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.heroName}>{profile?.fullName}</Text>

          <View style={styles.roleBadge}>
            <Icon
              name="shield-check-outline"
              size={12}
              color={Colors.primary}
            />
            <Text style={styles.roleText}>
              {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}
            </Text>
          </View>

          {profile?.email ? (
            <Text style={styles.heroEmail}>{profile.email}</Text>
          ) : null}

          {/* Quick stats row */}
          {profile?.city || profile?.mobileNumber ? (
            <View style={styles.heroMeta}>
              {profile?.city ? (
                <View style={styles.heroMetaItem}>
                  <Icon
                    name="map-marker-outline"
                    size={13}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.heroMetaText}>{profile.city}</Text>
                </View>
              ) : null}
              {profile?.mobileNumber ? (
                <View style={styles.heroMetaItem}>
                  <Icon
                    name="phone-outline"
                    size={13}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.heroMetaText}>
                    {profile.mobileNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Wallet balance ──────────────────────────────────── */}
        {profile?.wallet != null && (
          <Card style={styles.walletCard}>
            <View style={styles.walletRow}>
              <View style={styles.walletIconWrap}>
                <Icon name="wallet-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletAmount}>
                  ₹{Number(profile.wallet.balance).toLocaleString("en-IN")}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.textMuted} />
            </View>
          </Card>
        )}

        {/* ── Personal info card ──────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon
                name="account-edit-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.cardTitle}>Personal Info</Text>
            </View>
            {!editing ? (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing(true)}
              >
                <Icon name="pencil-outline" size={15} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onCancelEdit}>
                <Icon name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.editFormWrap}>
              {updateMutation.isPending && (
                <View style={styles.editFormLoading}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                </View>
              )}
              <View style={[styles.editForm, updateMutation.isPending && styles.editFormDimmed]}>
                <Input
                  label="Full Name *"
                  value={form.fullName}
                  onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
                  editable={!updateMutation.isPending}
                />
                <Input
                  label="Mobile Number"
                  value={form.mobileNumber}
                  onChangeText={(v) => setForm((f) => ({ ...f, mobileNumber: v }))}
                  keyboardType="phone-pad"
                  editable={!updateMutation.isPending}
                />
                <Input
                  label="City"
                  value={form.city}
                  onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  editable={!updateMutation.isPending}
                />
                <Dropdown
                  label="Gender"
                  value={form.gender}
                  onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                  options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                  placeholder="Select gender"
                  leftIcon="gender-male-female"
                  disabled={updateMutation.isPending}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onCancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <Button
                    label="Save Changes"
                    onPress={onSave}
                    loading={updateMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              {INFO_ROWS.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.infoRow,
                    i === INFO_ROWS.length - 1 && styles.infoRowLast,
                  ]}
                >
                  <View style={styles.infoIconWrap}>
                    <Icon name={row.icon} size={16} color={Colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value || "—"}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── Account security ────────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name="lock-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Account Security</Text>
            </View>
          </View>

          {!showPwForm ? (
            <TouchableOpacity
              style={styles.securityRow}
              onPress={onChangePasswordPress}
              activeOpacity={0.7}
            >
              <View style={styles.securityRowLeft}>
                <Icon
                  name="key-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <View>
                  <Text style={styles.securityLabel}>Change Password</Text>
                  <Text style={styles.securitySub}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editForm}>
              <Input
                label="Current Password"
                value={pwForm.currentPassword}
                onChangeText={(v) =>
                  setPwForm((f) => ({ ...f, currentPassword: v }))
                }
                password
              />
              <Input
                label="New Password"
                value={pwForm.newPassword}
                onChangeText={(v) =>
                  setPwForm((f) => ({ ...f, newPassword: v }))
                }
                password
              />
              <Input
                label="Confirm New Password"
                value={pwForm.confirm}
                onChangeText={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                password
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowPwForm(false);
                    setPwForm({
                      currentPassword: "",
                      newPassword: "",
                      confirm: "",
                    });
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Button
                  label="Update Password"
                  onPress={onSubmitPassword}
                  loading={pwMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatarUpload: { width: 88 },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  heroName: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginBottom: Spacing.sm,
  },
  roleText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  heroEmail: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  heroMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText: { color: Colors.textMuted, fontSize: Typography.xs },

  // ── Wallet ────────────────────────────────────────────────
  walletCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  walletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  walletLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  walletAmount: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },

  // ── Cards ─────────────────────────────────────────────────
  card: { marginBottom: Spacing.md },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  editBtnText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  // ── Info rows ─────────────────────────────────────────────
  infoList: { gap: 0 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },


  // ── Edit form ─────────────────────────────────────────────
  editFormWrap: { position: "relative" },
  editFormLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  editFormDimmed: { opacity: 0.4 },
  editForm: { gap: Spacing.xs },
  editActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },

  // ── Security ──────────────────────────────────────────────
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  securityRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  securityLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  securitySub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },

  // ── Sign out ──────────────────────────────────────────────
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.errorFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
