// // mobile/src/screens/owner/AddGymScreen.tsx
// import { gymsApi } from "@/api/endpoints";
// import { Button, Card, Header, Input, PlanGate } from "@/components";
// import { useSubscription } from "@/hooks/useSubsciption";
// import { Colors, Radius, Spacing, Typography } from "@/theme";
// import { useNavigation } from "@react-navigation/native";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import * as ImagePicker from "expo-image-picker";
// import React, { useState } from "react";
// import {
//   FlatList,
//   Image,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const INDIA_STATES = [
//   "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
//   "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
//   "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
//   "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
//   "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
//   // Union Territories
//   "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
//   "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
// ];

// function StatePickerModal({
//   visible,
//   selected,
//   onSelect,
//   onClose,
// }: {
//   visible: boolean;
//   selected: string;
//   onSelect: (s: string) => void;
//   onClose: () => void;
// }) {
//   const [query, setQuery] = React.useState("");
//   const filtered = query.trim()
//     ? INDIA_STATES.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
//     : INDIA_STATES;

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//       <TouchableWithoutFeedback onPress={onClose}>
//         <View style={sp.overlay} />
//       </TouchableWithoutFeedback>

//       <View style={sp.sheet}>
//         <View style={sp.handle} />
//         <Text style={sp.title}>Select State</Text>

//         <View style={sp.searchBox}>
//           <Icon name="magnify" size={18} color={Colors.textMuted} style={sp.searchIcon} />
//           <TextInput
//             style={sp.searchInput}
//             value={query}
//             onChangeText={setQuery}
//             placeholder="Search state..."
//             placeholderTextColor={Colors.textMuted}
//             autoCorrect={false}
//           />
//           {query.length > 0 && (
//             <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
//               <Icon name="close-circle" size={16} color={Colors.textMuted} />
//             </TouchableOpacity>
//           )}
//         </View>

//         <FlatList
//           data={filtered}
//           keyExtractor={(item) => item}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//           renderItem={({ item }) => {
//             const active = item === selected;
//             return (
//               <TouchableOpacity
//                 style={[sp.option, active && sp.optionActive]}
//                 onPress={() => { onSelect(item); onClose(); }}
//               >
//                 <Text style={[sp.optionText, active && sp.optionTextActive]}>
//                   {item}
//                 </Text>
//                 {active && (
//                   <Icon name="check-circle" size={18} color={Colors.primary} />
//                 )}
//               </TouchableOpacity>
//             );
//           }}
//           ListEmptyComponent={
//             <Text style={sp.empty}>No states match "{query}"</Text>
//           }
//         />
//       </View>
//     </Modal>
//   );
// }

// const sp = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   sheet: {
//     backgroundColor: Colors.surface,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: "70%",
//     paddingBottom: 24,
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: Colors.border,
//     alignSelf: "center",
//     marginTop: 10,
//     marginBottom: 4,
//   },
//   title: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "600",
//     textAlign: "center",
//     paddingVertical: Spacing.md,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   searchBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     marginHorizontal: Spacing.lg,
//     marginVertical: Spacing.md,
//     paddingHorizontal: Spacing.md,
//     height: 44,
//   },
//   searchIcon: { marginRight: Spacing.sm },
//   searchInput: {
//     flex: 1,
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     paddingVertical: 0,
//   },
//   option: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 14,
//     paddingHorizontal: Spacing.lg,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   optionActive: { backgroundColor: Colors.primaryFaded },
//   optionText: { color: Colors.textPrimary, fontSize: Typography.base },
//   optionTextActive: { color: Colors.primary, fontWeight: "600" },
//   empty: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     textAlign: "center",
//     paddingVertical: Spacing.xl,
//   },
// });

// const SERVICES_OPTIONS = [
//   "Abs",
//   "Aerobics",
//   "Body Tone",
//   "Boxing",
//   "Cardio",
//   "Combat",
//   "Core Gym",
//   "CrossFit",
//   "Cycling",
//   "Dance",
//   "High Intensity",
//   "Pilates",
//   "Sports",
//   "Swimming",
//   "Weight Training",
//   "Yoga",
//   "Zumba",
// ];
// const FACILITIES_OPTIONS = [
//   "AC",
//   "Cafeteria",
//   "Cardio",
//   "CCTV",
//   "Fire Protection",
//   "Hot Water",
//   "Locker",
//   "Parking",
//   "Security",
//   "Shower",
//   "Speaker",
//   "Trainers",
//   "Weight",
//   "Wifi",
//   "Workout",
//   "24/7 Access",
// ];

