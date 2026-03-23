// mobile/src/screens/owner/NotificationsScreen.tsx
import { gymsApi, notificationsApi } from "@/api/endpoints";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  SkeletonGroup,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const TARGET_ROLES = [
  { label: "Everyone", value: "" },
  { label: "Members only", value: "MEMBER" },
  { label: "Trainers only", value: "TRAINER" },
];

export default function OwnerNotificationsScreen() {
  const qc = useQueryClient();
  const { canSendNotification, usage, limits } = useSubscription();
  const [gymId, setGymId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    gymId: "",
    title: "",
    body: "",
    targetRole: "",
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: gymsApi.list,
    staleTime: 5 * 60_000,
  });
  const {
    data: announcements = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ownerNotifications", gymId],
    queryFn: () => notificationsApi.list({ gymId: gymId || undefined }),
    staleTime: 60_000,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      notificationsApi.send({
        ...form,
        gymId: form.gymId || gymId || (gyms as any[])[0]?.id,
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      setShowAdd(false);
      setForm((f) => ({ ...f, title: "", body: "", targetRole: "" }));
      Toast.show({
        type: "success",
        text1: `Sent to ${data.recipientCount ?? 0} recipients`,
      });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      Toast.show({ type: "success", text1: "Deleted" });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.message }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const monthlyLeft =
    limits?.maxNotificationsPerMonth !== null &&
    limits?.maxNotificationsPerMonth !== undefined
      ? limits.maxNotificationsPerMonth - (usage?.notificationsThisMonth ?? 0)
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <Header
          title="Notifications"
          subtitle={
            monthlyLeft !== null
              ? `${monthlyLeft} remaining this month`
              : undefined
          }
          back
          right={
            canSendNotification ? (
              <TouchableOpacity
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: Radius.lg,
                  backgroundColor: Colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setShowAdd(true)}
              >
                <Icon name="send-outline" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.warningFaded,
                  borderRadius: Radius.full,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: Colors.warning + "40",
                }}
                onPress={() =>
                  Toast.show({
                    type: "error",
                    text1: "Notification limit reached. Upgrade your plan.",
                  })
                }
              >
                <Text
                  style={{
                    color: Colors.warning,
                    fontSize: Typography.xs,
                    fontWeight: "700",
                  }}
                >
                  Limit reached
                </Text>
              </TouchableOpacity>
            )
          }
        />
        {gyms.length > 1 && (
          <View
            style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}
          >
            {[{ id: "", name: "All" }, ...(gyms as any[])].map((g: any) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGymId(g.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: Radius.full,
                  backgroundColor:
                    gymId === g.id ? Colors.primaryFaded : Colors.surfaceRaised,
                  borderWidth: 1,
                  borderColor: gymId === g.id ? Colors.primary : Colors.border,
                }}
              >
                <Text
                  style={{
                    color: gymId === g.id ? Colors.primary : Colors.textMuted,
                    fontSize: Typography.xs,
                  }}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonGroup count={4} itemHeight={70} gap={Spacing.sm} />
        </View>
      ) : (announcements as any[]).length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="No notifications sent"
          subtitle="Send your first announcement to members"
        />
      ) : (
        <FlatList
          data={announcements as any[]}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
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
          renderItem={({ item: a }) => (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: Spacing.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Colors.textPrimary,
                      fontSize: Typography.sm,
                      fontWeight: "700",
                    }}
                  >
                    {a.title}
                  </Text>
                  <Text
                    style={{
                      color: Colors.textSecondary,
                      fontSize: Typography.xs,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {a.body}
                  </Text>
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {a.gym?.name} · {a.targetRole ?? "Everyone"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Delete", "Delete this announcement?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteMutation.mutate(a.id),
                      },
                    ])
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon
                    name="trash-can-outline"
                    size={16}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView
            contentContainerStyle={{
              padding: Spacing.lg,
              paddingBottom: 40,
              gap: Spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.sm,
              }}
            >
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: Typography.xl,
                  fontWeight: "700",
                }}
              >
                Send Notification
              </Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Icon name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {gyms.length > 1 && (
              <View>
                <Text
                  style={{
                    color: Colors.textMuted,
                    fontSize: Typography.xs,
                    fontWeight: "500",
                    marginBottom: 8,
                  }}
                >
                  Gym *
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.xs,
                  }}
                >
                  {(gyms as any[]).map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => set("gymId", g.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Radius.full,
                        backgroundColor:
                          form.gymId === g.id
                            ? Colors.primaryFaded
                            : Colors.surfaceRaised,
                        borderWidth: 1,
                        borderColor:
                          form.gymId === g.id ? Colors.primary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            form.gymId === g.id
                              ? Colors.primary
                              : Colors.textMuted,
                          fontSize: Typography.xs,
                        }}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Input
              label="Title *"
              value={form.title}
              onChangeText={(v) => set("title", v)}
              placeholder="Notification title"
            />
            <Input
              label="Message *"
              value={form.body}
              onChangeText={(v) => set("body", v)}
              placeholder="Your message here..."
              multiline
              numberOfLines={4}
            />
            <View>
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: Typography.xs,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                Send To
              </Text>
              <View style={{ gap: Spacing.xs }}>
                {TARGET_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => set("targetRole", r.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      paddingVertical: Spacing.sm,
                    }}
                  >
                    <Icon
                      name={
                        form.targetRole === r.value
                          ? "radiobox-marked"
                          : "radiobox-blank"
                      }
                      size={20}
                      color={
                        form.targetRole === r.value
                          ? Colors.primary
                          : Colors.textMuted
                      }
                    />
                    <Text
                      style={{
                        color: Colors.textPrimary,
                        fontSize: Typography.sm,
                      }}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Button
              label="Send Notification"
              onPress={() => {
                if (!form.title.trim() || !form.body.trim()) {
                  Toast.show({
                    type: "error",
                    text1: "Title and message required",
                  });
                  return;
                }
                sendMutation.mutate();
              }}
              loading={sendMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
