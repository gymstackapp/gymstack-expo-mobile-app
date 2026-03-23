import { Header } from "@/components";
import { Colors, Spacing } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BillingScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Header menu title="Billing" />
      </View>
      <View style={styles.center}>
        <Text style={styles.placeholder}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  top: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholder: { color: Colors.textMuted },
});