// function ChipSelect({
//   label,
//   options,
//   selected,
//   onToggle,
// }: {
//   label: string;
//   options: string[];
//   selected: string[];
//   onToggle: (v: string) => void;
// }) {
//   return (
//     <View style={cs.wrap}>
//       <Text style={cs.label}>{label}</Text>
//       <View style={cs.chips}>
//         {options.map((o) => {
//           const active = selected.includes(o);
//           return (
//             <TouchableOpacity
//               key={o}
//               onPress={() => onToggle(o)}
//               style={[cs.chip, active && cs.chipActive]}
//             >
//               <Text style={[cs.chipText, active && cs.chipTextActive]}>
//                 {o}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// }
// const cs = StyleSheet.create({
//   wrap: { marginBottom: Spacing.md },
//   label: {
//     color: Colors.textPrimary,
//     fontSize: Typography.lg,
//     fontWeight: "500",
//     marginBottom: 20,
//     letterSpacing: 0.3,
//   },
//   chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
//   chip: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: Radius.full,
//     backgroundColor: Colors.surfaceRaised,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   chipActive: {
//     backgroundColor: Colors.primaryFaded,
//     borderColor: Colors.primary,
//   },
//   chipText: { color: Colors.textPrimary, fontSize: Typography.sm },
//   chipTextActive: { color: Colors.primary, fontWeight: "600" },
// });

// export default function OwnerAddGymScreen() {
//   const navigation = useNavigation();
//   const qc = useQueryClient();
//   const { canAddGym } = useSubscription();

//   const [form, setForm] = useState({
//     name: "",
//     address: "",
//     city: "",
//     state: "",
//     pincode: "",
//     contactNumber: "",
//     services: [] as string[],
//     facilities: [] as string[],
//   });
//   const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
//   const [stateModal, setStateModal] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const set = (key: string, val: string) => {
//     setForm((f) => ({ ...f, [key]: val }));
//     if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
//   };

//   const toggleArr = (key: "services" | "facilities", val: string) => {
//     setForm((f) => ({
//       ...f,
//       [key]: f[key].includes(val)
//         ? f[key].filter((v) => v !== val)
//         : [...f[key], val],
//     }));
//   };

//   const pickImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Toast.show({ type: "error", text1: "Permission to access gallery is required" });
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
//       allowsMultipleSelection: true,
//       quality: 0.8,
//       selectionLimit: 10,
//     });
//     if (!result.canceled) {
//       setImages((prev) => {
//         const existing = new Set(prev.map((a) => a.uri));
//         const newAssets = result.assets.filter((a) => !existing.has(a.uri));
//         return [...prev, ...newAssets].slice(0, 10);
//       });
//     }
//   };

//   const removeImage = (uri: string) =>
//     setImages((prev) => prev.filter((a) => a.uri !== uri));

//   const mutation = useMutation({
//     mutationFn: () => gymsApi.create({ ...form, gymImages: images.map((a) => a.uri) }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["ownerGyms"] });
//       qc.invalidateQueries({ queryKey: ["ownerSubscription"] });
//       Toast.show({ type: "success", text1: "Gym created! 🎉" });
//       navigation.goBack();
//     },
//     onError: (err: any) => {
//       Toast.show({
//         type: "error",
//         text1: err.message ?? "Failed to create gym",
//       });
//     },
//   });

//   const validate = (): boolean => {
//     const e: Record<string, string> = {};
//     if (!form.name.trim()) e.name = "Gym name is required";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const submit = () => {
//     if (!validate()) return;
//     mutation.mutate();
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <PlanGate allowed={canAddGym} featureLabel="Add Gym">
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Header title="Add New Gym" back />

//           <Card>
//             <Input
//               label="Gym Name *"
//               value={form.name}
//               onChangeText={(v) => set("name", v)}
//               placeholder="e.g. FitHub Koramangala"
//               error={errors.name}
//               leftIcon="dumbbell"
//             />
//             <Input
//               label="Address"
//               value={form.address}
//               onChangeText={(v) => set("address", v)}
//               placeholder="Street address"
//               leftIcon="map-marker-outline"
//             />
//             <Input
//               label="City"
//               value={form.city}
//               onChangeText={(v) => set("city", v)}
//               placeholder="e.g. Bengaluru"
//               leftIcon="city-variant-outline"
//             />
//             <View style={styles.dropdownWrap}>
//               <Text style={styles.dropdownLabel}>State</Text>
//               <TouchableOpacity
//                 style={styles.dropdownBox}
//                 onPress={() => setStateModal(true)}
//                 activeOpacity={0.7}
//               >
//                 <Icon name="map-outline" size={18} color={Colors.textMuted} style={styles.dropdownIcon} />
//                 <Text style={[styles.dropdownValue, !form.state && styles.dropdownPlaceholder]}>
//                   {form.state || "Select state"}
//                 </Text>
//                 <Icon name="chevron-down" size={18} color={Colors.textMuted} />
//               </TouchableOpacity>
//             </View>

//             <StatePickerModal
//               visible={stateModal}
//               selected={form.state}
//               onSelect={(s) => set("state", s)}
//               onClose={() => setStateModal(false)}
//             />
//             <Input
//               label="Pincode"
//               value={form.pincode}
//               onChangeText={(v) => set("pincode", v)}
//               placeholder="560034"
//               keyboardType="numeric"
//             />
//             <Input
//               label="Contact Number"
//               value={form.contactNumber}
//               onChangeText={(v) => set("contactNumber", v)}
//               placeholder="+91 98765 43210"
//               keyboardType="phone-pad"
//               leftIcon="phone-outline"
//             />
//           </Card>

