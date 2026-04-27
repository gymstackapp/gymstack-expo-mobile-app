import { discoverApi, memberGymReviewsApi } from "@/api/endpoints";
import { Avatar, Card, Header } from "@/components";
import ImageCarousel from "@/components/ImageCarousel";
import { Skeleton } from "@/components/Skeleton";
import { Colors, Radius, Spacing, Typography } from "@/theme";
import { DiscoverGym, GymReview } from "@/types/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ── Star rating component ──────────────────────────────────────────────────────

function StarRow({
  rating,
  size = 16,
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

// ── Single review card ─────────────────────────────────────────────────────────

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
          size={36}
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
            <StarRow rating={review.rating} size={13} />
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

  React.useEffect(() => {
    if (visible) {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? "");
    }
  }, [visible, existing]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => memberGymReviewsApi.submit(gymId, { rating, comment }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) => {
      Alert.alert("Error", e?.message ?? "Failed to submit review");
    },
  });

  const canSubmit = rating >= 1 && rating <= 5 && !isPending;

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

// ── Reviews section ────────────────────────────────────────────────────────────

function ReviewsSection({
  gym,
  onWriteReview,
}: {
  gym: DiscoverGym;
  onWriteReview: () => void;
}) {
  const hasReviews = gym.recentReviews?.length > 0;
  const avg = Number(gym.averageRating ?? 0);
  const total = gym.totalReviews ?? 0;

  return (
    <Card>
      <View style={rs.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={rs.title}>Reviews</Text>
          {total > 0 && (
            <View style={rs.ratingRow}>
              <Text style={rs.avgScore}>{avg.toFixed(1)}</Text>
              <StarRow rating={Math.round(avg)} size={14} />
              <Text style={rs.totalTxt}>({total})</Text>
            </View>
          )}
        </View>
        {gym.isEnrolled && (
          <TouchableOpacity style={rs.writeBtn} onPress={onWriteReview}>
            <Icon name="pencil-outline" size={14} color={Colors.primary} />
            <Text style={rs.writeTxt}>
              {gym.myReview ? "Edit Review" : "Write Review"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {hasReviews ? (
        <View style={{ marginTop: Spacing.sm }}>
          {gym.recentReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </View>
      ) : (
        <View style={rs.empty}>
          <Icon name="star-outline" size={28} color={Colors.border} />
          <Text style={rs.emptyTxt}>No reviews yet. Be the first!</Text>
        </View>
      )}
    </Card>
  );
}

const rs = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  avgScore: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: "800",
  },
  totalTxt: { color: Colors.textMuted, fontSize: Typography.xs },
  writeBtn: {
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
  writeTxt: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyTxt: { color: Colors.textMuted, fontSize: Typography.sm },
});

// ── Main screen ────────────────────────────────────────────────────────────────

const GymDetailScreen = () => {
  const qc = useQueryClient();
  const navigation = useNavigation();
  const route = useRoute();
  const { gymId } = route.params as { gymId: string };
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const {
    data: gym,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<DiscoverGym>({
    queryKey: ["gym", gymId],
    queryFn: () => discoverApi.getGym(gymId) as Promise<DiscoverGym>,
    enabled: !!gymId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.lg }}>
          <Header title="Gym Details" back />
          <Skeleton height={300} />
        </View>
      </SafeAreaView>
    );
  }

  if (!gym) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={{ flex: 1, padding: Spacing.lg }}>
        <Header title={gym?.name} subtitle={gym?.city ?? undefined} back />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.cover}>
            <ImageCarousel images={gym?.gymImages ?? []} height={300} />
          </View>

          {/* Gym info */}
          <Card>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                  flexWrap: "wrap",
                }}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {gym.name}
                </Text>
                {gym.isEnrolled && (
                  <View style={styles.enrolledBadge}>
                    <Icon
                      name="check-circle"
                      size={14}
                      color={Colors.success}
                    />
                    <Text style={styles.enrolledText}>Active Member</Text>
                  </View>
                )}
              </View>
              {gym.city && (
                <View style={styles.cityRow}>
                  <Icon
                    name="map-marker-outline"
                    size={12}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.city}>
                    {[gym.address, gym.city, gym.state]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              )}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Icon name="phone-outline" size={13} color={Colors.success} />
                  <Text style={styles.enrolledText}>{gym.contactNumber}</Text>
                </View>
                {Number(gym.averageRating) > 0 && (
                  <View style={styles.metaItem}>
                    <Icon name="star" size={13} color="#F59E0B" />
                    <Text style={styles.metaText}>
                      {Number(gym.averageRating).toFixed(1)} ({gym.totalReviews}
                      )
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Owner */}
          <Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: Spacing.sm,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                }}
              >
                <Avatar
                  name={gym.owner.fullName}
                  url={gym.owner.avatarUrl}
                  size={44}
                />
                <View>
                  <Text style={styles.metaText}>Gym Owner</Text>
                  <Text style={styles.name}>{gym.owner.fullName}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.enrolledBadge}
                onPress={() => {
                  if (gym.owner.mobileNumber)
                    Linking.openURL(`tel:${gym.owner.mobileNumber}`);
                }}
                disabled={!gym.owner.mobileNumber}
              >
                <Icon name="phone-outline" size={13} color={Colors.success} />
                <Text style={styles.enrolledText}>Call Owner</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Membership Plans */}
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Membership Plans
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.membershipPlans.map((plan: any) => (
                  <View
                    key={plan.id}
                    style={{
                      width: "100%",
                      paddingVertical: Spacing.lg,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.surfaceRaised,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: "row",
                      }}
                    >
                      <Text
                        style={{
                          color: Colors.textPrimary,
                          fontSize: Typography.lg,
                          fontWeight: Typography.semibold,
                        }}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: Typography.lg,
                          fontWeight: Typography.semibold,
                          color: Colors.primary,
                        }}
                      >
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <Text
                      style={{
                        marginVertical: Spacing.xs,
                        color: Colors.textSecondary,
                        fontSize: Typography.lg,
                        fontWeight: Typography.regular,
                      }}
                    >
                      {plan.durationMonths} month
                      {plan.durationMonths > 1 ? "s" : ""}
                    </Text>
                    {plan.features.slice(0, 4).map((feature: string) => (
                      <View
                        key={feature}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          marginVertical: Spacing.xs,
                        }}
                      >
                        <Icon
                          name="star-outline"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text
                          style={{
                            color: Colors.textSecondary,
                            fontSize: Typography.sm,
                            fontWeight: Typography.regular,
                          }}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Services */}
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Services
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.services.map((ser: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.primaryFaded,
                      borderRadius: Radius.full,
                    }}
                  >
                    <Text
                      style={{ color: Colors.primary, fontSize: Typography.sm }}
                    >
                      {ser}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Facilities */}
          <Card>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                Facilities
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.lg,
                  marginVertical: Spacing.lg,
                }}
              >
                {gym.facilities.map((fac: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor: Colors.primaryFaded,
                      borderRadius: Radius.full,
                    }}
                  >
                    <Text
                      style={{ color: Colors.primary, fontSize: Typography.sm }}
                    >
                      {fac}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Reviews */}
          <ReviewsSection
            gym={gym}
            onWriteReview={() => setReviewModalOpen(true)}
          />
        </ScrollView>
      </View>

      <ReviewModal
        visible={reviewModalOpen}
        gymId={gymId}
        existing={gym.myReview}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["gym", gymId] })}
      />
    </SafeAreaView>
  );
};

export default GymDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40, gap: Spacing.md },
  cover: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
    flex: 1,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successFaded,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  enrolledText: { color: Colors.success, fontSize: 10, fontWeight: "700" },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: Spacing.md,
  },
  city: { color: Colors.textMuted, fontSize: Typography.xs },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginVertical: Spacing.sm,
    alignItems: "center",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: Typography.xs },
});
