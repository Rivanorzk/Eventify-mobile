import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import SearchBar from '@/components/riwayat/SearchBar';
import FilterPills, { FilterKey } from '@/components/riwayat/FilterPills';
import OrderCard from '@/components/riwayat/OrderCard';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Order } from '@/types/api';

// ─── API ───────────────────────────────────────────────────────
async function fetchMyOrders(): Promise<Order[]> {
  const res = await api.get('/orders/my-orders');
  return res.data.data ?? [];
}

// ─── Variant mapping ──────────────────────────────────────────
function variantOf(order: Order): 'pending' | 'completed' | 'archive' {
  const s = order.status?.toLowerCase();
  if (s === 'pending') return 'pending';
  if (s === 'paid') {
    const ev = order.event_date ? new Date(order.event_date).getTime() : 0;
    if (ev && ev < Date.now() - 24 * 3600 * 1000) return 'archive';
    return 'completed';
  }
  return 'archive'; // cancelled/expired masuk arsip juga
}

export default function RiwayatScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Load orders error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const counts = useMemo(() => {
    const pending = orders.filter((o) => variantOf(o) === 'pending').length;
    const paid = orders.filter((o) => variantOf(o) === 'completed').length;
    const cancelled = orders.filter(
      (o) => o.status?.toLowerCase() === 'cancelled'
    ).length;
    return { all: orders.length, pending, paid, cancelled };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    let list = orders;

    // Filter by tab
    if (filter === 'pending') list = list.filter((o) => variantOf(o) === 'pending');
    else if (filter === 'paid') list = list.filter((o) => variantOf(o) === 'completed');
    else if (filter === 'cancelled')
      list = list.filter((o) => o.status?.toLowerCase() === 'cancelled');

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.event_title?.toLowerCase().includes(q) ||
          o.invoice_number?.toLowerCase().includes(q) ||
          o.event_location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Memuat riwayat pesanan...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={Colors.primaryContainer}
            colors={[Colors.primaryContainer]}
          />
        ),
      }}
    >
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ARSIP & TIKET</Text>
        <Text style={styles.title}>Riwayat Pemesanan</Text>
        <Text style={styles.subtitle}>
          Kelola transaksi, e-receipt, dan kenangan konser Anda.
        </Text>
      </View>

      {/* Search & year */}
      <View style={styles.section}>
        <SearchBar value={search} onChangeText={setSearch} year="2025" />
      </View>

      {/* Filter pills */}
      <View style={styles.section}>
        <FilterPills
          filters={[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu Pembayaran', count: counts.pending },
            { key: 'paid', label: 'Selesai', count: counts.paid },
            { key: 'cancelled', label: 'Dibatalkan', count: counts.cancelled },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </View>

      {/* Orders list */}
      <View style={{ gap: 16 }}>
        {visibleOrders.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={40} color={Colors.outline} />
            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptySub}>
              Anda belum memiliki pesanan pada filter ini.
            </Text>
          </View>
        )}

        {visibleOrders.map((order) => {
          const v = variantOf(order);
          return (
            <OrderCard
              key={order.id}
              order={order}
              variant={v}
              onPress={() => router.push(`/orders/${order.id}` as Href)}
              onPrimaryAction={() => {
                if (v === 'pending') {
                  // redirect ke pembayaran
                  router.push(`/payment/${order.id}` as Href);
                } else if (v === 'completed') {
                  router.push(`/(tabs)/tiket` as Href);
                } else {
                  router.push(`/orders/${order.id}` as Href);
                }
              }}
              onSecondaryAction={() => router.push(`/orders/${order.id}` as Href)}
            />
          );
        })}
      </View>

      {/* Footer notice */}
      <View style={styles.footerNote}>
        <MaterialIcons name="verified-user" size={15} color={Colors.secondary} />
        <Text style={styles.footerText}>
          Semua transaksi & e-ticket dilindungi enkripsi Eventify SafePass™
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },

  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.primaryContainer,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },

  section: { marginBottom: Spacing.md },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.onSurface,
    marginTop: 4,
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    flexShrink: 1,
  },
});