//           {/* ── Gym Images ─────────────────────────────────────── */}
//           <Card>
//             <Text style={img.sectionLabel}>Gym Photos</Text>
//             <Text style={img.sectionSub}>
//               Add up to 10 photos of your gym (optional)
//             </Text>

//             <View style={img.grid}>
//               {images.map((asset) => (
//                 <View key={asset.uri} style={img.thumb}>
//                   <Image source={{ uri: asset.uri }} style={img.thumbImg} />
//                   <TouchableOpacity
//                     style={img.removeBtn}
//                     onPress={() => removeImage(asset.uri)}
//                     hitSlop={8}
//                   >
//                     <Icon name="close-circle" size={20} color={Colors.error} />
//                   </TouchableOpacity>
//                 </View>
//               ))}

//               {images.length < 10 && (
//                 <TouchableOpacity style={img.addBtn} onPress={pickImages}>
//                   <Icon name="camera-plus-outline" size={28} color={Colors.primary} />
//                   <Text style={img.addBtnText}>
//                     {images.length === 0 ? "Add Photos" : "Add More"}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {images.length > 0 && (
//               <Text style={img.countText}>
//                 {images.length} / 10 photo{images.length !== 1 ? "s" : ""} selected
//               </Text>
//             )}
//           </Card>

//           <ChipSelect
//             label="Services Offered"
//             options={SERVICES_OPTIONS}
//             selected={form.services}
//             onToggle={(v) => toggleArr("services", v)}
//           />

//           <ChipSelect
//             label="Facilities Available"
//             options={FACILITIES_OPTIONS}
//             selected={form.facilities}
//             onToggle={(v) => toggleArr("facilities", v)}
//           />

//           <Button
//             label="Create Gym"
//             onPress={submit}
//             loading={mutation.isPending}
//             style={{ marginTop: Spacing.sm }}
//           />
//         </ScrollView>
//       </PlanGate>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg },
//   scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },

//   dropdownWrap: { marginBottom: Spacing.md },
//   dropdownLabel: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     fontWeight: "500",
//     marginBottom: 6,
//     letterSpacing: 0.3,
//   },
//   dropdownBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: Colors.surfaceRaised,
//     borderRadius: Radius.lg,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     paddingHorizontal: Spacing.md,
//     height: 52,
//   },
//   dropdownIcon: { marginRight: Spacing.sm },
//   dropdownValue: {
//     flex: 1,
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//   },
//   dropdownPlaceholder: { color: Colors.textMuted },
// });

// const THUMB_SIZE = 88;
// const img = StyleSheet.create({
//   sectionLabel: {
//     color: Colors.textPrimary,
//     fontSize: Typography.base,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   sectionSub: {
//     color: Colors.textMuted,
//     fontSize: Typography.sm,
//     marginBottom: Spacing.md,
//   },
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: Spacing.sm,
//   },
//   thumb: {
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     borderRadius: Radius.md,
//     overflow: "visible",
//   },
//   thumbImg: {
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     borderRadius: Radius.md,
//     backgroundColor: Colors.surfaceRaised,
//   },
//   removeBtn: {
//     position: "absolute",
//     top: -8,
//     right: -8,
//     backgroundColor: Colors.bg,
//     borderRadius: 10,
//   },
//   addBtn: {
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     borderRadius: Radius.md,
//     borderWidth: 1.5,
//     borderColor: Colors.primary,
//     borderStyle: "dashed",
//     backgroundColor: Colors.primaryFaded,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 4,
//   },
//   addBtnText: {
//     color: Colors.primary,
//     fontSize: Typography.xs,
//     fontWeight: "600",
//   },
//   countText: {
//     color: Colors.textMuted,
//     fontSize: Typography.xs,
//     marginTop: Spacing.sm,
//   },
// });
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
            <Input
              label="Gym Name *"
              value={form.name}
              onChangeText={(v) => set("name", v)}
              placeholder="e.g. FitHub Koramangala"
              error={errors.name}
              leftIcon="dumbbell"
            />
            <Input
              label="Address"
              value={form.address}
              onChangeText={(v) => set("address", v)}
              placeholder="Street address"
              leftIcon="map-marker-outline"
            />
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => set("city", v)}
              placeholder="e.g. Bengaluru"
              leftIcon="city-variant-outline"
            />
            <Input
              label="State"
              value={form.state}
              onChangeText={(v) => set("state", v)}
              placeholder="e.g. Karnataka"
            />
            <Input
              label="Pincode"
              value={form.pincode}
              onChangeText={(v) => set("pincode", v)}
              placeholder="560034"
              keyboardType="numeric"
            />
            <Input
              label="Contact Number"
              value={form.contactNumber}
              onChangeText={(v) => set("contactNumber", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
            />
          </Card>

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

          <View style={{ gap: 8 }}>
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

          <Button
            label="Create Gym"
            onPress={submit}
            loading={mutation.isPending}
            style={{ marginTop: Spacing.sm }}
          />
        </ScrollView>
      </PlanGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
});
