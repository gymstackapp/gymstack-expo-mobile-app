// app/screens/trainer/GymsScreen.tsx
// Trainer's current gym(s) — matches web trainer/gyms page.

import { trainerGymsApi } from "@/api/endpoints";
import { Avatar, Card, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function GymCard({ gym }: { gym: any }) {
  const coverImage = gym.gymImages?.[0] ?? null;
  const contact = gym.contactNumber || gym.owner?.mobileNumber;
  const joined = gym.joinedAt ? new Date(gym.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Cover */}
      <View style={s.imageWrap}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imagePlaceholder}>
            <Icon name="image-outline" size={32} color={Colors.border} />
          </View>
        )}
        <View style={s.activeBadge}>
          <View style={s.activeDot} />
          <Text style={s.activeTxt}>Active</Text>
        </View>
        {gym.gymImages?.length > 1 && (
          <View style={s.imgCount}>
            <Icon name="image-multiple-outline" size={10} color="#fff" />
            <Text style={s.imgCountTxt}>{gym.gymImages.length}</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        {/* Name + address + call */}
        <View style={s.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.gymName}>{gym.name}</Text>
            {(gym.address || gym.city) && (
              <Text style={s.gymAddress} numberOfLines={1}>
                <Icon name="map-marker-outline" size={11} color={Colors.textMuted} />
                {" "}{[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
              </Text>
            )}
          </View>
          {contact && (
            <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${contact}`)}>
              <Icon name="phone-outline" size={15} color={Colors.success} />
              <Text style={s.callTxt}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCell}>
            <Icon name="account-group-outline" size={15} color={Colors.primary} />
            <Text style={s.statVal}>{gym._count?.members ?? 0}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCell}>
            <Icon name="account-tie-outline" size={15} color={Colors.primary} />
            <Text style={s.statVal}>{gym._count?.trainers ?? 0}</Text>
            <Text style={s.statLabel}>Trainers</Text>
          </View>
          {joined && (
            <>
              <View style={s.statDivider} />
              <View style={s.statCell}>
                <Icon name="calendar-check-outline" size={15} color={Colors.primary} />
                <Text style={[s.statVal, { fontSize: Typography.xs }]}>{joined}</Text>
                <Text style={s.statLabel}>Joined</Text>
              </View>
            </>
          )}
        </View>

        {/* Specializations */}
        {gym.specializations?.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>Specializations</Text>
            <View style={s.tagWrap}>
              {gym.specializations.map((sp: string) => (
                <View key={sp} style={s.tag}>
                  <Text style={s.tagTxt}>{sp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {gym.services?.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>Services</Text>
            <View style={s.tagWrap}>
              {gym.services.map((sv: string) => (
                <View key={sv} style={[s.tag, s.tagPrimary]}>
                  <Text style={[s.tagTxt, { color: Colors.primary }]}>{sv}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner */}
        {gym.owner && (
          <View style={s.ownerRow}>
            <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={s.ownerLabel}>Gym Owner</Text>
              <Text style={s.ownerName}>{gym.owner.fullName}</Text>
            </View>
            {gym.owner.mobileNumber && (
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => Linking.openURL(`tel:${gym.owner.mobileNumber}`)}
              >
                <Icon name="phone-outline" size={15} color={Colors.success} />
                <Text style={s.callTxt}>Call Owner</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

export function GymsScreen() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["trainerGyms"],
    queryFn: () => trainerGymsApi.list(),
    staleTime: 5 * 60_000,
  });

  const gyms: any[] = Array.isArray(data) ? data : data?.gyms ?? [];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header menu title="My Gyms" subtitle="Gyms you're currently working at" />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : gyms.length === 0 ? (
        <View style={s.empty}>
          <Icon name="office-building-outline" size={48} color={Colors.border} />
          <Text style={s.emptyTitle}>No gyms yet</Text>
          <Text style={s.emptySub}>You haven't been assigned to any gym. Use Discover to find and join one.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {gyms.map((gym: any) => (
            <GymCard key={gym.id} gym={gym} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "700", textAlign: "center" },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: "center" },
  imageWrap: { height: 160, backgroundColor: Colors.surfaceRaised },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  activeBadge: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  activeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  imgCount: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3 },
  imgCountTxt: { color: "#fff", fontSize: 10 },
  body: { padding: Spacing.md, gap: Spacing.md },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  gymName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: "800" },
  gymAddress: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 3 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.successFaded, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  callTxt: { color: Colors.success, fontSize: Typography.xs, fontWeight: "600" },
  statsRow: { flexDirection: "row", backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, paddingVertical: Spacing.md },
  statCell: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statVal: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: "700" },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  sectionLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.xs },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  tag: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  tagPrimary: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary + "25" },
  tagTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  ownerLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  ownerName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600", marginTop: 2 },
});
