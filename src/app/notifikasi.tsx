import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import NotificationCard from '@/components/notifikasi/NotificationCard';
import FilterChips, { NotificationFilter } from '@/components/notifikasi/FilterChips';
import EmptyState from '@/components/notifikasi/EmptyState';
import { api } from '@/lib/api';
import type { AppNotification } from '@/types/api';

// ─── API ───────────────────────────────────────────────────────
async function fetchNotifications(): Promise<AppNotification[]> {
  try {
    const res = await api.get('/notifications', { params: { limit: 50 } });

    // Handle multiple shapes:
    // 1. { data: { data: [...], meta } }     ← backend kamu
    // 2. { data: [...] }
    // 3. [...] (array langsung)
    const raw = res?.data;
    let arr: any = raw?.data?.data ?? raw?.data ?? raw ?? [];
    if (!Array.isArray(arr)) arr = [];
    if (!Array.isArray(arr)) arr = [];

    // Normalize is_read: MySQL 0/1 → boolean
    return arr.map((n: any) => ({
      ...n,
      is_read: Boolean(n?.is_read),
    }));
  } catch (err) {
    console.log('❌ notif fetch error:', err);
    return [];
  }
}

async function markReadAPI(id: number) {
  try {
    const res = await api.put(`/notifications/${id}/read`);
    console.log('✅ mark read:', res.data);
  } catch (err: any) {
    console.log('❌ mark read error:', err?.response?.status);
    throw err;
  }
}

async function markAllReadAPI() {
  try {
    const res = await api.put('/notifications/read-all');
    console.log('✅ mark all read:', res.data);
  } catch (err: any) {
    console.log('❌ mark all error:', err?.response?.status);
    throw err;
  }
}

// ─── Grouping ─────────────────────────────────────────────────
function groupByDay(
  list: AppNotification[]
): { label: string; items: AppNotification[] }[] {
  if (!Array.isArray(list) || list.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const buckets: Record<string, AppNotification[]> = {
    today: [], yesterday: [], week: [], older: [],
  };

  for (const n of list) {
    const d = new Date(n.created_at);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);

    if (day.getTime() === today.getTime()) buckets.today.push(n);
    else if (day.getTime() === yesterday.getTime()) buckets.yesterday.push(n);
    else if (day.getTime() > weekAgo.getTime()) buckets.week.push(n);
    else buckets.older.push(n);
  }

  const out: { label: string; items: AppNotification[] }[] = [];
  if (buckets.today.length) out.push({ label: 'Hari Ini', items: buckets.today });
  if (buckets.yesterday.length) out.push({ label: 'Kemarin', items: buckets.yesterday });
  if (buckets.week.length) out.push({ label: 'Minggu Lalu', items: buckets.week });
  if (buckets.older.length) out.push({ label: 'Lebih Lama', items: buckets.older });
  return out;
}

// ─── Screen ────────────────────────────────────────────────────
export default function NotifikasiScreen() {
  const router = useRouter();

  const [list, setList] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchNotifications();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Load error', err);
      setList([]);
      setError(err?.message || 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Counts ─────────────────────────────────────────────────
  const counts = useMemo(() => {
    const safeList = Array.isArray(list) ? list : [];
    const unread = safeList.filter((n) => !n?.is_read).length;
    return {
      all: safeList.length,
      unread,
      read: safeList.length - unread,
    };
  }, [list]);

  // ─── Filter ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const safeList = Array.isArray(list) ? list : [];
    if (filter === 'unread') return safeList.filter((n) => !n?.is_read);
    if (filter === 'read') return safeList.filter((n) => !!n?.is_read);
    return safeList;
  }, [list, filter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // ─── Actions ────────────────────────────────────────────────
  const handleMarkAsRead = async (id: number) => {
    const target = list.find((n) => n.id === id);
    if (!target || target.is_read) return;

    setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markReadAPI(id);
    } catch {
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    if (!list.some((n) => !n.is_read)) {
      Alert.alert('Info', 'Semua notifikasi sudah dibaca.');
      return;
    }
    setMarkingAll(true);
    const snapshot = list;
    setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllReadAPI();
    } catch {
      setList(snapshot);
      Alert.alert('Gagal', 'Tidak dapat menandai semua notifikasi.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePressCard = (n: AppNotification) => {
    if (!n.is_read) handleMarkAsRead(n.id);
  };

  // ─── Render: Loading ────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.centerText}>Memuat notifikasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header onBack={() => router.back()} onFilterPress={handleMarkAllRead} />

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        }
      >
        {/* Quick actions */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="done-all" size={18} color={Colors.secondary} />
            <Text style={styles.markAllText}>Tandai Semua Dibaca</Text>
          </Pressable>
          <Pressable style={styles.settingsBtn}>
            <MaterialIcons name="settings" size={18} color={Colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Filter chips */}
        <View style={{ paddingHorizontal: Spacing.margin }}>
          <FilterChips active={filter} counts={counts} onChange={setFilter} />
        </View>

        {/* Feed */}
        <View style={{ paddingHorizontal: Spacing.margin, paddingTop: Spacing.md }}>
          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={32} color={Colors.secondary} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => load()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Coba Lagi</Text>
              </Pressable>
            </View>
          ) : grouped.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            grouped.map((section) => (
              <View key={section.label} style={{ marginBottom: 20 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {section.label === 'Hari Ini' && <View style={styles.sectionDot} />}
                </View>

                <View style={{ gap: 10 }}>
                  {section.items.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onPress={() => handlePressCard(n)}
                      onAction={() => handlePressCard(n)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialIcons name="info-outline" size={18} color={Colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.footerText}>
                Semua riwayat notifikasi disimpan dengan aman selama 30 hari.
              </Text>
              <Pressable>
                <Text style={styles.footerLink}>Buka Pusat Bantuan →</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Header ────────────────────────────────────────────────────
function Header({
  onBack,
  onFilterPress,
}: {
  onBack: () => void;
  onFilterPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifikasi</Text>
        </View>

        <View style={styles.headerRight}>
          {onFilterPress && (
            <Pressable
              onPress={onFilterPress}
              hitSlop={8}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="tune" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryContainer },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { color: '#fff', fontFamily: Fonts.regular, fontSize: 13 },

  header: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.margin,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.2,
    marginLeft: 4,
  },

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: 10,
  },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markAllText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.secondary,
  },
  settingsBtn: {
    width: 32, height: 32, borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: Colors.outline,
    textTransform: 'uppercase',
  },
  sectionDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.secondary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    marginTop: 16,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.onSurfaceVariant,
  },
  footerLink: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.primaryContainer,
    marginTop: 6,
  },

  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    marginTop: 6,
  },
  retryText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
});