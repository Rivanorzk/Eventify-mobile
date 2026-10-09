import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import ETicketCard from '@/components/tiket/ETicketCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { Ticket, TicketDetail } from '@/types/api';

type Tab = 'upcoming' | 'history';

async function fetchMyTickets(): Promise<Ticket[]> {
  const res = await api.get('/tickets/my');
  return res.data.data ?? [];
}

async function fetchTicketDetail(id: number): Promise<TicketDetail> {
  const res = await api.get(`/tickets/${id}`);
  return res.data.data;
}

export default function TiketScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [primaryDetail, setPrimaryDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const list = await fetchMyTickets();
      setTickets(list);

      const active = list
        .filter((t) => t.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        )[0];

      if (active) {
        try {
          const detail = await fetchTicketDetail(active.id);
          setPrimaryDetail(detail);
        } catch {
          setPrimaryDetail(null);
        }
      } else {
        setPrimaryDetail(null);
      }
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

  const upcoming = tickets.filter(
    (t) => t.status === 'active' || t.status === 'unused'
  );
  const history = tickets.filter((t) => t.status !== 'active' && t.status !== 'unused');

  const displayList = tab === 'upcoming' ? upcoming : history;
  const secondaryUpcoming = upcoming.slice(1, 3); // untuk kartu preview

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
      {/* Segmented Tab */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('upcoming')}
          style={[styles.tabBtn, tab === 'upcoming' && styles.tabActive]}
        >
          <MaterialIcons
            name="confirmation-number"
            size={16}
            color={tab === 'upcoming' ? '#fff' : Colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: tab === 'upcoming' ? '#fff' : Colors.onSurfaceVariant },
            ]}
          >
            Akan Datang ({upcoming.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('history')}
          style={[styles.tabBtn, tab === 'history' && styles.tabActive]}
        >
          <MaterialIcons
            name="history"
            size={16}
            color={tab === 'history' ? '#fff' : Colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: tab === 'history' ? '#fff' : Colors.onSurfaceVariant },
            ]}
          >
            Riwayat Konser ({history.length})
          </Text>
        </Pressable>
      </View>

      {/* Security notice */}
      <View style={styles.notice}>
        <View style={styles.noticeIcon}>
          <MaterialIcons name="shield" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>Peringatan Keamanan Tiket</Text>
          <Text style={styles.noticeText}>
            Jangan bagikan barcode atau QR Code ini kepada siapa pun untuk mencegah
            duplikasi tiket palsu sebelum pintu venue dibuka.
          </Text>
        </View>
      </View>

      {/* Primary E-Ticket */}
      {tab === 'upcoming' && primaryDetail && (
        <View style={{ marginTop: Spacing.md }}>
          <ETicketCard ticket={primaryDetail} />

          {/* Action buttons */}
          <View style={{ marginTop: 12, gap: 8 }}>
            <Pressable
              onPress={() =>
                Alert.alert('Info', 'Fitur wallet segera hadir.')
              }
              style={styles.walletBtn}
            >
              <MaterialIcons name="account-balance-wallet" size={20} color="#fff" />
              <Text style={styles.walletBtnText}>Simpan ke Wallet</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() =>
                  router.push(`/tiket/${primaryDetail.id}` as Href)
                }
                style={styles.secondaryBtn}
              >
                <MaterialIcons name="info-outline" size={18} color={Colors.burgundy} />
                <Text style={styles.secondaryBtnText}>Detail Lengkap</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Info', 'Panduan venue segera hadir.')}
                style={styles.secondaryBtn}
              >
                <MaterialIcons name="map" size={18} color={Colors.burgundy} />
                <Text style={styles.secondaryBtnText}>Panduan Venue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {tab === 'upcoming' && !primaryDetail && (
        <View style={styles.emptyBox}>
          <MaterialIcons name="confirmation-number" size={40} color={Colors.outline} />
          <Text style={styles.emptyText}>Belum ada tiket aktif</Text>
          <Text style={styles.emptySub}>
            Beli tiket konser dan e-ticket akan muncul di sini
          </Text>
        </View>
      )}

      {/* Secondary upcoming tickets */}
      {tab === 'upcoming' && secondaryUpcoming.length > 0 && (
        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Konser Mendatang Berikutnya</Text>
          </View>

          {secondaryUpcoming.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/tiket/${t.id}` as Href)}
              style={({ pressed }) => [styles.previewCard, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.previewAccent} />
              <View style={styles.previewBody}>
                <View style={styles.previewThumb}>
                  <MaterialIcons name="music-note" size={24} color={Colors.burgundy} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.confirmedRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.confirmedText}>TERKONFIRMASI</Text>
                  </View>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {t.event_title}
                  </Text>
                  <Text style={styles.previewMeta} numberOfLines={1}>
                    {formatEventDate(t.event_date, t.start_time)}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* History list */}
      {tab === 'history' && (
        <View style={{ marginTop: Spacing.md, gap: 10 }}>
          {displayList.length === 0 && (
            <Text style={styles.emptyText}>Belum ada riwayat konser.</Text>
          )}
          {displayList.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/tiket/${t.id}` as Href)}
              style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.historyIcon}>
                <MaterialIcons name="history" size={20} color={Colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {t.event_title}
                </Text>
                <Text style={styles.previewMeta} numberOfLines={1}>
                  {formatEventDate(t.event_date, t.start_time)}
                </Text>
                <Text style={styles.historyStatus}>
                  Status: {t.status}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Fast-track card */}
      <View style={styles.fastTrack}>
        <View style={styles.fastTrackIcon}>
          <MaterialIcons name="contactless" size={22} color={Colors.burgundy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fastTrackTitle}>Jalur Cepat Fast-Track VIP</Text>
          <Text style={styles.fastTrackText}>
            Tunjukkan barcode langsung di Gate khusus VIP
          </Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={Colors.burgundy} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.onSurfaceVariant },

  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 9999,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#E9E2D8',
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.burgundy,
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabText: { fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.3 },

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
    width: 32, height: 32, borderRadius: 9999,
    backgroundColor: Colors.burgundy,
    alignItems: 'center', justifyContent: 'center',
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

  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    backgroundColor: Colors.burgundy,
  },
  walletBtnText: {
    color: '#fff', fontFamily: Fonts.semibold, fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  secondaryBtnText: {
    color: Colors.espresso,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },

  emptyBox: {
    alignItems: 'center', paddingVertical: 40, gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.semibold, fontSize: 14, color: Colors.espresso,
  },
  emptySub: {
    fontFamily: Fonts.regular, fontSize: 12, color: Colors.onSurfaceVariant,
    textAlign: 'center', paddingHorizontal: 24,
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 11,
    letterSpacing: 1.1, color: Colors.espresso,
    textTransform: 'uppercase',
  },

  previewCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#EADBCC',
    overflow: 'hidden',
    marginBottom: 10,
  },
  previewAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0, width: 6,
    backgroundColor: Colors.burgundy,
  },
  previewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingLeft: 18,
  },
  previewThumb: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  greenDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981',
  },
  confirmedText: {
    color: '#047857', fontFamily: Fonts.bold,
    fontSize: 10, letterSpacing: 0.8,
  },
  previewTitle: {
    fontFamily: Fonts.bold, fontSize: 14, color: Colors.espresso,
  },
  previewMeta: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  historyIcon: {
    width: 40, height: 40, borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  historyStatus: {
    fontFamily: Fonts.bold, fontSize: 10,
    color: Colors.secondary, letterSpacing: 0.6,
    marginTop: 4, textTransform: 'uppercase',
  },

  fastTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginTop: Spacing.lg,
  },
  fastTrackIcon: {
    width: 40, height: 40, borderRadius: 9999,
    backgroundColor: 'rgba(91,15,24,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  fastTrackTitle: {
    fontFamily: Fonts.bold, fontSize: 13, color: Colors.espresso,
  },
  fastTrackText: {
    fontFamily: Fonts.regular, fontSize: 11,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
});