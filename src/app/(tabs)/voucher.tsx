import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import RedeemBox from '@/components/voucher/RedeemBox';
import VoucherCard from '@/components/voucher/VoucherCard';
import StateTabs, { VoucherTabKey } from '@/components/voucher/StateTabs';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Voucher } from '@/types/api';

// ─── API ───────────────────────────────────────────────────────
async function fetchMyVouchers(): Promise<Voucher[]> {
  const res = await api.get('/vouchers/my');
  return res.data.data ?? [];
}

async function redeemVoucherAPI(promoCode: string): Promise<Voucher> {
  const res = await api.post('/vouchers/redeem', { promo_code: promoCode });
  return res.data.data;
}

// ─── Tab config ────────────────────────────────────────────────
const TAB_CONFIG: {
  key: VoucherTabKey;
  label: string;
  states: string[];
  emptyTitle: string;
  emptySub: string;
}[] = [
  {
    key: 'available',
    label: 'Tersedia',
    states: ['available', 'upcoming'],
    emptyTitle: 'Belum ada voucher yang bisa dipakai',
    emptySub: 'Masukkan kode voucher di atas untuk menambahkannya ke akun Anda.',
  },
  {
    key: 'used',
    label: 'Terpakai',
    states: ['used'],
    emptyTitle: 'Belum ada voucher terpakai',
    emptySub: 'Voucher yang sudah Anda pakai saat checkout muncul di sini.',
  },
  {
    key: 'expired',
    label: 'Kedaluwarsa',
    states: ['expired', 'inactive'],
    emptyTitle: 'Tidak ada voucher kedaluwarsa',
    emptySub: 'Voucher yang masa berlakunya habis muncul di sini.',
  },
];

function sortByTab(key: VoucherTabKey) {
  return (a: Voucher, b: Voucher) => {
    if (key === 'available')
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    if (key === 'used')
      return (
        new Date(b.used_at ?? 0).getTime() - new Date(a.used_at ?? 0).getTime()
      );
    return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
  };
}

export default function VoucherScreen() {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<VoucherTabKey>('available');

  const loadVouchers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchMyVouchers();
      setVouchers(data);
    } catch (err) {
      console.warn('Load vouchers error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleRedeem = async (code: string) => {
    const newVoucher = await redeemVoucherAPI(code);
    setVouchers((prev) => [
      newVoucher,
      ...prev.filter((v) => v.id !== newVoucher.id),
    ]);
    setActiveTab('available');
  };

  const grouped = useMemo(() => {
    const result: Record<VoucherTabKey, Voucher[]> = {
      available: [],
      used: [],
      expired: [],
    };
    for (const tab of TAB_CONFIG) {
      result[tab.key] = vouchers
        .filter((v) => tab.states.includes(v.state))
        .sort(sortByTab(tab.key));
    }
    return result;
  }, [vouchers]);

  const currentTab = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const visible = grouped[activeTab];

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Memuat voucher...</Text>
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
            onRefresh={() => loadVouchers(true)}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        ),
      }}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>PROMO & DISKON</Text>
          <Text style={styles.title}>Voucher Saya</Text>
          <Text style={styles.subtitle}>
            Tukar kode voucher dan pakai potongan harganya saat checkout
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/voucher' as Href)}
          style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="help-outline" size={20} color={Colors.burgundy} />
        </Pressable>
      </View>

      {/* Redeem box */}
      <View style={{ marginBottom: Spacing.lg }}>
        <RedeemBox onRedeem={handleRedeem} />
      </View>

      {/* Tabs */}
      <View style={{ marginBottom: Spacing.md }}>
        <StateTabs
          tabs={TAB_CONFIG.map((t) => ({
            key: t.key,
            label: t.label,
            count: grouped[t.key].length,
          }))}
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {/* Voucher list */}
      <View style={{ gap: Spacing.md }}>
        {visible.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="card-giftcard" size={44} color={Colors.outline} />
            <Text style={styles.emptyTitle}>{currentTab.emptyTitle}</Text>
            <Text style={styles.emptySub}>{currentTab.emptySub}</Text>
          </View>
        )}

        {visible.map((v) => (
          <VoucherCard
            key={v.id}
            voucher={v}
            onUseInEvent={(eventId) =>
              router.push(`/event/${eventId}` as Href)
            }
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialIcons name="verified-user" size={15} color={Colors.secondary} />
        <Text style={styles.footerText}>
          Semua voucher dilindungi Eventify SafePass™
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

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
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
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.espresso,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 19,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: Spacing.md,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
});