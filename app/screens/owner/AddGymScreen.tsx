// mobile/src/screens/owner/AddGymScreen.tsx
import { gymsApi } from "@/api/endpoints";
import {
  Button,
  Card,
  Header,
  Input,
  MultiImageUpload,
  PlanGate,
} from "@/components";
import { useSubscription } from "@/hooks/useSubsciption";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const SERVICES_OPTIONS = [
  "Cardio",
  "Weight Training",
  "Yoga",
  "Zumba",
  "CrossFit",
  "Pilates",
  "Boxing",
  "Swimming",
  "Cycling",
];
const FACILITIES_OPTIONS = [
  "Parking",
  "Locker Rooms",
  "Showers",
  "Cafeteria",
  "WiFi",
  "Air Conditioning",
  "CCTV",
  "24/7 Access",
];

function ChipSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={cs.wrap}>
      <Text style={cs.label}>{label}</Text>
      <View style={cs.chips}>
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <TouchableOpacity
              key={o}
              onPress={() => onToggle(o)}
              style={[cs.chip, active && cs.chipActive]}
            >
              <Text style={[cs.chipText, active && cs.chipTextActive]}>
                {o}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const cs = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textMuted, fontSize: Typography.xs },
  chipTextActive: { color: Colors.primary, fontWeight: "600" },
});

export default function OwnerAddGymScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { canAddGym } = useSubscription();

  const [gymImages, setGymImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    services: [] as string[],
    facilities: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const toggleArr = (key: "services" | "facilities", val: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter((v) => v !== val)
        : [...f[key], val],
    }));
  };

  const mutation = useMutation({
    mutationFn: () => gymsApi.create({ ...form, gymImages }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerGyms"] });
      qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
      Toast.show({ type: "success", text1: "Gym created! 🎉" });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: err.message ?? "Failed to create gym",
      });
    },
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Gym name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.pincode.trim()) e.pincode = "Pincode is required";
    if (!form.contactNumber.trim())
      e.contactNumber = "Contact number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PlanGate allowed={canAddGym} featureLabel="Add Gym">
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header title="Add New Gym" back />

          <Card>
            <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: 11,
                  fontWeight: "500",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                Gym Photos
              </Text>
              <MultiImageUpload
                values={gymImages}
                onChange={setGymImages}
                folder="gymImages"
                max={8}
              />
            </View>
            <Input
              label="Gym Name *"
              value={form.name}
              onChangeText={(v) => set("name", v)}
              placeholder="e.g. FitHub Koramangala"
              error={errors.name}
              leftIcon="dumbbell"
            />
            <Input
              label="Address *"
              value={form.address}
              onChangeText={(v) => set("address", v)}
              placeholder="Street address"
              leftIcon="map-marker-outline"
              error={errors.address}
            />
            <Input
              label="City *"
              value={form.city}
              onChangeText={(v) => set("city", v)}
              placeholder="e.g. Bengaluru"
              leftIcon="city-variant-outline"
              error={errors.city}
            />
            <Input
              label="State *"
              value={form.state}
              onChangeText={(v) => set("state", v)}
              placeholder="e.g. Karnataka"
              error={errors.state}
            />
            <Input
              label="Pincode *"
              value={form.pincode}
              onChangeText={(v) => set("pincode", v)}
              placeholder="560034"
              keyboardType="numeric"
              error={errors.pincode}
            />
            <Input
              label="Contact Number *"
              value={form.contactNumber}
              onChangeText={(v) => set("contactNumber", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
              error={errors.contactNumber}
            />
            <ChipSelect
              label="Services Offered"
              options={SERVICES_OPTIONS}
              selected={form.services}
              onToggle={(v) => toggleArr("services", v)}
            />

            <ChipSelect
              label="Facilities Available"
              options={FACILITIES_OPTIONS}
              selected={form.facilities}
              onToggle={(v) => toggleArr("facilities", v)}
            />

            <Button
              label="Create Gym"
              onPress={submit}
              loading={mutation.isPending}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
});
