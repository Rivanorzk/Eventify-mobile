// app/(tabs)/tiket.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate } from '@/utils/format';
import type { Ticket } from '@/types/api';

async function fetchMyTickets(): Promise<Ticket[]> {
  const res = await api.get('/tickets/my');
  return res.data.data ?? [];
}

// ─── Helpers ───────────────────────────────────────────────────
function getText(t: Ticket, key: string): string | null {
  const value = (t as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

// Backend: status 'used' = tiket sudah discan di gate.
const isScanned = (t: Ticket) => t.status === 'used';

function createdTime(t: Ticket): number {
  const raw = getText(t, 'created_at');
  const ts = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

// Terbaru di atas (waktu pembelian, lalu id terbesar)
const newestFirst = (a: Ticket, b: Ticket) =>
  createdTime(b) - createdTime(a) || Number(b.id) - Number(a.id);

// Status tambahan selain status scan
const EXTRA_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  expired: { label: 'KEDALUWARSA', color: '#B45309', bg: 'rgba(245,158,11,0.15)' },
  cancelled: { label: 'EVENT DIBATALKAN', color: '#B3261E', bg: 'rgba(179,38,30,0.10)' },
};

// ─── Screen ────────────────────────────────────────────────────
export default function TiketScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setTickets(await fetchMyTickets());
    } catch (err) {
      console.warn('Fetch tickets error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sorted = useMemo(() => [...tickets].sort(newestFirst), [tickets]);
  const scannedCount = useMemo(() => tickets.filter(isScanned).length, [tickets]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Memuat tiket...</Text>
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
            onRefresh={() => loadAll(true)}
            tintColor={Colors.burgundy}
          />
        ),
      }}
    >
      {/* Header ringkasan */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tiket Saya</Text>
        <Text style={styles.headerSub}>
          {tickets.length} tiket · {scannedCount} sudah discan ·{' '}
          {tickets.length - scannedCount} belum discan
        </Text>
      </View>

      {/* Security notice */}
      <View style={styles.notice}>
        <View style={styles.noticeIcon}>
          <MaterialIcons name="shield" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>Peringatan Keamanan Tiket</Text>
          <Text style={styles.noticeText}>
            Jangan bagikan barcode atau QR Code kepada siapa pun untuk mencegah
            duplikasi tiket palsu.
          </Text>
        </View>
      </View>

      {/* Daftar semua tiket */}
      {sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialIcons name="confirmation-number" size={40} color={Colors.outline} />
          <Text style={styles.emptyText}>Belum ada tiket</Text>
          <Text style={styles.emptySub}>
            Beli tiket konser dan tiketmu akan muncul di sini
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {sorted.map((t) => {
            const scanned = isScanned(t);
            const category = getText(t, 'category_name');
            const location = getText(t, 'location');
            const code = getText(t, 'ticket_code');
            const extra = EXTRA_STATUS[String(t.status)];

            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/tiket/${t.id}` as Href)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View
                  style={[
                    styles.accent,
                    { backgroundColor: scanned ? '#9CA3AF' : Colors.burgundy },
                  ]}
                />

                <View style={styles.cardBody}>
                  {/* Baris badge */}
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.badge,
                        scanned ? styles.badgeScanned : styles.badgeNotScanned,
                      ]}
                    >
                      <MaterialIcons
                        name={scanned ? 'check-circle' : 'qr-code-scanner'}
                        size={12}
                        color={scanned ? '#1D4ED8' : '#047857'}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: scanned ? '#1D4ED8' : '#047857' },
                        ]}
                      >
                        {scanned ? 'SUDAH DISCAN' : 'BELUM DISCAN'}
                      </Text>
                    </View>

                    {extra && (
                      <View style={[styles.badge, { backgroundColor: extra.bg }]}>
                        <Text style={[styles.badgeText, { color: extra.color }]}>
                          {extra.label}
                        </Text>
                      </View>
                    )}

                    {category && (
                      <View style={styles.categoryBadge}>
                        <MaterialIcons
                          name="confirmation-number"
                          size={11}
                          color={Colors.burgundy}
                        />
                        <Text style={styles.categoryText} numberOfLines={1}>
                          {category}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Judul */}
                  <Text style={styles.title} numberOfLines={2}>
                    {t.event_title}
                  </Text>

                  {/* Detail */}
                  <View style={styles.infoRow}>
                    <MaterialIcons name="calendar-today" size={13} color="#8C7777" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {formatEventDate(t.event_date, t.start_time)}
                    </Text>
                  </View>

                  {location && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="location-on" size={13} color="#8C7777" />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                  )}

                  {code && (
                    <View style={styles.codeBox}>
                      <Text style={styles.codeLabel}>KODE TIKET</Text>
                      <Text style={styles.codeText} numberOfLines={1}>
                        {code}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.chevronWrap}>
                  <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.onSurfaceVariant },

  header: { marginBottom: Spacing.md },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.espresso },
  headerSub: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(216,167,167,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(216,167,167,0.6)',
    marginBottom: Spacing.md,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTitle: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.burgundy,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(30,30,30,0.8)',
  },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.espresso },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#EADBCC',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    paddingLeft: 20,
    gap: 6,
  },
  chevronWrap: { paddingRight: 10 },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeNotScanned: { backgroundColor: 'rgba(16,185,129,0.12)' },
  badgeScanned: { backgroundColor: 'rgba(59,130,246,0.12)' },
  badgeText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.6 },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 150,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(91,15,24,0.08)',
  },
  categoryText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.burgundy,
    textTransform: 'uppercase',
  },

  title: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.espresso,
    marginTop: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },

  codeBox: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.cream,
  },
  codeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(30,30,30,0.55)',
  },
  codeText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.espresso,
    marginTop: 1,
  },
});