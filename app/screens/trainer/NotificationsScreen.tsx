// app/screens/trainer/NotificationsScreen.tsx
// Trainer notifications: Sent (announcements to assigned members) + Inbox.

import { trainerNotificationsApi } from "@/api/endpoints";
import { Card, Header, Input, Skeleton } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
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

const CATEGORIES = ["General", "Reminder", "Offer", "Holiday", "Diet Plan", "Workout Plan", "Payment"] as const;
type Category = typeof CATEGORIES[number];

const CAT_EMOJI: Record<string, string> = {
  General: "📢", Reminder: "⏰", Offer: "🎁", Holiday: "🏖️",
  "Diet Plan": "🥗", "Workout Plan": "💪", Payment: "💳",
};

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  General:        { bg: "#3b82f615", fg: "#60a5fa" },
  Reminder:       { bg: Colors.warningFaded, fg: Colors.warning },
  Offer:          { bg: Colors.successFaded, fg: Colors.success },
  Holiday:        { bg: Colors.purpleFaded,  fg: Colors.purple },
  "Diet Plan":    { bg: "#fb923c15",  fg: "#fb923c" },
  "Workout Plan": { bg: "#22d3ee15",  fg: "#22d3ee" },
  Payment:        { bg: "#f472b615",  fg: "#f472b6" },
};

