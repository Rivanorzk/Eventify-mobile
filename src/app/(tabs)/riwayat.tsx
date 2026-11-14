// Riwayat.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
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

// Helper tanggal
function parseTime(v?: string | null): number | null {
  if (!v) return null;
  // "2026-11-03 14:57:00" (format MySQL) → "2026-11-03T14:57:00"
  const iso = v.includes(' ') && !v.includes('T') ? v.replace(' ', 'T') : v;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

const isCancelledLike = (o: Order) => {
  const s = o.status?.toLowerCase();
  return s === 'cancelled' || s === 'expired';
};

function yearOf(o: Order): number | null {
  // Pakai tanggal konser; kalau kosong, cadangannya tanggal pesanan dibuat
  const t = parseTime(o.event_date) ?? parseTime(o.created_at);
  return t === null ? null : new Date(t).getFullYear();
}

// ─── Variant mapping ──────────────────────────────────────────
function variantOf(order: Order): 'pending' | 'completed' | 'archive' | 'cancelled' {
  const s = order.status?.toLowerCase();
  if (s === 'pending') return 'pending';
  if (s === 'paid') {
    const ev = order.event_date ? new Date(order.event_date).getTime() : 0;
    if (ev && ev < Date.now() - 24 * 3600 * 1000) return 'archive';
    return 'completed';
  }
  return 'cancelled'; // cancelled/expired masuk arsip juga
}

type YearFilter = number | 'all';

export default function RiwayatScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [year, setYear] = useState<YearFilter>('all');
  const [yearModal, setYearModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Load orders error', err);
      setLoadError('Riwayat pesanan gagal dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const hasLoaded = useRef(false);

  useFocusEffect(
    useCallback(() => {
      loadOrders(hasLoaded.current);  // pertama: layar loading penuh; berikutnya: refresh halus
      hasLoaded.current = true;
    }, [loadOrders])
  );

  const normalized = orders;

  // Daftar tahun dinamis: dari data pesanan + tahun berjalan
  const years = useMemo(() => {
    const set = new Set<number>();
    normalized.forEach((o) => {
      const y = yearOf(o);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [normalized]);

  const yearOrders = useMemo(
    () => (year === 'all' ? normalized : normalized.filter((o) => yearOf(o) === year)),
    [normalized, year]
  );

  const counts = useMemo(() => {
    const pending = yearOrders.filter((o) => variantOf(o) === 'pending').length;
    const paid = yearOrders.filter((o) => variantOf(o) === 'completed').length;
    const cancelled = yearOrders.filter(isCancelledLike).length;
    return { all: yearOrders.length, pending, paid, cancelled };
  }, [yearOrders]);

  const visibleOrders = useMemo(() => {
    let list = yearOrders;

    if (filter === 'pending') list = list.filter((o) => variantOf(o) === 'pending');
    else if (filter === 'paid') list = list.filter((o) => variantOf(o) === 'completed');
    else if (filter === 'cancelled') list = list.filter(isCancelledLike);

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
  }, [yearOrders, filter, search]);

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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ARSIP & TIKET</Text>
        <Text style={styles.title}>Riwayat Pemesanan</Text>
        <Text style={styles.subtitle}>
          Kelola transaksi, e-receipt, dan kenangan konser Anda.
        </Text>
      </View>

      <View style={styles.section}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          year={year === 'all' ? 'Semua' : String(year)}
          onYearPress={() => setYearModal(true)}
        />
      </View>

      <View style={styles.section}>
        <FilterPills
          filters={[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu Pembayaran', count: counts.pending },
            { key: 'paid', label: 'Selesai', count: counts.paid },
            { key: 'cancelled', label: 'Dibatalkan / Kedaluwarsa', count: counts.cancelled },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </View>

      <View style={{ gap: 16 }}>
        {loadError && (
          <View style={styles.empty}>
            <MaterialIcons name="cloud-off" size={40} color={Colors.outline} />
            <Text style={styles.emptyTitle}>Riwayat Tidak Dapat Dimuat</Text>
            <Text style={styles.emptySub}>{loadError}</Text>
            <Pressable
              onPress={() => loadOrders(true)}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </Pressable>
          </View>
        )}
        {!loadError && visibleOrders.length === 0 && (
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
                if (v === 'pending') router.push(`/payment/${order.id}` as Href);
                else if (v === 'completed') router.push(`/(tabs)/tiket` as Href);
                else router.push(`/orders/${order.id}` as Href);
              }}
              onSecondaryAction={() => router.push(`/orders/${order.id}` as Href)}
            />
          );
        })}
      </View>

      <View style={styles.footerNote}>
        <MaterialIcons name="verified-user" size={15} color={Colors.secondary} />
        <Text style={styles.footerText}>
          Semua transaksi & e-ticket dilindungi enkripsi Eventify SafePass™
        </Text>
      </View>

      {/* Pemilih tahun */}
      <Modal
        visible={yearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setYearModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Tahun</Text>
            {([...years, 'all'] as YearFilter[]).map((y) => {
              const active = y === year;
              return (
                <Pressable
                  key={String(y)}
                  onPress={() => {
                    setYear(y);
                    setYearModal(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalItem,
                    active && styles.modalItemActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                    {y === 'all' ? 'Semua Tahun' : y}
                  </Text>
                  {active && <MaterialIcons name="check" size={18} color={Colors.primaryContainer} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.burgundy,
  },
  retryButtonText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: '#fff',
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
    modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.onSurface,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalItemActive: { backgroundColor: 'rgba(91,15,24,0.08)' },
  modalItemText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.onSurface,
  },
  modalItemTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.primaryContainer,
  },
});