// mobile/src/theme/index.ts
// Mirrors the web design system — same brand colors, same dark palette

import { StyleSheet } from "react-native";

export const Colors = {
  // Brand
  primary: "#f97316", // orange-500
  primaryLight: "#fb923c", // orange-400
  primaryDark: "#ea580c", // orange-600
  primaryFaded: "rgba(249,115,22,0.12)",

  // Background layers (dark theme)
  bg: "#0e1117", // hsl(220 25% 6%)
  surface: "#141920", // hsl(220 25% 9%)
  surfaceRaised: "#1a2030", // hsl(220 25% 11%)
  border: "rgba(255,255,255,0.08)",
  borderFocused: "rgba(249,115,22,0.50)",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.35)",
  textDisabled: "rgba(255,255,255,0.20)",

  // Semantic
  success: "#22c55e",
  successFaded: "rgba(34,197,94,0.12)",
  warning: "#eab308",
  warningFaded: "rgba(234,179,8,0.12)",
  error: "#ef4444",
  errorFaded: "rgba(239,68,68,0.12)",
  info: "#3b82f6",
  infoFaded: "rgba(59,130,246,0.12)",

  // Plan colors
  purple: "#a855f7",
  purpleFaded: "rgba(168,85,247,0.12)",
  yellow: "#eab308",
  yellowFaded: "rgba(234,179,8,0.12)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,

  // Weights
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Common reusable styles
export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  cardRaised: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  textPrimary: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  textSecondary: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  textMuted: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
