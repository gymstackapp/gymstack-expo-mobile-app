// mobile/src/components/common/PlanGate.tsx
// Renders children when the feature is allowed on the current subscription plan.
// Shows a locked state with upgrade CTA when not allowed.
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface PlanGateProps {
  allowed: boolean;
  featureLabel: string; // e.g. "Supplement Management"
  children: React.ReactNode;
}

export function PlanGate({ allowed, featureLabel, children }: PlanGateProps) {
  const navigation = useNavigation();

  if (allowed) return <>{children}</>;

  return (
    <View style={styles.container}>
      {/* Lock icon */}
      <View style={styles.iconWrap}>
        <Icon name="lock-outline" size={28} color={Colors.primary} />
      </View>

      {/* Text */}
      <Text style={styles.title}>{featureLabel}</Text>
      <Text style={styles.subtitle}>
        This feature is not available on your current plan.{"\n"}
        Upgrade to unlock it.
      </Text>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("OwnerBilling")}
        activeOpacity={0.85}
        style={styles.btnWrap}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <Icon name="lightning-bolt" size={16} color="#fff" />
          <Text style={styles.btnText}>Upgrade Plan</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
    lineHeight: Typography.sm * 1.6,
  },
  btnWrap: {
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  btnText: {
    color: "#fff",
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
