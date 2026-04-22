import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Header } from "./Header";

interface Props {
  pageName?: string;
}

export function NoGymState({ pageName }: Props) {
  const navigation = useNavigation<any>();

  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <Header title={pageName ?? "Page"} menu />
      </View>
      <View style={s.container}>
        <View style={s.iconWrap}>
          <Icon name="office-building-outline" size={64} color={Colors.primary} />
        </View>
        <Text style={s.title}>You haven't joined any gym yet</Text>
        <Text style={s.subtitle}>
          {pageName
            ? `${pageName} is only available once you're part of a gym.`
            : "This page is only available once you're part of a gym."}
        </Text>
        <Text style={s.note}>
          Discover and join a gym, or ask your gym owner to add you.
        </Text>
        <TouchableOpacity
          style={s.cta}
          onPress={() => navigation.navigate("MemberDiscover")}
          activeOpacity={0.8}
        >
          <Icon name="compass-outline" size={18} color="#fff" />
          <Text style={s.ctaText}>Discover Gyms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  note: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  ctaText: {
    color: "#fff",
    fontSize: Typography.base,
    fontWeight: "700",
  },
});
