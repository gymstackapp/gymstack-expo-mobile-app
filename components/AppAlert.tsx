import { Colors, Radius, Shadows, Spacing, Typography } from "@/theme";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

// ── Singleton handler ─────────────────────────────────────────────────────────

let _handler: ((title: string, message?: string, buttons?: AlertButton[]) => void) | null = null;

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  _handler?.(title, message, buttons);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({ title: "", buttons: [] });

  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Register the global handler on mount
  useEffect(() => {
    _handler = (title, message, buttons = [{ text: "OK" }]) => {
      setConfig({ title, message, buttons });
      setVisible(true);
    };
    return () => {
      _handler = null;
    };
  }, []);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 280,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  const dismiss = () => setVisible(false);

  const handlePress = (btn: AlertButton) => {
    dismiss();
    btn.onPress?.();
  };

  const cancelBtn = config.buttons.find((b) => b.style === "cancel");
  const actionBtns = config.buttons.filter((b) => b.style !== "cancel");
  const totalBtns = config.buttons.length;

  // Layout: 2 buttons → side by side; 1 or 3+ → stacked
  const isRow = totalBtns === 2;

  const renderBtn = (btn: AlertButton, index: number) => {
    const isDestructive = btn.style === "destructive";
    const isCancel = btn.style === "cancel";

    return (
      <TouchableOpacity
        key={index}
        style={[
          s.btn,
          isRow ? s.btnFlex : s.btnFull,
          isDestructive && s.btnDestructive,
          isCancel && s.btnCancel,
          !isDestructive && !isCancel && s.btnDefault,
        ]}
        onPress={() => handlePress(btn)}
        activeOpacity={0.72}
      >
        <Text
          style={[
            s.btnText,
            isDestructive && s.btnTextDestructive,
            isCancel && s.btnTextCancel,
            !isDestructive && !isCancel && s.btnTextDefault,
          ]}
        >
          {btn.text}
        </Text>
      </TouchableOpacity>
    );
  };

  // Order: action buttons first, cancel last
  const orderedBtns = isRow
    ? [cancelBtn, ...actionBtns].filter(Boolean)
    : [...actionBtns, cancelBtn].filter(Boolean);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={s.overlay}>
        <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
          {/* Title */}
          <Text style={s.title}>{config.title}</Text>

          {/* Message */}
          {config.message ? (
            <Text style={s.message}>{config.message}</Text>
          ) : null}

          {/* Divider */}
          <View style={s.divider} />

          {/* Buttons */}
          <View style={[s.btnContainer, isRow ? s.btnRow : s.btnCol]}>
            {orderedBtns.map((btn, i) => renderBtn(btn!, i))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  btnContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  btnRow: {
    flexDirection: "row",
  },
  btnCol: {
    flexDirection: "column",
  },
  btn: {
    height: 46,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  btnFlex: {
    flex: 1,
  },
  btnFull: {
    width: "100%",
  },
  btnDefault: {
    backgroundColor: Colors.primary,
  },
  btnDestructive: {
    backgroundColor: Colors.errorFaded,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  btnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  btnTextDefault: {
    color: "#fff",
  },
  btnTextDestructive: {
    color: Colors.error,
  },
  btnTextCancel: {
    color: Colors.textSecondary,
  },
});
