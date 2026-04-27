// app/screens/trainer/DiscoverGymDetailScreen.tsx
// Gym detail page for trainers in the discover flow.

import { trainerDiscoverApi, trainerGymReviewsApi } from "@/api/endpoints";
import { Avatar, Card, Header } from "@/components";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { GymReview } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SW } = Dimensions.get("window");

// ── Image carousel ─────────────────────────────────────────────────────────────

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length < 2) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      3500,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length]);

  const go = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + images.length) % images.length);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      3500,
    );
  };

  if (images.length === 0) {
    return (
      <View style={ic.placeholder}>
        <Icon name="image-outline" size={40} color={Colors.border} />
        <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>
          No gym photos
        </Text>
      </View>
    );
  }

  return (
    <View style={ic.wrap}>
      <Image
        source={{ uri: images[idx] }}
        style={ic.image}
        resizeMode="cover"
      />
      {images.length > 1 && (
        <>
          <TouchableOpacity
            style={[ic.arrow, { left: 12 }]}
            onPress={() => go(-1)}
          >
            <Icon name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[ic.arrow, { right: 12 }]}
            onPress={() => go(1)}
          >
            <Icon name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={ic.dots}>
            {images.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setIdx(i)}
                style={[ic.dot, i === idx && ic.dotActive]}
              />
            ))}
          </View>
          <View style={ic.counter}>
            <Text style={ic.counterTxt}>
              {idx + 1}/{images.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const ic = StyleSheet.create({
  wrap: { height: 220, backgroundColor: Colors.surfaceRaised },
  placeholder: {
    height: 180,
    backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  image: { width: "100%", height: "100%" },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },
  counter: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterTxt: { color: "#fff", fontSize: 11 },
});

// ── Star rating ────────────────────────────────────────────────────────────────

function StarRow({
  rating,
  size = 14,
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => onRate?.(star)}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Icon
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? "#F59E0B" : Colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Review card ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: GymReview }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <View style={rv.card}>
      <View style={rv.header}>
        <Avatar
          name={review.profile.fullName}
          url={review.profile.avatarUrl}
          size={34}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={rv.name}>{review.profile.fullName}</Text>
            <Text style={rv.date}>{date}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
              marginTop: 2,
            }}
          >
            <StarRow rating={review.rating} size={12} />
            <Text style={rv.roleBadge}>
              {review.role === "trainer" ? "Trainer" : "Member"}
            </Text>
          </View>
        </View>
      </View>
      {review.comment ? <Text style={rv.comment}>{review.comment}</Text> : null}
    </View>
  );
}

const rv = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  date: { color: Colors.textMuted, fontSize: Typography.xs },
  roleBadge: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  comment: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
});

// ── Review modal ───────────────────────────────────────────────────────────────

