// app/screens/owner/ReferralScreen.tsx
// Owner referral & wallet screen — matches web /owner/referral page.
// Shows wallet balance, referral code, stats and transaction history.

import { referralApi } from "@/api/endpoints";
import { Card, Header, SkeletonGroup } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  Clipboard,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const REWARD_AMOUNT = 100;

// ── Stat box ───────────────────────────────────────────────────────────────────

function StatBox({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={[sb.box, { borderColor: color + "25" }]}>
      <View style={[sb.iconWrap, { backgroundColor: color + "18" }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={[sb.val, { color }]}>{value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  val: { fontSize: Typography.xl, fontWeight: "800" },
  lbl: { color: Colors.textMuted, fontSize: 10, textAlign: "center" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function OwnerReferralScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["ownerReferral"],
    queryFn: () => referralApi.get() as Promise<any>,
    staleTime: 5 * 60_000,
  });

  const code = data?.code ?? "—";
  const walletBalance = data?.stats?.walletBalance ?? 0;
  const stats = data?.stats ?? {
    totalReferred: 0,
    converted: 0,
    pending: 0,
    totalEarned: 0,
    rewardPerReferral: REWARD_AMOUNT,
  };
  const transactions = data?.transactions ?? [];
  const referred = data?.referred ?? [];

  const handleCopy = () => {
    Clipboard.setString(code);
    Toast.show({ type: "success", text1: "Code copied!", position: "top" });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `💪 Join me on GymStack — the best gym management app!\n\n` +
          `Use my referral code: *${code}*\n\n` +
          `You get started, I earn ₹${stats.rewardPerReferral ?? REWARD_AMOUNT} wallet credit. Win-win! 🎉`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header title="Refer & Earn" subtitle="Earn wallet credits" menu />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
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
        {isLoading ? (
          <SkeletonGroup count={4} itemHeight={80} gap={Spacing.md} />
        ) : (
          <>
            {/* Wallet balance */}
            <View style={s.walletCard}>
              <View style={s.walletLeft}>
                <View style={s.walletIconWrap}>
                  <Icon
                    name="wallet-outline"
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <View>
                  <Text style={s.walletLabel}>Wallet Balance</Text>
                  <Text style={s.walletBalance}>
                    ₹{Number(walletBalance).toLocaleString("en-IN")}
                  </Text>
                  <Text style={s.walletSub}>
                    Available to use on subscription fees
                  </Text>
                </View>
              </View>
            </View>

            {/* How it works */}
            <Card style={s.howCard}>
              <Text style={s.howTitle}>How it works</Text>
              {[
                { n: "1", text: "Share your code with other gym owners" },
                { n: "2", text: "They sign up on GymStack" },
                {
                  n: "3",
                  text: `You earn ₹${stats.rewardPerReferral ?? REWARD_AMOUNT} wallet credit`,
                },
                { n: "4", text: "Use credits on your next subscription" },
              ].map((step) => (
                <View key={step.n} style={s.howRow}>
                  <View style={s.howNum}>
                    <Text style={s.howNumText}>{step.n}</Text>
                  </View>
                  <Text style={s.howText}>{step.text}</Text>
                </View>
              ))}
            </Card>

            {/* Referral code */}
            <Card>
              <Text style={s.codeLabel}>YOUR REFERRAL CODE</Text>
              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.8}
                style={s.codeBox}
              >
                <Text style={s.code}>{code}</Text>
                <View style={s.copyBtn}>
                  <Icon name="content-copy" size={16} color={Colors.primary} />
                  <Text style={s.copyText}>Copy</Text>
                </View>
              </TouchableOpacity>

              <View style={s.shareRow}>
                <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
                  <Icon name="share-variant-outline" size={18} color="#fff" />
                  <Text style={s.shareBtnText}>Share with Friends</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatBox
                value={stats.totalReferred ?? 0}
                label="Total Referred"
                color={Colors.primary}
                icon="account-multiple-outline"
              />
              <StatBox
                value={stats.converted ?? 0}
                label="Converted"
                color={Colors.success}
                icon="check-circle-outline"
              />
              <StatBox
                value={`₹${stats.totalEarned ?? 0}`}
                label="Total Earned"
                color={Colors.warning}
                icon="gift-outline"
              />
            </View>

            {/* Referred people list */}
            {referred.length > 0 && (
              <Card>
                <Text style={s.txTitle}>
                  People You Referred ({referred.length})
                </Text>
                {referred.map((r: any) => {
                  const statusColor =
                    r.status === "CONVERTED"
                      ? Colors.success
                      : r.status === "PENDING"
                        ? Colors.warning
                        : Colors.textMuted;
                  return (
                    <View key={r.id} style={s.txRow}>
                      <View style={s.txIconWrap}>
                        <Icon
                          name="account-outline"
                          size={16}
                          color={Colors.info}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txDesc}>
                          {r.referred?.fullName ?? "Anonymous"}
                        </Text>
                        <Text style={s.txDate}>
                          Joined{" "}
                          {r.referred?.createdAt
                            ? new Date(r.referred.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.statusBadge,
                          { backgroundColor: statusColor + "20" },
                        ]}
                      >
                        <Text style={[s.statusText, { color: statusColor }]}>
                          {r.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Wallet transaction history */}
            {transactions.length > 0 && (
              <Card>
                <Text style={s.txTitle}>Reward History</Text>
                {transactions.map((tx: any) => (
                  <View key={tx.id} style={s.txRow}>
                    <View style={s.txIconWrap}>
                      <Icon
                        name="gift-outline"
                        size={16}
                        color={Colors.warning}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.txDesc}>
                        {tx.description ?? "Referral reward"}
                      </Text>
                      <Text style={s.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <Text style={s.txAmount}>
                      +₹{Number(tx.amount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Terms */}
            <Text style={s.terms}>
              Wallet credits are valid for 90 days and can be applied to your
              GymStack subscription. Credits are awarded after the referred user
              makes their first payment.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  // Wallet card
  walletCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    padding: Spacing.lg,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  walletLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
    opacity: 0.8,
  },
  walletBalance: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  walletSub: {
    color: Colors.primary,
    fontSize: Typography.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  // How it works
  howCard: {},
  howTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  howRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  howNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  howNumText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "800",
  },
  howText: { color: Colors.textSecondary, fontSize: Typography.sm },
  // Code
  codeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  code: {
    color: Colors.primary,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 5,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  shareRow: { marginTop: Spacing.md },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  shareBtnText: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
  // Stats
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  // Transactions / referred
  txTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    backgroundColor: Colors.warningFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  txDate: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  txAmount: {
    color: Colors.success,
    fontSize: Typography.sm,
    fontWeight: "800",
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  // Terms
  terms: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
});
