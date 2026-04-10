import { gymsApi, supplementsApi } from "@/api/endpoints";
import { Button, Header, Input } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import type { Gym } from "@/types/api";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const initialForm = {
  gymId: "",
  name: "",
  brand: "",
  category: "",
  unitSize: "",
  price: "",
  costPrice: "",
  stockQty: "0",
  lowStockAt: "5",
};

export default function AddSupplementItemScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [gymId, setGymId] = useState("");

  const { data: gyms = [] } = useQuery({
    queryKey: ["ownerGyms"],
    queryFn: () => gymsApi.list() as Promise<Gym[]>,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!gymId && gyms.length > 0) {
      setGymId(gyms[0].id);
    }
  }, [gymId, gyms]);

  const addMutation = useMutation({
    mutationFn: () =>
      supplementsApi.create({
        ...form,
        gymId: form.gymId || gymId || (gyms as any[])[0]?.id,
        price: parseFloat(form.price),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        stockQty: parseInt(form.stockQty, 10) || 0,
        lowStockAt: parseInt(form.lowStockAt, 10) || 5,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerSupplements"] });
      qc.invalidateQueries({ queryKey: ["ownerGyms"] });
      Toast.show({ type: "success", text1: "Supplement added!" });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: err?.message ?? "Unable to add supplement",
      });
    },
  });

  const setField = (key: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerWrap}>
        <Header title="Add Supplement" back />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {gyms.length > 1 ? (
          <View style={styles.gymPickerRow}>
            {gyms.map((gym) => (
              <TouchableOpacity
                key={gym.id}
                onPress={() => setGymId(gym.id)}
                style={[
                  styles.gymChip,
                  gymId === gym.id && styles.gymChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.gymChipLabel,
                    gymId === gym.id && styles.gymChipLabelActive,
                  ]}
                >
                  {gym.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Input
          label="Name *"
          value={form.name}
          onChangeText={(value) => setField("name", value)}
          placeholder="e.g. Whey Protein"
        />
        <Input
          label="Brand"
          value={form.brand}
          onChangeText={(value) => setField("brand", value)}
          placeholder="e.g. MuscleBlaze"
        />
        <Input
          label="Category"
          value={form.category}
          onChangeText={(value) => setField("category", value)}
          placeholder="Protein, Creatine..."
        />
        <Input
          label="Unit Size"
          value={form.unitSize}
          onChangeText={(value) => setField("unitSize", value)}
          placeholder="1kg, 60 caps..."
        />
        <Input
          label="Price (₹) *"
          value={form.price}
          onChangeText={(value) => setField("price", value)}
          keyboardType="numeric"
        />
        <Input
          label="Cost Price"
          value={form.costPrice}
          onChangeText={(value) => setField("costPrice", value)}
          keyboardType="numeric"
        />
        <Input
          label="Stock Qty"
          value={form.stockQty}
          onChangeText={(value) => setField("stockQty", value)}
          keyboardType="numeric"
        />
        <Input
          label="Low Stock Alert"
          value={form.lowStockAt}
          onChangeText={(value) => setField("lowStockAt", value)}
          keyboardType="numeric"
        />

        <Button
          label="Add Supplement"
          loading={addMutation.isPending}
          onPress={() => {
            if (!form.name.trim() || !form.price) {
              Toast.show({
                type: "error",
                text1: "Name and price required",
              });
              return;
            }
            addMutation.mutate();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  gymPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gymChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gymChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  gymChipLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  gymChipLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