function ReviewModal({
  visible,
  gymId,
  existing,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  gymId: string;
  existing: GymReview | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");

  useEffect(() => {
    if (visible) {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? "");
    }
  }, [visible, existing]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => trainerGymReviewsApi.submit(gymId, { rating, comment }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) =>
      Alert.alert("Error", e?.message ?? "Failed to submit review"),
  });

  const canSubmit = rating >= 1 && !isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={mo.overlay}>
        <View style={mo.sheet}>
          <View style={mo.handle} />
          <Text style={mo.title}>
            {existing ? "Update Review" : "Write a Review"}
          </Text>
          <Text style={mo.subtitle}>Rate your experience at this gym</Text>
          <View style={mo.starsWrap}>
            <StarRow rating={rating} size={36} interactive onRate={setRating} />
            {rating > 0 && (
              <Text style={mo.ratingLabel}>
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </Text>
            )}
          </View>
          <TextInput
            style={mo.input}
            placeholder="Share your experience (optional)"
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={mo.charCount}>{comment.length}/500</Text>
          <View style={mo.actions}>
            <TouchableOpacity style={mo.cancelBtn} onPress={onClose}>
              <Text style={mo.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mo.submitBtn, !canSubmit && mo.submitDisabled]}
              onPress={() => canSubmit && mutate()}
              disabled={!canSubmit}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={mo.submitTxt}>
                  {existing ? "Update" : "Submit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 16,
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: "center",
  },
  starsWrap: { alignItems: "center", gap: Spacing.sm },
  ratingLabel: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    textAlignVertical: "top",
    minHeight: 90,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "right",
  },
  actions: { flexDirection: "row", gap: Spacing.md },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelTxt: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitTxt: { color: "#fff", fontSize: Typography.sm, fontWeight: "700" },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export function DiscoverGymDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { gymId } = route.params ?? {};
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data: gym, isLoading } = useQuery<any>({
    queryKey: ["trainerDiscoverGym", gymId],
    queryFn: () => trainerDiscoverApi.getGym(gymId),
    enabled: !!gymId,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.headerWrap}>
          <Header title="Gym Details" back />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym || gym.error) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.headerWrap}>
          <Header title="Gym Details" back />
        </View>
        <View style={s.center}>
          <Icon
            name="office-building-outline"
            size={48}
            color={Colors.border}
          />
          <Text style={s.notFoundTxt}>Gym not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: Colors.primary, fontSize: Typography.sm }}>
              ← Back to Discover
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const contactNumber = gym.contactNumber || gym.owner?.mobileNumber;
  const avg = Number(gym.averageRating ?? 0);
  const totalReviews: number = gym.totalReviews ?? 0;
  const recentReviews: GymReview[] = gym.recentReviews ?? [];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerWrap}>
        <Header title={gym.name} back />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ImageCarousel images={gym.gymImages ?? []} />

        <View style={s.content}>
          {/* Gym info */}
          <Card style={{ gap: Spacing.md }}>
            <View style={s.gymNameRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.sm,
                    flexWrap: "wrap",
                  }}
                >
                  <Text style={s.gymName}>{gym.name}</Text>
                  {gym.isJoined && (
                    <View style={s.joinedBadge}>
                      <Icon
                        name="check-circle-outline"
                        size={12}
                        color={Colors.success}
                      />
                      <Text style={s.joinedTxt}>Joined Gym</Text>
                    </View>
                  )}
                </View>
                <Text style={s.gymAddress}>
                  <Icon
                    name="map-marker-outline"
                    size={12}
                    color={Colors.textMuted}
                  />{" "}
                  {[gym.address, gym.city, gym.state]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
              {contactNumber && (
                <TouchableOpacity
                  style={s.callBtn}
                  onPress={() => Linking.openURL(`tel:${contactNumber}`)}
                >
                  <Icon name="phone-outline" size={16} color={Colors.success} />
                  <Text style={s.callTxt}>Call</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={s.statsRow}>
              <View style={s.statCell}>
                <Icon
                  name="account-tie-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={s.statVal}>{gym._count?.trainers ?? 0}</Text>
                <Text style={s.statLabel}>Trainers</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCell}>
                <Icon
                  name="account-group-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={s.statVal}>{gym._count?.members ?? 0}</Text>
                <Text style={s.statLabel}>Members</Text>
              </View>
              {avg > 0 && (
                <>
                  <View style={s.statDivider} />
                  <View style={s.statCell}>
                    <Icon name="star" size={16} color="#F59E0B" />
                    <Text style={s.statVal}>{avg.toFixed(1)}</Text>
                    <Text style={s.statLabel}>{totalReviews} reviews</Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Owner */}
          {gym.owner && (
            <Card>
              <View style={s.ownerRow}>
                <Avatar
                  name={gym.owner.fullName}
                  url={gym.owner.avatarUrl}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.ownerLabel}>Gym Owner</Text>
                  <Text style={s.ownerName}>{gym.owner.fullName}</Text>
                </View>
                {gym.owner.mobileNumber && (
                  <TouchableOpacity
                    style={s.ownerCallBtn}
                    onPress={() =>
                      Linking.openURL(`tel:${gym.owner.mobileNumber}`)
                    }
                  >
                    <Icon
                      name="phone-outline"
                      size={15}
                      color={Colors.success}
                    />
                    <Text style={s.ownerCallTxt}>Call Owner</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          {/* Services */}
          {gym.services?.length > 0 && (
            <Card>
              <Text style={s.sectionTitle}>Services</Text>
              <View style={s.tagWrap}>
                {gym.services.map((sv: string) => (
                  <View key={sv} style={s.serviceTag}>
                    <Text style={s.serviceTagTxt}>{sv}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Facilities */}
          {gym.facilities?.length > 0 && (
            <Card>
              <Text style={s.sectionTitle}>Facilities</Text>
              <View style={s.tagWrap}>
                {gym.facilities.map((f: string) => (
                  <View key={f} style={s.facilityTag}>
                    <Text style={s.facilityTagTxt}>{f}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <View style={s.reviewsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Reviews</Text>
                {avg > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.xs,
                      marginTop: 4,
                    }}
                  >
                    <Text style={s.avgScore}>{avg.toFixed(1)}</Text>
                    <StarRow rating={Math.round(avg)} size={13} />
                    <Text style={s.totalReviewsTxt}>({totalReviews})</Text>
                  </View>
                )}
              </View>
              {gym.isJoined && (
                <TouchableOpacity
                  style={s.writeReviewBtn}
                  onPress={() => setReviewModalOpen(true)}
                >
                  <Icon
                    name="pencil-outline"
                    size={13}
                    color={Colors.primary}
                  />
                  <Text style={s.writeReviewTxt}>
                    {gym.myReview ? "Edit Review" : "Write Review"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {recentReviews.length > 0 ? (
              <View style={{ marginTop: Spacing.sm }}>
                {recentReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </View>
            ) : (
              <View style={s.reviewsEmpty}>
                <Icon name="star-outline" size={28} color={Colors.border} />
                <Text style={s.reviewsEmptyTxt}>
                  No reviews yet. Be the first!
                </Text>
              </View>
            )}
          </Card>

          {!gym.isJoined && (
            <Text style={s.hint}>
              To join this gym as a trainer, contact the gym owner directly.
            </Text>
          )}
        </View>
      </ScrollView>

      <ReviewModal
        visible={reviewModalOpen}
        gymId={gymId}
        existing={gym.myReview ?? null}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={() =>
          qc.invalidateQueries({ queryKey: ["trainerDiscoverGym", gymId] })
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  notFoundTxt: { color: Colors.textMuted, fontSize: Typography.base },
  content: { padding: Spacing.lg, gap: Spacing.md },
  gymNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  gymName: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  gymAddress: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  joinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  joinedTxt: { color: Colors.success, fontSize: 10, fontWeight: "700" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.success + "30",
  },
  callTxt: {
    color: Colors.success,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  statCell: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statVal: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "700",
  },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  ownerLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  ownerName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "600",
    marginTop: 2,
  },
  ownerCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  ownerCallTxt: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  serviceTag: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + "25",
  },
  serviceTagTxt: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
  facilityTag: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  facilityTagTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  avgScore: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  totalReviewsTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  writeReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  writeReviewTxt: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  reviewsEmpty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  reviewsEmptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
  hint: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
});
