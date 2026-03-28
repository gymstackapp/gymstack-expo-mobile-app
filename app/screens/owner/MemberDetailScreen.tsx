// mobile/src/screens/owner/MemberDetailScreen.tsx
import { membersApi } from "@/api/endpoints";
import { Avatar, Badge, Card, Header, ListRow, Skeleton } from "@/components";
import { showAlert } from "@/components/AppAlert";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type {
  AttendanceRecord,
  GymMemberDetail,
  PaymentRecord,
} from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
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

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function OwnerMemberDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const qc = useQueryClient();
  const { memberId } = route.params as { memberId: string };
  const [tab, setTab] = useState<"info" | "attendance" | "payments">("info");

  const { data, isLoading, refetch, isRefetching } = useQuery<GymMemberDetail>({
    queryKey: ["ownerMember", memberId],
    queryFn: () => membersApi.get(memberId) as Promise<GymMemberDetail>,
    enabled: !!memberId,
  });

  const suspendMutation = useMutation({
    mutationFn: () =>
      membersApi.update(memberId, {
        status: data?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMember", memberId] });
      qc.invalidateQueries({ queryKey: ["ownerMembers"] });
      Toast.show({ type: "success", text1: "Member status updated" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  const renewMutation = useMutation({
    mutationFn: (planId: string) =>
      membersApi.renew(memberId, {
        membershipPlanId: planId,
        paymentAmount: data?.membershipPlan?.price,
        paymentMethod: "CASH",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerMember", memberId] });
      Toast.show({ type: "success", text1: "Membership renewed! ✅" });
    },
    onError: (err: Error) => Toast.show({ type: "error", text1: err.message }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Member" back />
          <Skeleton height={120} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const profile = data.profile;
  const plan = data.membershipPlan;

  const daysLeft = data.endDate
    ? Math.ceil((new Date(data.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0;

  const statusVariant =
    data.status === "ACTIVE"
      ? ("success" as const)
      : data.status === "EXPIRED"
        ? ("error" as const)
        : ("default" as const);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Header title="Member Details" back />

        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile.fullName} url={profile.avatarUrl} size={60} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{profile.fullName}</Text>
              <Text style={styles.memberEmail} numberOfLines={1}>
                {profile.email}
              </Text>
              {profile.mobileNumber ? (
                <Text style={styles.memberPhone}>{profile.mobileNumber}</Text>
              ) : null}
            </View>
            <Badge label={data.status} variant={statusVariant} />
          </View>

          <View style={styles.membershipBar}>
            <View style={styles.membershipItem}>
              <Text style={styles.membershipLabel}>Plan</Text>
              <Text style={styles.membershipValue}>{plan?.name ?? "None"}</Text>
            </View>
            <View style={styles.membershipDivider} />
            <View style={styles.membershipItem}>
              <Text style={styles.membershipLabel}>Joined</Text>
              <Text style={styles.membershipValue}>
                {new Date(data.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.membershipDivider} />
            <View style={styles.membershipItem}>
              <Text style={styles.membershipLabel}>Expires</Text>
              <Text
                style={[
                  styles.membershipValue,
                  isExpiringSoon && { color: Colors.warning },
                  isExpired && { color: Colors.error },
                ]}
              >
                {data.endDate
                  ? isExpired
                    ? "Expired"
                    : `${daysLeft}d left`
                  : "No expiry"}
              </Text>
            </View>
          </View>

          {(isExpiringSoon || isExpired) && (
            <View
              style={[
                styles.expiryBanner,
                isExpired
                  ? {
                      backgroundColor: Colors.errorFaded,
                      borderColor: Colors.error + "40",
                    }
                  : {
                      backgroundColor: Colors.warningFaded,
                      borderColor: Colors.warning + "40",
                    },
              ]}
            >
              <Icon
                name="alert-circle-outline"
                size={14}
                color={isExpired ? Colors.error : Colors.warning}
              />
              <Text
                style={[
                  styles.expiryText,
                  { color: isExpired ? Colors.error : Colors.warning },
                ]}
              >
                {isExpired
                  ? "Membership expired — renew to restore access"
                  : `Membership expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
              </Text>
            </View>
          )}
        </Card>

        {/* Quick actions */}
        <View style={styles.actions}>
          {plan && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                showAlert(
                  "Renew Membership",
                  `Renew ${plan.name} for ₹${plan.price}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Renew (Cash)",
                      onPress: () => renewMutation.mutate(plan.id),
                    },
                  ],
                )
              }
            >
              <Icon name="refresh" size={16} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>
                Renew
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => suspendMutation.mutate()}
          >
            <Icon
              name={
                data.status === "ACTIVE"
                  ? "account-cancel-outline"
                  : "account-check-outline"
              }
              size={16}
              color={data.status === "ACTIVE" ? Colors.error : Colors.success}
            />
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    data.status === "ACTIVE" ? Colors.error : Colors.success,
                },
              ]}
            >
              {data.status === "ACTIVE" ? "Suspend" : "Activate"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(
            [
              { key: "info", label: "Info" },
              {
                key: "attendance",
                label: `Attendance (${data.attendance?.length ?? 0})`,
              },
              {
                key: "payments",
                label: `Payments (${data.payments?.length ?? 0})`,
              },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, tab === t.key && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info tab */}
        {tab === "info" && (
          <Card>
            {profile.mobileNumber ? (
              <ListRow
                icon="phone-outline"
                label="Phone Number"
                value={`${profile.mobileNumber}`}
                bordered
                iconColor={Colors.success}
                iconBg={Colors.successFaded}
              />
            ) : null}
            {profile.gender ? (
              <ListRow
                icon="account-outline"
                label="Gender"
                value={`${profile.gender}`}
                bordered
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
              />
            ) : null}
            {profile.dateOfBirth ? (
              <ListRow
                icon="calendar-outline"
                label="Date Of Birth"
                value={`${profile.dateOfBirth}`}
                bordered
                iconColor={Colors.primary}
                iconBg={Colors.primaryFaded}
              />
            ) : null}
            {profile.dateOfBirth ? (
              <ListRow
                icon="map-marker-outline"
                label="City"
                value={`${profile.city}`}
                bordered
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
              />
            ) : null}
            {data.heightCm ? (
              <ListRow
                icon="human-male-height"
                label="Height"
                value={`${data.heightCm} cm`}
                bordered
                iconColor={Colors.info}
                iconBg={Colors.infoFaded}
              />
            ) : null}
            {data.weightKg ? (
              <ListRow
                icon="weight-kilogram"
                label="Weight"
                value={`${data.weightKg} kg`}
                bordered
              />
            ) : null}
            {data.medicalNotes ? (
              <ListRow
                icon="medical-bag"
                label="Medical Notes"
                value={data.medicalNotes}
                bordered
                iconColor={Colors.warning}
                iconBg={Colors.warningFaded}
              />
            ) : null}
            {data.emergencyContactName ? (
              <ListRow
                icon="phone-alert-outline"
                label="Emergency Contact"
                value={`${data.emergencyContactName}${data.emergencyContactPhone ? ` · ${data.emergencyContactPhone}` : ""}`}
                bordered
                iconColor={Colors.error}
                iconBg={Colors.errorFaded}
              />
            ) : null}
            {data.workoutStartTime ? (
              <ListRow
                icon="clock-outline"
                label="Workout Time"
                value={`${data.workoutStartTime} – ${data.workoutEndTime ?? ""}`}
              />
            ) : null}
          </Card>
        )}

        {/* Attendance tab */}
        {tab === "attendance" && (
          <View style={{ gap: Spacing.sm }}>
            {(data.attendance?.length ?? 0) === 0 ? (
              <View style={styles.emptyTab}>
                <Icon
                  name="calendar-check-outline"
                  size={28}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTabText}>No attendance records</Text>
              </View>
            ) : (
              data.attendance.map((a: AttendanceRecord) => {
                const cin = new Date(a.checkInTime);
                const cout = a.checkOutTime ? new Date(a.checkOutTime) : null;
                const dur = cout
                  ? Math.round((cout.getTime() - cin.getTime()) / 60000)
                  : null;
                return (
                  <View key={a.id} style={styles.recordRow}>
                    <View style={styles.recordDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordDate}>
                        {cin.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                      <Text style={styles.recordTime}>
                        {cin.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {cout
                          ? ` – ${cout.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                          : " · Active"}
                      </Text>
                    </View>
                    {dur ? <Text style={styles.recordDur}>{dur}m</Text> : null}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          <View style={{ gap: Spacing.sm }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: Colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
              }}
              onPress={() =>
                (navigation as any).navigate("OwnerAddPayment", {
                  memberId,
                  gymId: data.gym?.id,
                })
              }
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text
                style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
              >
                Add Payment
              </Text>
            </TouchableOpacity>
            {(data.payments?.length ?? 0) === 0 ? (
              <View style={styles.emptyTab}>
                <Icon
                  name="credit-card-outline"
                  size={28}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTabText}>No payment records</Text>
              </View>
            ) : (
              data.payments.map((p: PaymentRecord) => (
                <Card key={p.id} style={styles.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payPlan}>
                      {p.planNameSnapshot ?? "Payment"}
                    </Text>
                    <Text style={styles.payDate}>
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
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.payAmount}>{fmt(p.amount)}</Text>
                    <Badge
                      label={p.status}
                      variant={p.status === "COMPLETED" ? "success" : "warning"}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  profileCard: {},
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  memberEmail: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  memberPhone: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 1,
  },
  membershipBar: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  membershipItem: { flex: 1, alignItems: "center" },
  membershipDivider: { width: 1, backgroundColor: Colors.border },
  membershipLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  membershipValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 2,
  },
  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  expiryText: { fontSize: Typography.xs, flex: 1 },
  actions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  actionText: { fontSize: Typography.sm, fontWeight: "600" },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 11, fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  recordDate: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },
  recordTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 1,
  },
  recordDur: { color: Colors.textMuted, fontSize: Typography.xs },
  payRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  payPlan: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  payDate: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  payAmount: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  emptyTab: { alignItems: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTabText: { color: Colors.textMuted, fontSize: Typography.sm },
});
