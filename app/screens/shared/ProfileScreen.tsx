// mobile/src/screens/shared/ProfileScreen.tsx
import { useAuthStore } from "@/store/authStore";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
// import { profileApi } from "@/api/endpoints"
// import { Avatar, Button, Input, Card, Header } from "@/components/common"
import { Colors, Radius, Spacing, Typography } from "@/theme";

export function ProfileScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { profile, logout, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? "",
    mobileNumber: profile?.mobileNumber ?? "",
    city: profile?.city ?? "",
    gender: profile?.gender ?? "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [showPwForm, setShowPwForm] = useState(false);

  // const updateMutation = useMutation({
  //     mutationFn: (data: object) => profileApi.update(data as any),
  //     onSuccess: (updated: any) => {
  //         updateProfile(updated)
  //         setEditing(false)
  //         Toast.show({ type: "success", text1: "Profile updated!" })
  //     },
  //     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  // })

  // const pwMutation = useMutation({
  //     mutationFn: profileApi.changePassword,
  //     onSuccess: () => {
  //         setShowPwForm(false)
  //         setPwForm({ currentPassword: "", newPassword: "", confirm: "" })
  //         Toast.show({ type: "success", text1: "Password changed!" })
  //     },
  //     onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  // })

  // const onSave = () => {
  //     if (!form.fullName.trim()) { Toast.show({ type: "error", text1: "Name is required" }); return }
  //     updateMutation.mutate(form)
  // }

  // const onChangePassword = () => {
  //     if (!pwForm.currentPassword || !pwForm.newPassword) { Toast.show({ type: "error", text1: "All fields required" }); return }
  //     if (pwForm.newPassword !== pwForm.confirm) { Toast.show({ type: "error", text1: "Passwords don't match" }); return }
  //     if (pwForm.newPassword.length < 8) { Toast.show({ type: "error", text1: "Password must be at least 8 characters" }); return }
  //     pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  // }

  const onLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const ROLE_LABELS: Record<string, string> = {
    owner: "Gym Owner",
    trainer: "Trainer",
    member: "Member",
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* <Header title="Profile" back /> */}

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {/* <Avatar name={profile?.fullName ?? "?"} url={profile?.avatarUrl} size={80} /> */}
          <Text style={styles.displayName}>{profile?.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
            </Text>
          </View>
          {profile?.email && <Text style={styles.email}>{profile.email}</Text>}
        </View>

        {/* Edit form */}
        {/* <Card style={{ marginBottom: Spacing.lg }}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Personal Info</Text>
                        <TouchableOpacity onPress={() => setEditing(!editing)}>
                            <Icon name={editing ? "close" : "pencil-outline"} size={18} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {editing ? (
                        <>
                            <Input label="Full Name *" value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} />
                            <Input label="Mobile Number" value={form.mobileNumber} onChangeText={v => setForm(f => ({ ...f, mobileNumber: v }))} keyboardType="phone-pad" />
                            <Input label="City" value={form.city} onChangeText={v => setForm(f => ({ ...f, city: v }))} />
                            <Button label="Save Changes" onPress={onSave} loading={updateMutation.isPending} style={{ marginTop: Spacing.sm }} />
                        </>
                    ) : (
                        <>
                            {[
                                { icon: "account-outline", label: "Name", value: profile?.fullName },
                                { icon: "phone-outline", label: "Mobile", value: profile?.mobileNumber },
                                { icon: "map-marker-outline", label: "City", value: profile?.city },
                                { icon: "gender-male-female", label: "Gender", value: profile?.gender },
                            ].map(row => (
                                <View key={row.label} style={styles.infoRow}>
                                    <Icon name={row.icon} size={16} color={Colors.textMuted} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>{row.label}</Text>
                                        <Text style={styles.infoValue}>{row.value || "—"}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </Card> */}

        {/* Change password */}
        {/* <Card style={{ marginBottom: Spacing.lg }}>
                    <TouchableOpacity style={styles.cardHeader} onPress={() => setShowPwForm(!showPwForm)}>
                        <Text style={styles.cardTitle}>Change Password</Text>
                        <Icon name={showPwForm ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                    {showPwForm && (
                        <>
                            <Input label="Current Password" value={pwForm.currentPassword} onChangeText={v => setPwForm(f => ({ ...f, currentPassword: v }))} password />
                            <Input label="New Password" value={pwForm.newPassword} onChangeText={v => setPwForm(f => ({ ...f, newPassword: v }))} password />
                            <Input label="Confirm New Password" value={pwForm.confirm} onChangeText={v => setPwForm(f => ({ ...f, confirm: v }))} password />
                            <Button label="Update Password" onPress={onChangePassword} loading={pwMutation.isPending} style={{ marginTop: Spacing.sm }} />
                        </>
                    )}
                </Card> */}

        {/* Wallet */}
        {/* {profile?.wallet && (
                    <Card style={{ marginBottom: Spacing.lg }}>
                        <View style={styles.walletRow}>
                            <View style={styles.walletIconWrap}>
                                <Icon name="wallet-outline" size={20} color={Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: Spacing.md }}>
                                <Text style={styles.infoLabel}>Wallet Balance</Text>
                                <Text style={styles.walletBalance}>₹{Number(profile.wallet.balance).toLocaleString("en-IN")}</Text>
                            </View>
                        </View>
                    </Card>
                )} */}

        {/* Sign out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Icon name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  roleBadge: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  roleText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  email: { color: Colors.textMuted, fontSize: Typography.sm },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  infoValue: { color: Colors.textPrimary, fontSize: Typography.sm },
  walletRow: { flexDirection: "row", alignItems: "center" },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  walletBalance: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
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
