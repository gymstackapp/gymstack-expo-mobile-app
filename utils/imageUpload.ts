// mobile/src/utils/imageUpload.ts
// Handles the full flow: pick image from gallery → upload to backend → get Cloudinary URL.
// Uses expo-image-picker for gallery/camera access.
// Never calls Cloudinary directly from mobile — always goes through /api/upload.

import { useAuthStore } from "@/store/authStore";
import * as ImagePicker from "expo-image-picker";

const API_BASE = process.env.API_BASE_URL ?? "http://192.168.1.10:3000";

export type ImageFolder =
  | "avatars"
  | "gymImages"
  | "gymLogos"
  | "supplements"
  | "receipts";

export interface UploadedImage {
  url: string; // Cloudinary HTTPS URL — store this in DB
  publicId: string; // Cloudinary public_id
  width: number;
  height: number;
  bytes: number;
}

// ── Pick from gallery and upload ─────────────────────────────────────────────

export async function pickAndUpload(
  folder: ImageFolder,
  options?: {
    source?: "gallery" | "camera";
    quality?: number; // 0–1, default 0.8
    maxWidth?: number; // kept for API compatibility (not supported by expo-image-picker)
    maxHeight?: number; // kept for API compatibility (not supported by expo-image-picker)
    selectionLimit?: number; // default 1
  },
): Promise<UploadedImage[]> {
  const {
    source = "gallery",
    quality = 0.8,
    selectionLimit = 1,
  } = options ?? {};

  // ── Step 1: Request permissions ────────────────────────────────────────────
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Camera permission is required");
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Photo library permission is required");
    }
  }

  // ── Step 2: Pick image(s) ──────────────────────────────────────────────────
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality,
    allowsMultipleSelection: selectionLimit > 1,
    selectionLimit,
    base64: false, // we stream the file, never use base64
    exif: false,
  };

  const pickerResult =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (pickerResult.canceled || !pickerResult.assets?.length) {
    return []; // User cancelled — not an error
  }

  // ── Step 3: Upload each selected image ─────────────────────────────────────
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.accessToken) throw new Error("Not authenticated");

  const uploaded: UploadedImage[] = [];

  for (const asset of pickerResult.assets) {
    if (!asset.uri) continue;

    // Build multipart form — React Native's fetch handles file:// URIs natively
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: asset.fileName ?? `upload_${Date.now()}.jpg`,
    } as any);

    const res = await fetch(`${API_BASE}/api/upload?folder=${folder}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        // Do NOT set Content-Type manually — React Native sets the boundary automatically
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");

    uploaded.push({
      url: data.url,
      publicId: data.publicId,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    });
  }

  return uploaded;
}

// ── Single image shorthand ────────────────────────────────────────────────────

export async function pickAndUploadSingle(
  folder: ImageFolder,
  source?: "gallery" | "camera",
): Promise<UploadedImage | null> {
  const results = await pickAndUpload(folder, { source, selectionLimit: 1 });
  return results[0] ?? null;
}

// ── Multiple images shorthand ─────────────────────────────────────────────────

export async function pickAndUploadMultiple(
  folder: ImageFolder,
  maxImages = 8,
): Promise<UploadedImage[]> {
  return pickAndUpload(folder, { selectionLimit: maxImages });
}
