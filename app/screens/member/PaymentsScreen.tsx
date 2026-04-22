// mobile/src/screens/member/PaymentsScreen.tsx
import { memberPaymentsApi } from "@/api/endpoints";
import { Badge, Card, EmptyState, Header, NoGymState, SkeletonGroup } from "@/components";
import { useMemberGym } from "@/hooks/useMemberGym";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const METHOD_ICONS: Record<string, string> = {
  CASH: "cash",
  UPI: "contactless-payment",
  CARD: "credit-card-outline",
  ONLINE: "web",
  WALLET: "wallet-outline",
};

type Filter = "ALL" | "COMPLETED" | "PENDING" | "FAILED";

export default function MemberPaymentsScreen() {
  const [filter, setFilter] = useState<Filter>("ALL");

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["memberPayments"],
    queryFn: () => memberPaymentsApi.list() as Promise<any[]>,
    staleTime: 60_000,
  });

  const filtered =
    filter === "ALL" ? data : data.filter((p: any) => p.status === filter);

  const totalPaid = data
    .filter((p: any) => p.status === "COMPLETED")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const { hasGym, gymLoading } = useMemberGym();
  if (!isLoading && !gymLoading && !hasGym) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <NoGymState pageName="Payments" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header title="Payment History" menu />
      </View>

      {/* Summary card */}
      {!isLoading && !gymLoading && data.length > 0 && (
        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: Colors.success }]}>
              {fmt(totalPaid)}
            </Text>
            <Text style={s.summaryLbl}>Total Paid</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: Colors.primary }]}>
              {data.length}
            </Text>
            <Text style={s.summaryLbl}>Transactions</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: Colors.warning }]}>
              {data.filter((p: any) => p.status === "PENDING").length}
            </Text>
            <Text style={s.summaryLbl}>Pending</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      {!isLoading && !gymLoading && data.length > 0 && (
        <View style={s.filters}>
          {(["ALL", "COMPLETED", "PENDING", "FAILED"] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading || gymLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup variant="listRow" count={5} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="credit-card-outline"
          title={
            filter === "ALL"
              ? "No payments yet"
              : `No ${filter.toLowerCase()} payments`
          }
          subtitle="Your payment history will appear here"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item: p }) => {
            const isOk = p.status === "COMPLETED";
            const isFail = p.status === "FAILED";
            const iconName = METHOD_ICONS[p.paymentMethod ?? "CASH"] ?? "cash";
            const iconColor = isOk
              ? Colors.success
              : isFail
                ? Colors.error
                : Colors.warning;
            const iconBg = isOk
              ? Colors.successFaded
              : isFail
                ? Colors.errorFaded
                : Colors.warningFaded;

            return (
              <Card>
                <View style={s.payRow}>
                  {/* Icon */}
                  <View style={[s.payIcon, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={20} color={iconColor} />
                  </View>

                  {/* Details */}
                  <View style={s.payInfo}>
                    <Text style={s.payTitle} numberOfLines={1}>
                      {p.planNameSnapshot ?? p.description ?? "Payment"}
                    </Text>
                    <Text style={s.payMeta}>
                      {p.paymentDate ? timeAgo(p.paymentDate) : "—"}
                      {" · "}
                      {p.paymentMethod ?? "CASH"}
                    </Text>
                    {p.gym?.name && <Text style={s.payGym}>{p.gym.name}</Text>}
                  </View>

                  {/* Amount + Status */}
                  <View style={s.payRight}>
                    <Text style={[s.payAmount, { color: iconColor }]}>
                      {fmt(p.amount)}
                    </Text>
                    <Badge
                      label={p.status}
                      variant={isOk ? "success" : isFail ? "error" : "warning"}
                    />
                  </View>
                </View>

                {/* Receipt number */}
                {p.receiptNumber && (
                  <Text style={s.receipt}>Receipt: {p.receiptNumber}</Text>
                )}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal: { fontSize: Typography.xl, fontWeight: "800" },
  summaryLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  filterTextActive: { color: "#fff" },
  payRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  payInfo: { flex: 1 },
  payTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  payMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  payGym: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  payRight: { alignItems: "flex-end", gap: 4 },
  payAmount: { fontSize: Typography.base, fontWeight: "800" },
  receipt: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