const TYPE_EMOJI: Record<string, string> = {
  BILLING: "💳", CLASS_REMINDER: "⏰", PLAN_UPDATE: "💪",
  ANNOUNCEMENT: "📢", REFERRAL: "🎁", SYSTEM: "🔔",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseCategory(body: string): string {
  return body.match(/^\[(.+?)\]/)?.[1] ?? "General";
}
function parseBody(body: string): string {
  return body.replace(/^\[.+?\] /, "");
}

// ── Send Form Modal ────────────────────────────────────────────────────────────

function SendFormModal({
  visible,
  onClose,
  onSend,
  isSending,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (data: { title: string; body: string; category: Category }) => void;
  isSending: boolean;
}) {
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [category, setCategory] = useState<Category>("General");
  const [showCats, setShowCats] = useState(false);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      Toast.show({ type: "error", text1: "Title and message are required" });
      return;
    }
    onSend({ title: title.trim(), body: body.trim(), category });
  };

  const reset = () => { setTitle(""); setBody(""); setCategory("General"); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={fm.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={fm.title}>New Notification</Text>
          <TouchableOpacity onPress={handleSend} disabled={isSending}>
            <Text style={[fm.sendBtn, isSending && { opacity: 0.5 }]}>
              {isSending ? "Sending…" : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <Text style={fm.hint}>Will be sent to your assigned members only.</Text>

          {/* Category picker */}
          <View>
            <Text style={fm.label}>Category</Text>
            <TouchableOpacity style={fm.catSelector} onPress={() => setShowCats(true)}>
              <Text style={fm.catEmoji}>{CAT_EMOJI[category]}</Text>
              <Text style={fm.catTxt}>{category}</Text>
              <Icon name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. New workout plan available" leftIcon="bell-outline" />

          <View>
            <Text style={fm.label}>Message *</Text>
            <View style={fm.textAreaWrap}>
              <Input
                value={body}
                onChangeText={setBody}
                placeholder="Write your notification message here…"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>

        {/* Category sheet */}
        <Modal visible={showCats} transparent animationType="slide" onRequestClose={() => setShowCats(false)}>
          <View style={fm.sheetOverlay}>
            <View style={fm.sheet}>
              <View style={fm.sheetHeader}>
                <Text style={fm.sheetTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCats(false)}>
                  <Icon name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={fm.sheetRow}
                  onPress={() => { setCategory(cat); setShowCats(false); }}
                >
                  <Text style={fm.sheetEmoji}>{CAT_EMOJI[cat]}</Text>
                  <Text style={fm.sheetRowTxt}>{cat}</Text>
                  {category === cat && <Icon name="check" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const fm = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  sendBtn: { color: Colors.primary, fontSize: Typography.sm, fontWeight: "700" },
  hint: { color: Colors.textMuted, fontSize: Typography.xs },
  label: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600", marginBottom: Spacing.xs },
  catSelector: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  catEmoji: { fontSize: 16 },
  catTxt: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
  textAreaWrap: {},
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    paddingBottom: 32, maxHeight: "60%",
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  sheetRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetEmoji: { fontSize: 18 },
  sheetRowTxt: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
});

// ── Sent Tab ───────────────────────────────────────────────────────────────────

function SentTab({
  items,
  loading,
  refetching,
  onRefresh,
  onDelete,
  onCompose,
}: {
  items: any[];
  loading: boolean;
  refetching: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onCompose: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filtered = activeFilter === "All"
    ? items
    : items.filter((i) => parseCategory(i.body) === activeFilter);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
      >
        {["All", ...CATEGORIES].map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveFilter(cat)}
            style={[st.chip, activeFilter === cat && st.chipActive]}
          >
            <Text style={[st.chipTxt, activeFilter === cat && st.chipTxtActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refetching} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={st.empty}>
              <Icon name="megaphone-outline" size={40} color={Colors.border} />
              <Text style={st.emptyTxt}>
                {activeFilter === "All" ? "No notifications sent yet" : `No ${activeFilter} notifications`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const cat = parseCategory(item.body);
            const body = parseBody(item.body);
            const cc = CAT_COLORS[cat] ?? CAT_COLORS.General;
            return (
              <Card style={{ gap: Spacing.sm }}>
                <View style={st.itemTop}>
                  <View style={st.emojiWrap}>
                    <Text style={{ fontSize: 18 }}>{CAT_EMOJI[cat] ?? "📢"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexWrap: "wrap", marginBottom: 3 }}>
                      <Text style={st.itemTitle}>{item.title}</Text>
                      <View style={[st.catBadge, { backgroundColor: cc.bg }]}>
                        <Text style={[st.catBadgeTxt, { color: cc.fg }]}>{cat}</Text>
                      </View>
                    </View>
                    <Text style={st.itemBody} numberOfLines={2}>{body}</Text>
                    <Text style={st.itemTime}>
                      {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      {item.gym?.name ? ` · ${item.gym.name}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onDelete(item.id)} style={{ paddingLeft: Spacing.xs }}>
                    <Icon name="trash-can-outline" size={16} color={Colors.error + "80"} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  chipTxtActive: { color: Colors.primary },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxxl * 2, gap: Spacing.md },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  itemTop: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start" },
  emojiWrap: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised, alignItems: "center", justifyContent: "center",
  },
  itemTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "700" },
  itemBody: { color: Colors.textSecondary, fontSize: Typography.xs, lineHeight: 16 },
  itemTime: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  catBadge: { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  catBadgeTxt: { fontSize: 9, fontWeight: "700" },
});

// ── Inbox Tab ──────────────────────────────────────────────────────────────────

function InboxTab({
  items,
  loading,
  refetching,
  total,
  page,
  pages,
  onRefresh,
  onNextPage,
  onPrevPage,
  onMarkAllRead,
}: {
  items: any[];
  loading: boolean;
  refetching: boolean;
  total: number;
  page: number;
  pages: number;
  onRefresh: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onMarkAllRead: () => void;
}) {
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <View style={{ flex: 1 }}>
      {unread > 0 && (
        <TouchableOpacity style={it.markAllRow} onPress={onMarkAllRead}>
          <Text style={it.markAllTxt}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={68} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refetching} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={st.empty}>
              <Icon name="bell-outline" size={40} color={Colors.border} />
              <Text style={st.emptyTxt}>No notifications received yet</Text>
            </View>
          }
          ListFooterComponent={
            pages > 1 ? (
              <View style={it.pagination}>
                <TouchableOpacity onPress={onPrevPage} disabled={page === 1} style={[it.pageBtn, page === 1 && { opacity: 0.3 }]}>
                  <Icon name="chevron-left" size={16} color={Colors.textMuted} />
                  <Text style={it.pageTxt}>Prev</Text>
                </TouchableOpacity>
                <Text style={it.pageInfo}>{page} / {pages}</Text>
                <TouchableOpacity onPress={onNextPage} disabled={page === pages} style={[it.pageBtn, page === pages && { opacity: 0.3 }]}>
                  <Text style={it.pageTxt}>Next</Text>
                  <Icon name="chevron-right" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item: n }) => (
            <View style={[it.item, !n.isRead && it.itemUnread]}>
              {!n.isRead && <View style={it.unreadDot} />}
              <View style={it.emojiWrap}>
                <Text style={{ fontSize: 16 }}>{TYPE_EMOJI[n.type] ?? "🔔"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[it.itemTitle, n.isRead && { color: Colors.textSecondary }]}>{n.title}</Text>
                {n.message && <Text style={it.itemMsg} numberOfLines={2}>{n.message}</Text>}
                <Text style={it.itemTime}>
                  {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const it = StyleSheet.create({
  markAllRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, alignItems: "flex-end" },
  markAllTxt: { color: Colors.primary, fontSize: Typography.xs, fontWeight: "600" },
  item: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  itemUnread: { backgroundColor: Colors.primaryFaded + "22", borderColor: Colors.primary + "30" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 5 },
  emojiWrap: {
    width: 34, height: 34, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised, alignItems: "center", justifyContent: "center",
  },
  itemTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  itemMsg: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16, marginTop: 2 },
  itemTime: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  pagination: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.lg, paddingTop: Spacing.lg,
  },
  pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.lg, backgroundColor: Colors.surfaceRaised },
  pageTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  pageInfo: { color: Colors.textMuted, fontSize: Typography.sm },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"sent" | "inbox">("sent");
  const [showForm, setShowForm] = useState(false);
  const [inboxPage, setInboxPage] = useState(1);

  const { data: sentData = [], isLoading: sentLoading, refetch: refetchSent, isRefetching: sentRefetching } = useQuery<any[]>({
    queryKey: ["trainerNotifSent"],
    queryFn: () => trainerNotificationsApi.listSent() as Promise<any[]>,
    staleTime: 60_000,
  });

  const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox, isRefetching: inboxRefetching } = useQuery<any>({
    queryKey: ["trainerNotifInbox", inboxPage],
    queryFn: () => trainerNotificationsApi.listInbox({ page: inboxPage }),
    staleTime: 60_000,
  });

  const inboxItems: any[] = inboxData?.notifications ?? [];
  const inboxTotal: number = inboxData?.total ?? 0;
  const inboxPages: number = inboxData?.pages ?? 1;
  const unread = inboxItems.filter((n) => !n.isRead).length;

  const sendMutation = useMutation({
    mutationFn: (data: { title: string; body: string; category: string }) =>
      trainerNotificationsApi.send({
        title: data.title,
        body: `[${data.category}] ${data.body}`,
      }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["trainerNotifSent"] });
      setShowForm(false);
      Toast.show({ type: "success", text1: "Notification sent!", text2: `Delivered to ${res?.recipientCount ?? 0} members` });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: e.message ?? "Failed to send" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainerNotificationsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainerNotifSent"] }); Toast.show({ type: "success", text1: "Deleted" }); },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => trainerNotificationsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainerNotifInbox"] }); Toast.show({ type: "success", text1: "All marked as read" }); },
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header
          menu
          title="Notifications"
          right={
            tab === "sent" ? (
              <TouchableOpacity style={s.composeBtn} onPress={() => setShowForm(true)}>
                <Icon name="send-outline" size={16} color="#fff" />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      {/* Tab toggle */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === "sent" && s.tabActive]} onPress={() => setTab("sent")}>
          <Icon name="megaphone-outline" size={14} color={tab === "sent" ? Colors.primary : Colors.textMuted} />
          <Text style={[s.tabTxt, tab === "sent" && s.tabTxtActive]}>Sent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "inbox" && s.tabActive]} onPress={() => setTab("inbox")}>
          <Icon name="bell-outline" size={14} color={tab === "inbox" ? Colors.primary : Colors.textMuted} />
          <Text style={[s.tabTxt, tab === "inbox" && s.tabTxtActive]}>Inbox</Text>
          {unread > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadTxt}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tab === "sent" ? (
        <SentTab
          items={sentData as any[]}
          loading={sentLoading}
          refetching={sentRefetching}
          onRefresh={refetchSent}
          onDelete={(id) => deleteMutation.mutate(id)}
          onCompose={() => setShowForm(true)}
        />
      ) : (
        <InboxTab
          items={inboxItems}
          loading={inboxLoading}
          refetching={inboxRefetching}
          total={inboxTotal}
          page={inboxPage}
          pages={inboxPages}
          onRefresh={refetchInbox}
          onNextPage={() => setInboxPage((p) => p + 1)}
          onPrevPage={() => setInboxPage((p) => p - 1)}
          onMarkAllRead={() => markAllReadMutation.mutate()}
        />
      )}

      <SendFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSend={(d) => sendMutation.mutate(d)}
        isSending={sendMutation.isPending}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  composeBtn: {
    width: 36, height: 36, borderRadius: Radius.lg,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.surfaceRaised },
  tabTxt: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "600" },
  tabTxtActive: { color: Colors.primary },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
});
