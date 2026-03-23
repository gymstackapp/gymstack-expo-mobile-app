// mobile/src/components/common/Header.tsx
// Reusable page header with optional back button and right action slot.
import { Colors, Spacing, Typography } from "@/theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface HeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean; // show back arrow
  menu?: boolean; // show hamburger icon that opens the drawer
  onBack?: () => void; // override default navigation.goBack()
  right?: React.ReactNode; // right-side action slot (button, icon, etc.)
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  back,
  menu,
  onBack,
  right,
  style,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={[styles.row, style]}>
      {/* Hamburger / back button */}
      {menu ? (
        <TouchableOpacity
          onPress={handleMenu}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="menu" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : back ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : null}

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right slot */}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 38,
    height: 38,
    // borderRadius: Radius.md,
    // backgroundColor: Colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    lineHeight: Typography.xxl * 1.2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  right: {
    flexShrink: 0,
  },
});
