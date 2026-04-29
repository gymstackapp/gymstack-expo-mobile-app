import { api } from "@/api/client";
import { Colors, Radius, Typography } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const POLL_MS = 60_000;

export function NotificationBell() {
  const navigation = useNavigation<any>();
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const data = await api.get<{ count: number }>("/api/notifications/unread-count");
      setCount(data?.count ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetch();
    timer.current = setInterval(fetch, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.wrap}
    >
      <Icon
        name={count > 0 ? "bell-ring" : "bell-outline"}
        size={24}
        color={count > 0 ? Colors.primary : Colors.textSecondary}
      />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: Typography.bold,
    lineHeight: 11,
  },
});
