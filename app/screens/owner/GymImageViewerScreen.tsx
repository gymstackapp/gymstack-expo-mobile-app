import { Colors, Radius, Spacing, Typography } from "@/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function GymImageViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gymName, images, initialIndex = 0 } = route.params as {
    gymName: string;
    images: string[];
    initialIndex?: number;
  };

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{gymName}</Text>
          <Text style={s.headerSub}>{activeIndex + 1} / {images.length}</Text>
        </View>
        {/* spacer to balance back button */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── Image pager ──────────────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={s.page}>
            <Image source={{ uri: item }} style={s.image} resizeMode="contain" />
          </View>
        )}
      />

      {/* ── Dot indicators ───────────────────────────────────────── */}
      {images.length > 1 && (
        <View style={s.dots}>
          {images.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                listRef.current?.scrollToIndex({ index: i, animated: true });
                setActiveIndex(i);
              }}
            >
              <View style={[s.dot, i === activeIndex && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },

  page: {
    width: SCREEN_W,
    height: SCREEN_H - 160,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: SCREEN_W, height: "100%" },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { width: 20, backgroundColor: Colors.primary },
});
