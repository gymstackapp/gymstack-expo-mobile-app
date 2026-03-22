// mobile/src/components/common/Skeleton.tsx
// Animated shimmer placeholder — used while data is fetching.
// Exports:
//   Skeleton       — single animated block, fully configurable
//   SkeletonGroup  — renders multiple skeletons in common layout patterns

import { Colors, Radius, Spacing } from "@/theme";
import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — single animated placeholder block
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: number | `${number}%` | "100%";
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height,
  radius,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1, // repeat forever
      true, // reverse (ping-pong)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        s.block,
        {
          width: width as any,
          height,
          borderRadius: radius ?? Radius.md,
        },
        animStyle,
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonGroup — composable layout patterns
//
// Usage:
//   <SkeletonGroup />                          — 3 plain rows (default)
//   <SkeletonGroup count={5} itemHeight={64} />
//   <SkeletonGroup variant="card" />           — card blocks
//   <SkeletonGroup variant="listRow" />        — avatar + two text lines
//   <SkeletonGroup variant="statGrid" />       — 2×2 stat cards
//   <SkeletonGroup variant="profileHeader" />  — avatar + name + badge
// ─────────────────────────────────────────────────────────────────────────────

type SkeletonVariant =
  | "plain" // simple full-width rectangles
  | "card" // rounded card blocks
  | "listRow" // avatar circle + two text lines
  | "statGrid" // 2-column stat card grid
  | "profileHeader" // large avatar + name line + subtitle line
  | "tableRow"; // three columns in a row

interface SkeletonGroupProps {
  variant?: SkeletonVariant;
  count?: number; // how many items to render
  itemHeight?: number; // height of each item (for plain/card/listRow)
  gap?: number; // vertical gap between items (default Spacing.sm)
  style?: ViewStyle;
}

export function SkeletonGroup({
  variant = "plain",
  count = 3,
  itemHeight = 70,
  gap = Spacing.sm,
  style,
}: SkeletonGroupProps) {
  // ── plain ──────────────────────────────────────────────────────────────────
  if (variant === "plain") {
    return (
      <View style={[{ gap }, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={itemHeight} />
        ))}
      </View>
    );
  }

  // ── card ───────────────────────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <View style={[{ gap }, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={itemHeight} radius={Radius.xl} />
        ))}
      </View>
    );
  }

  // ── listRow — avatar circle + two text lines ───────────────────────────────
  if (variant === "listRow") {
    return (
      <View style={[{ gap }, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={s.rowWrap}>
            {/* Avatar */}
            <Skeleton
              width={44}
              height={44}
              radius={22}
              style={{ flexShrink: 0 }}
            />
            {/* Text lines */}
            <View style={s.rowLines}>
              <Skeleton height={14} width="65%" radius={Radius.sm} />
              <Skeleton
                height={11}
                width="45%"
                radius={Radius.sm}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // ── statGrid — 2-column grid of stat cards ─────────────────────────────────
  if (variant === "statGrid") {
    // count controls how many cells (default 4 = 2 rows × 2 cols)
    const cells = count;
    return (
      <View style={[s.grid, style]}>
        {Array.from({ length: cells }).map((_, i) => (
          <Skeleton
            key={i}
            height={itemHeight}
            radius={Radius.xl}
            style={s.gridCell}
          />
        ))}
      </View>
    );
  }

  // ── profileHeader ──────────────────────────────────────────────────────────
  if (variant === "profileHeader") {
    return (
      <View style={[s.profileHeader, style]}>
        {/* Large avatar */}
        <Skeleton width={72} height={72} radius={36} />
        {/* Name + role */}
        <View style={s.profileLines}>
          <Skeleton height={18} width="50%" radius={Radius.sm} />
          <Skeleton
            height={13}
            width="30%"
            radius={Radius.full}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            height={11}
            width="40%"
            radius={Radius.sm}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    );
  }

  // ── tableRow — three columns ───────────────────────────────────────────────
  if (variant === "tableRow") {
    return (
      <View style={[{ gap }, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={s.tableRow}>
            <Skeleton height={14} style={{ flex: 2 }} radius={Radius.sm} />
            <Skeleton height={14} style={{ flex: 1 }} radius={Radius.sm} />
            <Skeleton height={14} style={{ flex: 1 }} radius={Radius.sm} />
          </View>
        ))}
      </View>
    );
  }

  // Fallback to plain
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={itemHeight} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  block: {
    backgroundColor: Colors.surfaceRaised,
  },
  // listRow
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowLines: {
    flex: 1,
    gap: 0,
  },
  // statGrid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gridCell: {
    // flex 1 in a 2-column wrap — each cell takes ~half width minus gap
    flexBasis: "48%",
    flexGrow: 1,
  },
  // profileHeader
  profileHeader: {
    alignItems: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  profileLines: {
    alignItems: "center",
    gap: 0,
  },
  // tableRow
  tableRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
});
