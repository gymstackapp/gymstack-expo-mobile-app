import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const C = {
  bg: '#0A0A0A',
  surface: '#1A1A1A',
  border: '#2C2C2E',
  primary: '#FF3B30',
  text: '#FFFFFF',
  textSub: '#8E8E93',
  orange: '#FF9F0A',
  green: '#30D158',
  blue: '#0A84FF',
};

const STATS = [
  { label: 'Workouts', value: '24', icon: 'barbell', color: C.primary, sub: 'This month' },
  { label: 'Streak', value: '7d', icon: 'flame', color: C.orange, sub: 'Personal best: 14d' },
  { label: 'Hours', value: '18.5', icon: 'time', color: C.blue, sub: 'This month' },
  { label: 'Calories', value: '12.4k', icon: 'nutrition', color: C.green, sub: 'This month' },
];

const UPCOMING = [
  { title: 'Chest & Triceps', time: 'Today · 6:00 PM', icon: 'barbell', color: C.primary },
  { title: 'Cardio HIIT', time: 'Tomorrow · 7:00 AM', icon: 'timer', color: C.orange },
  { title: 'Back & Biceps', time: 'Thu · 6:00 PM', icon: 'fitness', color: C.blue },
];

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuBtn}
          >
            <Ionicons name="menu-outline" size={24} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.name ?? 'Member'} 💪</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* Role Badge */}
        <View style={styles.roleBadge}>
          <Ionicons name="body" size={14} color={C.green} />
          <Text style={styles.roleBadgeText}>MEMBER</Text>
        </View>

        {/* Membership Card */}
        <View style={styles.membershipCard}>
          <View>
            <Text style={styles.membershipLabel}>MEMBERSHIP</Text>
            <Text style={styles.membershipPlan}>Premium Plan</Text>
            <Text style={styles.membershipExpiry}>Expires: Dec 31, 2026</Text>
          </View>
          <View style={styles.membershipIconBox}>
            <Ionicons name="shield-checkmark" size={32} color={C.green} />
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {STATS.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.color + '22' }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Upcoming Workouts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Workouts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.upcomingList}>
          {UPCOMING.map(item => (
            <View key={item.title} style={styles.upcomingRow}>
              <View style={[styles.upcomingIconBox, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingTitle}>{item.title}</Text>
                <Text style={styles.upcomingTime}>{item.time}</Text>
              </View>
              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  menuBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 14, color: C.textSub },
  name: { fontSize: 24, fontWeight: '800', color: C.text, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.green + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 20,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 1 },
  membershipCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.green + '44',
  },
  membershipLabel: { fontSize: 10, fontWeight: '700', color: C.green, letterSpacing: 2, marginBottom: 4 },
  membershipPlan: { fontSize: 18, fontWeight: '800', color: C.text },
  membershipExpiry: { fontSize: 12, color: C.textSub, marginTop: 4 },
  membershipIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.green + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },
  statSub: { fontSize: 11, color: C.textSub, marginTop: 4 },
  upcomingList: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  upcomingIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  upcomingTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  upcomingTime: { fontSize: 12, color: C.textSub, marginTop: 2 },
  startBtn: {
    backgroundColor: C.primary + '22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },
});
