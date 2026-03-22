// mobile/src/components/common/Input.tsx
import { Colors, Radius, Spacing, Typography } from "@/theme";
import React, { forwardRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string; // helper text below the field
  password?: boolean; // auto-adds show/hide eye button
  leftIcon?: string; // MaterialCommunityIcons name
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    password,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = !!error;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.box, hasError && styles.boxError]}>
        {leftIcon ? (
          <Icon
            name={leftIcon}
            size={18}
            color={Colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          style={[styles.input, style as any]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={password && !showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />

        {/* Password toggle */}
        {password ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.rightBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightBtn}
            disabled={!onRightIconPress}
          >
            <Icon name={rightIcon} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  boxError: {
    borderColor: Colors.error,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    // Remove default Android underline
    paddingVertical: 0,
  },
  rightBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: 5,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 5,
  },
});
