import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";

type Role = "owner" | "member" | "trainer";

const { width } = Dimensions.get("window");

const C = {
  bg: "#0A0A0A",
  surface: "#1A1A1A",
  surfaceElevated: "#242424",
  border: "#2C2C2E",
  primary: "#FF3B30",
  text: "#FFFFFF",
  textSub: "#8E8E93",
};

type RoleOption = {
  id: Role;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  features: string[];
};

const ROLES: RoleOption[] = [
  {
    id: "owner",
    title: "Owner",
    description: "Manage your gym, members, and staff",
    icon: "business",
    accentColor: "#FF9F0A",
    features: ["Manage members", "Track revenue", "Assign trainers"],
  },
  {
    id: "member",
    title: "Member",
    description: "Track workouts and reach your goals",
    icon: "body",
    accentColor: "#30D158",
    features: ["Log workouts", "Track progress", "View schedule"],
  },
];

export default function SelectRoleScreen() {
  const { profile } = useAuthStore();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    // Role is assigned server-side on login; this screen is a fallback only.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="barbell" size={28} color={C.primary} />
          </View>
          <Text style={styles.greeting}>
            Hey, {profile?.fullName?.split(" ")[0] ?? "there"}!
          </Text>
          <Text style={styles.title}>How will you use{"\n"}GymStack?</Text>
          <Text style={styles.subtitle}>
            Choose your role to get the right experience
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.card,
                  isSelected && {
                    borderColor: role.accentColor,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.85}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: role.accentColor },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}

                {/* Icon */}
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected
                        ? role.accentColor + "22"
                        : C.surfaceElevated,
                    },
                  ]}
                >
                  <Ionicons
                    name={role.icon as any}
                    size={32}
                    color={isSelected ? role.accentColor : C.textSub}
                  />
                </View>

                <Text
                  style={[
                    styles.roleTitle,
                    isSelected && { color: role.accentColor },
                  ]}
                >
                  {role.title}
                </Text>
                <Text style={styles.roleDesc}>{role.description}</Text>

                <View style={styles.featureList}>
                  {role.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={isSelected ? role.accentColor : C.textSub}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>CONTINUE</Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: { marginBottom: 32 },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  greeting: { fontSize: 16, color: C.textSub, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "800", color: C.text, lineHeight: 36 },
  subtitle: { fontSize: 14, color: C.textSub, marginTop: 8 },
  cardsContainer: { flexDirection: "row", gap: 12, marginBottom: 32 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: C.border,
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: C.textSub,
    marginBottom: 16,
    lineHeight: 17,
  },
  featureList: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center" },
  featureText: { fontSize: 12, color: C.textSub },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  continueBtnDisabled: { opacity: 0.35 },
  continueBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
