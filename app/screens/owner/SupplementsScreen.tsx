// mobile/src/screens/owner/SupplementsScreen.tsx
import { membersApi, supplementsApi } from "@/api/endpoints";
import {
  Card,
  EmptyState,
  Header,
  PlanGate,
  SkeletonGroup,
  StatCard,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { Gym } from "@/types/api";
import { gymsApi } from "@/api/endpoints";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplement {
  id: string; name: string; brand: string | null; category: string | null;
  unitSize: string | null; price: number; stockQty: number; lowStockAt: number;
  isActive: boolean; gymId: string; gym: { name: string }; _count: { sales: number };
}

interface Sale {
  id: string; qty: number; unitPrice: number; totalAmount: number;
  memberName: string | null; paymentMethod: string; soldAt: string; notes: string | null;
  supplement: { name: string; unitSize: string | null; category: string | null };
  member: { profile: { fullName: string } } | null;
}

interface SalesData {
  sales: Sale[]; total: number; pages: number;
  totalRevenue: number; totalUnitsSold: number; totalSales: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGES = [
  { value: "today",         label: "Today" },
  { value: "this_week",     label: "This Week" },
  { value: "last_week",     label: "Last Week" },
  { value: "this_month",    label: "This Month" },
  { value: "last_month",    label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Mo" },
  { value: "last_6_months", label: "Last 6 Mo" },
  { value: "last_year",     label: "Last Year" },
  { value: "all",           label: "All Time" },
];

const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "ONLINE", "OTHER"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OwnerSupplementsScreen() {
  const navigation  = useNavigation();
  const qc          = useQueryClient();
  const { hasSupplements } = useSubscription();

  // ── Shared state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"inventory" | "sales">("inventory");
  const [gymId, setGymId]         = useState("");

  // ── Inventory state ───────────────────────────────────────────────────────
  const [search, setSearch]       = useState("");

  // ── Sell modal state ──────────────────────────────────────────────────────
  const [showSell, setShowSell]   = useState(false);
  const [sellItem, setSellItem]   = useState<Supplement | null>(null);
  const [sellForm, setSellForm]   = useState({
    qty: "1", unitPrice: "", memberName: "", memberId: "",
    paymentMethod: "CASH", notes: "",
  });
  const [memberSearch, setMemberSearch]   = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [showMemberDrop, setShowMemberDrop] = useState(false);
  const memberSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sales history state ───────────────────────────────────────────────────
  const [salesRange, setSalesRange] = useState("this_month");
  const [salesGymId, setSalesGymId] = useState("");
  const [salesPage, setSalesPage]   = useState(1);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  const {
    data: supplements = [],
    isLoading: inventoryLoading,
    refetch: refetchInventory,
    isRefetching: inventoryRefreshing,
  } = useQuery({
    queryKey: ["ownerSupplements", gymId, search],
    queryFn: () =>
      supplementsApi.list({ gymId: gymId || undefined, search: search || undefined }),
    enabled: hasSupplements,
    staleTime: 60_000,
  });

  const {
    data: salesData,
    isLoading: salesLoading,
    refetch: refetchSales,
    isRefetching: salesRefreshing,
  } = useQuery<SalesData>({
    queryKey: ["ownerSuppSales", salesGymId, salesRange, salesPage],
    queryFn: () =>
      supplementsApi.listSales({
        gymId: salesGymId || undefined,
        range: salesRange,
        page: salesPage,
      }) as Promise<SalesData>,
    enabled: hasSupplements && activeTab === "sales",
    staleTime: 30_000,
  });

  // ── Sell mutation ─────────────────────────────────────────────────────────
  const sellMutation = useMutation({
    mutationFn: () => {
      const qtyNum   = parseInt(sellForm.qty) || 1;
      const price    = parseFloat(sellForm.unitPrice) || sellItem!.price;
      return supplementsApi.sell({
        supplementId: sellItem!.id,
        gymId:        sellItem!.gymId || gymId || (gyms as Gym[])[0]?.id,
        qty:          qtyNum,
        memberId:     sellForm.memberId || undefined,
        memberName:   sellForm.memberName || undefined,
        unitPrice:    price,
        paymentMethod: sellForm.paymentMethod,
        notes:        sellForm.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerSupplements"] });
      qc.invalidateQueries({ queryKey: ["ownerSuppSales"] });
      setShowSell(false);
      setSellItem(null);
      setMemberSearch("");
      setMemberResults([]);
      Toast.show({ type: "success", text1: "Sale recorded! 💰" });
    },
    onError: (err: any) =>
      Toast.show({ type: "error", text1: err.message ?? "Sale failed" }),
  });

  // ── Member search debounce ────────────────────────────────────────────────
  useEffect(() => {
    if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current);
    if (!memberSearch.trim()) { setMemberResults([]); return; }
    memberSearchTimer.current = setTimeout(() => {
      membersApi
        .list({ search: memberSearch, status: "ACTIVE", gymId: gymId || undefined })
        .then((res: any) => setMemberResults(Array.isArray(res?.members) ? res.members : []))
        .catch(() => {});
    }, 300);
    return () => {
      if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current);
    };
  }, [memberSearch, gymId]);

  // Reset sales page when filters change
  useEffect(() => { setSalesPage(1); }, [salesRange, salesGymId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setSell = (k: string, v: string) =>
    setSellForm((f) => ({ ...f, [k]: v }));

  const openSell = (s: Supplement) => {
    setSellItem(s);
    setSellForm({
      qty: "1", unitPrice: String(s.price), memberName: "", memberId: "",
      paymentMethod: "CASH", notes: "",
    });
    setMemberSearch("");
    setMemberResults([]);
    setShowMemberDrop(false);
    setShowSell(true);
  };

  const qtyNum    = parseInt(sellForm.qty) || 0;
  const unitPrice = parseFloat(sellForm.unitPrice) || 0;
  const total     = qtyNum * unitPrice;
  const overStock = sellItem ? qtyNum > sellItem.stockQty : false;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Header
          menu
          title="Supplements"
          right={
            hasSupplements ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => (navigation as any).navigate("OwnerAddSupplement")}
              >
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          {(
            [
              { id: "inventory", icon: "package-variant", label: "Inventory" },
              { id: "sales",     icon: "cart-outline",    label: "Sales History" },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Icon
                name={t.icon}
                size={14}
                color={activeTab === t.id ? Colors.textPrimary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === t.id && styles.tabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Inventory Tab ── */}
      {activeTab === "inventory" && (
        <PlanGate allowed={hasSupplements} featureLabel="Supplement Management">
          <View style={styles.filterBar}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Icon name="magnify" size={18} color={Colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search supplements..."
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Icon name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Gym filter pills */}
            {(gyms as Gym[]).length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.xs }}
              >
                {[{ id: "", name: "All" } as Gym, ...(gyms as Gym[])].map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setGymId(g.id)}
                    style={[
                      styles.pill,
                      gymId === g.id ? styles.pillActive : styles.pillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: gymId === g.id ? Colors.primary : Colors.textMuted },
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {inventoryLoading ? (
            <View style={{ padding: Spacing.lg }}>
              <SkeletonGroup count={4} itemHeight={90} gap={Spacing.md} />
            </View>
          ) : (supplements as Supplement[]).length === 0 ? (
            <EmptyState
              icon="shopping-outline"
              title="No supplements"
              subtitle="Add inventory to track and sell"
            />
          ) : (
            <FlatList
              data={supplements as Supplement[]}
              keyExtractor={(s) => s.id}
              contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={inventoryRefreshing}
                  onRefresh={refetchInventory}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
              renderItem={({ item: s }) => {
                const lowStock = s.stockQty <= s.lowStockAt;
                const outOfStock = s.stockQty === 0;
                return (
                  <Card>
                    <View style={styles.suppRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suppName}>{s.name}</Text>
                        {s.brand ? (
                          <Text style={styles.suppSub}>{s.brand}</Text>
                        ) : null}

                        {/* Category + unit size badges */}
                        {(s.category || s.unitSize) ? (
                          <View style={styles.badgeRow}>
                            {s.category ? (
                              <View style={styles.catBadge}>
                                <Text style={styles.catBadgeText}>{s.category}</Text>
                              </View>
                            ) : null}
                            {s.unitSize ? (
                              <View style={styles.catBadge}>
                                <Text style={styles.catBadgeText}>{s.unitSize}</Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}

                        <View style={styles.suppFooter}>
                          <Text style={styles.suppPrice}>{fmt(s.price)}</Text>
                          <View style={styles.stockRow}>
                            {(outOfStock || lowStock) ? (
                              <Icon
                                name="alert-outline"
                                size={12}
                                color={outOfStock ? Colors.error : Colors.warning}
                              />
                            ) : null}
                            <Text
                              style={[
                                styles.stockText,
                                outOfStock
                                  ? { color: Colors.error }
                                  : lowStock
                                  ? { color: Colors.warning }
                                  : { color: Colors.textMuted },
                              ]}
                            >
                              {outOfStock ? "Out of stock" : `Stock: ${s.stockQty}`}
                            </Text>
                          </View>
                          <View style={styles.soldRow}>
                            <Icon name="trending-up" size={12} color={Colors.textMuted} />
                            <Text style={styles.soldText}>{s._count.sales} sold</Text>
                          </View>
                        </View>
                      </View>

                      {/* Sell button */}
                      <TouchableOpacity
                        style={[
                          styles.sellBtn,
                          outOfStock && styles.sellBtnDisabled,
                        ]}
                        onPress={() => openSell(s)}
                        disabled={outOfStock}
                      >
                        <Icon
                          name="cart-outline"
                          size={14}
                          color={outOfStock ? Colors.textMuted : Colors.primary}
                        />
                        <Text
                          style={[
                            styles.sellBtnText,
                            outOfStock && { color: Colors.textMuted },
                          ]}
                        >
                          {outOfStock ? "Out" : "Sell"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              }}
            />
          )}
        </PlanGate>
      )}

      {/* ── Sales History Tab ── */}
      {activeTab === "sales" && (
        <PlanGate allowed={hasSupplements} featureLabel="Supplement Management">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }}
            refreshControl={
              <RefreshControl
                refreshing={salesRefreshing}
                onRefresh={refetchSales}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          >
            {/* Range picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.xs }}
            >
              {RANGES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setSalesRange(r.value)}
                  style={[
                    styles.pill,
                    salesRange === r.value ? styles.pillActive : styles.pillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color:
                          salesRange === r.value ? Colors.primary : Colors.textMuted,
                      },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Gym filter */}
            {(gyms as Gym[]).length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.xs }}
              >
                {[{ id: "", name: "All Gyms" } as Gym, ...(gyms as Gym[])].map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setSalesGymId(g.id)}
                    style={[
                      styles.pill,
                      salesGymId === g.id ? styles.pillActive : styles.pillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color:
                            salesGymId === g.id ? Colors.primary : Colors.textMuted,
                        },
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {salesLoading ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <>
                {/* Summary stat cards */}
                {salesData && (
                  <View style={styles.statsRow}>
                    <StatCard
                      icon="receipt"
                      label="Total Sales"
                      value={salesData.totalSales}
                      color={Colors.info}
                      bg={Colors.infoFaded}
                    />
                    <StatCard
                      icon="package-variant"
                      label="Units Sold"
                      value={salesData.totalUnitsSold}
                      color={Colors.purple}
                      bg={Colors.purpleFaded}
                    />
                    <StatCard
                      icon="currency-inr"
                      label="Revenue"
                      value={fmt(salesData.totalRevenue)}
                      color={Colors.primary}
                      bg={Colors.primaryFaded}
                    />
                  </View>
                )}

                {/* Sales list */}
                {!salesData || salesData.sales.length === 0 ? (
                  <EmptyState
                    icon="chart-bar"
                    title="No sales recorded"
                    subtitle={`No sales for ${RANGES.find((r) => r.value === salesRange)?.label}`}
                  />
                ) : (
                  <View style={{ gap: Spacing.sm }}>
                    {salesData.sales.map((sale) => (
                      <Card key={sale.id} style={styles.saleRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.saleName}>
                            {sale.supplement.name}
                          </Text>
                          {sale.supplement.category ? (
                            <Text style={styles.saleCat}>
                              {sale.supplement.category}
                            </Text>
                          ) : null}
                          <Text style={styles.saleMeta}>
                            {sale.member?.profile.fullName ??
                              sale.memberName ?? "Walk-in"}
                            {" · "}
                            <View style={styles.methodBadge}>
                              <Text style={styles.methodText}>
                                {sale.paymentMethod}
                              </Text>
                            </View>
                            {" · "}
                            {fmtDate(sale.soldAt)}
                          </Text>
                        </View>
                        <View style={styles.saleAmounts}>
                          <Text style={styles.saleTotal}>
                            {fmt(sale.totalAmount)}
                          </Text>
                          <Text style={styles.saleQty}>
                            ×{sale.qty} @ {fmt(sale.unitPrice)}
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}

                {/* Pagination */}
                {salesData && salesData.pages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[
                        styles.pageBtn,
                        salesPage === 1 && styles.pageBtnDisabled,
                      ]}
                      onPress={() => setSalesPage((p) => Math.max(1, p - 1))}
                      disabled={salesPage === 1}
                    >
                      <Icon
                        name="chevron-left"
                        size={18}
                        color={
                          salesPage === 1 ? Colors.textMuted : Colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                    <Text style={styles.pageLabel}>
                      {salesPage} / {salesData.pages}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.pageBtn,
                        salesPage === salesData.pages && styles.pageBtnDisabled,
                      ]}
                      onPress={() =>
                        setSalesPage((p) => Math.min(salesData.pages, p + 1))
                      }
                      disabled={salesPage === salesData.pages}
                    >
                      <Icon
                        name="chevron-right"
                        size={18}
                        color={
                          salesPage === salesData.pages
                            ? Colors.textMuted
                            : Colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </PlanGate>
      )}

      {/* ── Sell Modal ── */}
      <Modal
        visible={showSell}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSell(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={{
              padding: Spacing.lg,
              paddingBottom: 48,
              gap: Spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Sell Supplement</Text>
                {sellItem ? (
                  <Text style={styles.modalSub}>
                    {sellItem.name}
                    {sellItem.brand ? ` · ${sellItem.brand}` : ""}
                    {sellItem.unitSize ? ` · ${sellItem.unitSize}` : ""}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setShowSell(false)}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Stock indicator */}
            {sellItem ? (
              <View style={styles.stockIndicator}>
                <Text style={styles.stockLabel}>Available stock</Text>
                <View style={styles.stockRight}>
                  {sellItem.stockQty === 0 ? (
                    <>
                      <Icon name="alert-outline" size={13} color={Colors.error} />
                      <Text style={[styles.stockValue, { color: Colors.error }]}>
                        Out of stock
                      </Text>
                    </>
                  ) : sellItem.stockQty <= sellItem.lowStockAt ? (
                    <>
                      <Icon name="alert-outline" size={13} color={Colors.warning} />
                      <Text style={[styles.stockValue, { color: Colors.warning }]}>
                        Low: {sellItem.stockQty}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.stockValue}>
                      Stock: {sellItem.stockQty}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* Quantity */}
            <View>
              <Text style={styles.fieldLabel}>Quantity *</Text>
              <TextInput
                value={sellForm.qty}
                onChangeText={(v) => setSell("qty", v)}
                keyboardType="number-pad"
                style={[
                  styles.textInput,
                  overStock && { borderColor: Colors.error },
                ]}
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
              />
              {overStock ? (
                <Text style={styles.errorHint}>
                  Max available: {sellItem?.stockQty} units
                </Text>
              ) : null}
            </View>

            {/* Unit price */}
            <View>
              <Text style={styles.fieldLabel}>Price per unit *</Text>
              <TextInput
                value={sellForm.unitPrice}
                onChangeText={(v) => setSell("unitPrice", v)}
                keyboardType="decimal-pad"
                style={styles.textInput}
                placeholder={`₹${sellItem?.price ?? ""}`}
                placeholderTextColor={Colors.textMuted}
              />
              {sellItem &&
              sellForm.unitPrice &&
              parseFloat(sellForm.unitPrice) !== sellItem.price ? (
                <Text style={styles.hintText}>
                  Listed price: {fmt(sellItem.price)}
                </Text>
              ) : null}
            </View>

            {/* Member search */}
            <View>
              <Text style={styles.fieldLabel}>
                Member name{" "}
                <Text style={{ color: Colors.textMuted, fontWeight: "400" }}>
                  (optional — leave blank for walk-in)
                </Text>
              </Text>
              <View>
                <TextInput
                  value={
                    sellForm.memberId ? sellForm.memberName : memberSearch
                  }
                  onChangeText={(v) => {
                    if (sellForm.memberId) {
                      setSellForm((f) => ({ ...f, memberId: "", memberName: "" }));
                    }
                    setMemberSearch(v);
                    setShowMemberDrop(true);
                  }}
                  placeholder="Type name or leave blank for walk-in"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.textInput}
                />
                {sellForm.memberId ? (
                  <TouchableOpacity
                    style={styles.clearMember}
                    onPress={() => {
                      setSellForm((f) => ({ ...f, memberId: "", memberName: "" }));
                      setMemberSearch("");
                    }}
                  >
                    <Icon name="close-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ) : null}

                {/* Member dropdown */}
                {showMemberDrop &&
                  memberResults.length > 0 &&
                  !sellForm.memberId && (
                    <View style={styles.memberDrop}>
                      {memberResults.map((m: any) => (
                        <TouchableOpacity
                          key={m.id}
                          style={styles.memberDropItem}
                          onPress={() => {
                            setSellForm((f) => ({
                              ...f,
                              memberId: m.id,
                              memberName: m.profile.fullName,
                            }));
                            setMemberSearch("");
                            setShowMemberDrop(false);
                          }}
                        >
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                              {m.profile.fullName[0].toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.memberDropName} numberOfLines={1}>
                            {m.profile.fullName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>
            </View>

            {/* Payment method */}
            <View>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <View style={styles.paymentRow}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSell("paymentMethod", m)}
                    style={[
                      styles.payPill,
                      sellForm.paymentMethod === m
                        ? styles.payPillActive
                        : styles.payPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.payPillText,
                        {
                          color:
                            sellForm.paymentMethod === m
                              ? Colors.primary
                              : Colors.textMuted,
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                value={sellForm.notes}
                onChangeText={(v) => setSell("notes", v)}
                placeholder="e.g. Bulk discount applied"
                placeholderTextColor={Colors.textMuted}
                style={styles.textInput}
              />
            </View>

            {/* Total preview */}
            {qtyNum > 0 && unitPrice > 0 && (
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total amount</Text>
                <Text style={styles.totalValue}>{fmt(total)}</Text>
              </View>
            )}

            {/* Confirm button */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (overStock || !qtyNum || sellMutation.isPending) &&
                  styles.confirmBtnDisabled,
              ]}
              onPress={() => {
                if (!qtyNum || qtyNum <= 0) {
                  Toast.show({ type: "error", text1: "Quantity must be at least 1" });
                  return;
                }
                if (overStock) {
                  Toast.show({
                    type: "error",
                    text1: `Only ${sellItem?.stockQty} units in stock`,
                  });
                  return;
                }
                if (!unitPrice) {
                  Toast.show({ type: "error", text1: "Price must be greater than 0" });
                  return;
                }
                sellMutation.mutate();
              }}
              disabled={overStock || !qtyNum || sellMutation.isPending}
            >
              {sellMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="cart-check" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>Record Sale</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "500" },
  tabTextActive: { color: Colors.textPrimary, fontWeight: "600" },

  // Filters
  filterBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    paddingVertical: 0,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  pillInactive: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.border },
  pillText: { fontSize: Typography.xs },

  // Supplement card
  suppRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  suppName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  suppSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: Spacing.xs, flexWrap: "wrap" },
  catBadge: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catBadgeText: { color: Colors.textMuted, fontSize: 10 },
  suppFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
    flexWrap: "wrap",
  },
  suppPrice: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  stockText: { fontSize: Typography.xs, fontWeight: "600" },
  soldRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  soldText: { color: Colors.textMuted, fontSize: Typography.xs },
  sellBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    alignSelf: "center",
  },
  sellBtnDisabled: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
  },
  sellBtnText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },

  // Sales tab
  loadingCenter: { alignItems: "center", paddingVertical: Spacing.xxxl },
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  saleRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  saleName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  saleCat: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  saleMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
  methodBadge: {
    backgroundColor: Colors.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  methodText: { color: Colors.textMuted, fontSize: 10 },
  saleAmounts: { alignItems: "flex-end", gap: 3 },
  saleTotal: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  saleQty: { color: Colors.textMuted, fontSize: Typography.xs },

  // Pagination
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageLabel: { color: Colors.textSecondary, fontSize: Typography.sm },

  // Sell modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  modalSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  stockIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  stockLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  stockRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  stockValue: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: "600" },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  errorHint: { color: Colors.error, fontSize: Typography.xs, marginTop: 4 },
  hintText: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
  clearMember: {
    position: "absolute",
    right: Spacing.md,
    top: "50%",
    marginTop: -8,
  },
  memberDrop: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    marginTop: 4,
    overflow: "hidden",
  },
  memberDropItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
  memberDropName: { color: Colors.textPrimary, fontSize: Typography.sm, flex: 1 },
  paymentRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  payPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  payPillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary + "50" },
  payPillInactive: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.border },
  payPillText: { fontSize: Typography.xs, fontWeight: "500" },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  totalLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
  totalValue: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: "700",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    height: 48,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: "#fff", fontSize: Typography.base, fontWeight: "700" },
});
