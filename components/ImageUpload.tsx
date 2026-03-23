// mobile/src/components/common/ImageUpload.tsx
// Reusable image picker + upload component for mobile.
// Shows existing image, handles upload to Cloudinary via backend,
// and shows loading/error states.
// Uses expo-image-picker via utils/imageUpload.

import { Colors, Radius, Spacing, Typography } from "@/theme";
import {
    pickAndUploadMultiple,
    pickAndUploadSingle,
    type ImageFolder,
} from "@/utils/imageUpload";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Single image upload ───────────────────────────────────────────────────────

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder: ImageFolder;
  size?: number;
  shape?: "circle" | "square";
  placeholder?: string;
  showOverlay?: boolean;
  style?: ViewStyle;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  size = 80,
  shape = "square",
  placeholder = "Upload Photo",
  showOverlay = true,
  style,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const radius = shape === "circle" ? size / 2 : Radius.xl;

  const handlePick = () => {
    Alert.alert("Choose Image", undefined, [
      { text: "Camera", onPress: () => doUpload("camera") },
      { text: "Photo Library", onPress: () => doUpload("gallery") },
      {
        text: "Remove Photo",
        onPress: () => onChange(null),
        style: "destructive",
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePickNew = () => {
    Alert.alert("Choose Image", undefined, [
      { text: "Camera", onPress: () => doUpload("camera") },
      { text: "Photo Library", onPress: () => doUpload("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const doUpload = async (source: "camera" | "gallery") => {
    setLoading(true);
    setError(null);
    try {
      const result = await pickAndUploadSingle(folder, source);
      if (result) onChange(result.url);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Upload Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[{ alignItems: "center" }, style]}>
      <TouchableOpacity
        onPress={value ? handlePick : handlePickNew}
        activeOpacity={0.8}
        disabled={loading}
        style={[
          su.container,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        {value ? (
          <>
            <Image
              source={{ uri: value }}
              style={{ width: size, height: size, borderRadius: radius }}
              resizeMode="cover"
            />
            {/* Edit overlay */}
            {showOverlay && (
              <View style={[su.overlay, { borderRadius: radius }]}>
                <Icon name="camera-outline" size={size * 0.25} color="#fff" />
              </View>
            )}
          </>
        ) : loading ? (
          <View style={su.placeholder}>
            <ActivityIndicator color={Colors.primary} size="small" />
          </View>
        ) : (
          <View style={su.placeholder}>
            <Icon
              name="camera-plus-outline"
              size={size * 0.3}
              color={Colors.textMuted}
            />
            <Text style={[su.placeholderText, { fontSize: size * 0.12 }]}>
              {placeholder}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {error ? (
        <Text style={su.error} numberOfLines={2}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const su = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  placeholderText: { color: Colors.textMuted, textAlign: "center" },
  error: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 120,
  },
});

// ── Multiple image upload ─────────────────────────────────────────────────────

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder: ImageFolder;
  max?: number;
  style?: ViewStyle;
}

export function MultiImageUpload({
  values,
  onChange,
  folder,
  max = 8,
  style,
}: MultiImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const remaining = max - values.length;
    if (remaining <= 0) return;

    setLoading(true);
    setError(null);
    try {
      const results = await pickAndUploadMultiple(folder, remaining);
      if (results.length > 0) {
        onChange([...values, ...results.map((r) => r.url)].slice(0, max));
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Upload Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = (index: number) =>
    onChange(values.filter((_, i) => i !== index));

  return (
    <View style={style}>
      <View style={mu.grid}>
        {values.map((url, i) => (
          <View key={`${url}-${i}`} style={mu.imageWrap}>
            <Image source={{ uri: url }} style={mu.image} resizeMode="cover" />
            <TouchableOpacity
              style={mu.removeBtn}
              onPress={() => remove(i)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Icon name="close" size={10} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {values.length < max && (
          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading}
            style={mu.addBtn}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <Icon name="plus" size={22} color={Colors.textMuted} />
                <Text style={mu.addText}>Add</Text>
                <Text style={mu.countText}>
                  {values.length}/{max}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={mu.error}>{error}</Text> : null}

      <Text style={mu.hint}>
        JPEG, PNG, WebP · Max 10MB · Up to {max} photos
      </Text>
    </View>
  );
}

const mu = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: Radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 90,
    height: 90,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addText: { color: Colors.textMuted, fontSize: Typography.xs },
  countText: { color: Colors.textMuted, fontSize: 10 },
  error: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
  },
  hint: { color: Colors.textMuted, fontSize: 10, marginTop: Spacing.sm },
});
