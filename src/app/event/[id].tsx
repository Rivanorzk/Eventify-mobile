import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FAQItem from '@/components/tiket/FAQItem';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { EventDetail, TicketCategory } from '@/types/api';

async function fetchEvent(id: string): Promise<EventDetail> {
  const res = await api.get(`/events/${id}`);
  return res.data.data;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'details' | 'tickets'>('details');
  const [selectedTicket, setSelectedTicket] = useState<TicketCategory | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEvent(id);
        setEvent(data);
        setSelectedTicket(data.ticket_categories?.[0] || null);
      } catch {
        Alert.alert('Error', 'Gagal memuat event');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const total = useMemo(() => {
    if (!selectedTicket) return 0;
    return Number(selectedTicket.price) * qty;
  }, [selectedTicket, qty]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
      </SafeAreaView>
    );
  }

  if (!event) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Back button + hero poster */}
        <View style={styles.heroWrap}>
          {event.poster ? (
            <Image source={{ uri: event.poster }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, { backgroundColor: Colors.burgundy }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.5)', '#fff']}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
          </Pressable>

          {/* Live badges */}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadgeDark}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroBadgeText}>TIKET TERBATAS</Text>
            </View>
            <View style={styles.heroBadgeLight}>
              <MaterialIcons name="local-activity" size={14} color={Colors.wine} />
              <Text style={[styles.heroBadgeText, { color: Colors.espresso }]}>
                EVENT PASS
              </Text>
            </View>
          </View>
        </View>

        {/* Title & meta */}
        <View style={styles.body}>
          <Text style={styles.tourText}>
            {event.category_name?.toUpperCase() || 'MUSIC EVENT'}
          </Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.desc} numberOfLines={3}>
            {event.description}
          </Text>

          {/* Quick specs */}
          <View style={styles.specRow}>
            <MaterialIcons name="calendar-month" size={18} color={Colors.burgundy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.specLabel}>Waktu Pelaksanaan</Text>
              <Text style={styles.specValue}>
                {formatEventDate(event.event_date, event.start_time)}
              </Text>
            </View>
          </View>

          <View style={styles.specRow}>
            <MaterialIcons name="pin-drop" size={18} color={Colors.wine} />
            <View style={{ flex: 1 }}>
              <Text style={styles.specLabel}>Lokasi Venue</Text>
              <Text style={styles.specValue}>{event.location}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('details')}
              style={[styles.tab, tab === 'details' && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === 'details' && styles.tabTextActive]}>
                Detail
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('tickets')}
              style={[styles.tab, tab === 'tickets' && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === 'tickets' && styles.tabTextActive]}>
                Tiket
              </Text>
            </Pressable>
          </View>

          {tab === 'details' ? (
            <View style={{ marginTop: 16, gap: 16 }}>
              <View>
                <Text style={styles.sectionTitle}>Tentang Event</Text>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>

              <FAQItem
                icon="verified-user"
                title="Batas Usia Pengunjung"
                body="Festival ini dikhususkan untuk penonton berusia 18 tahun ke atas (18+). Identitas resmi wajib ditunjukkan saat penukaran gelang."
              />
              <FAQItem
                icon="qr-code-scanner"
                title="Mekanisme Barcode & Wristband"
                body="E-tiket dikirim ke aplikasi H-3 acara. Tunjukkan barcode di Ticket Booth untuk ditukar gelang RFID."
              />
              <FAQItem
                icon="block"
                title="Barang yang Dilarang Masuk"
                body="Dilarang membawa senjata tajam, alkohol dari luar, kamera profesional, kembang api, dan drone."
              />
            </View>
          ) : (
            <View style={{ marginTop: 16, gap: 12 }}>
              {event.ticket_categories?.map((cat) => {
                const soldOut = cat.remaining_stock === 0;
                const active = selectedTicket?.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    disabled={soldOut}
                    onPress={() => setSelectedTicket(cat)}
                    style={[
                      styles.ticketCat,
                      active && styles.ticketCatActive,
                      soldOut && { opacity: 0.5 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketCatName}>{cat.category_name}</Text>
                      <Text style={styles.ticketCatStock}>
                        Sisa {cat.remaining_stock} tiket
                      </Text>
                    </View>
                    <Text style={styles.ticketCatPrice}>
                      {formatRupiah(cat.price)}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Qty */}
              {selectedTicket && (
                <View style={styles.qtyRow}>
                  <Text style={styles.specLabel}>Jumlah</Text>
                  <View style={styles.qtyBtns}>
                    <Pressable
                      onPress={() => setQty(Math.max(1, qty - 1))}
                      style={styles.qtyBtn}
                    >
                      <MaterialIcons name="remove" size={18} color={Colors.espresso} />
                    </Pressable>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <Pressable
                      onPress={() =>
                        setQty(Math.min(selectedTicket.remaining_stock, qty + 1))
                      }
                      style={[styles.qtyBtn, { backgroundColor: Colors.burgundy }]}
                    >
                      <MaterialIcons name="add" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </SafeAreaView>

      {/* Sticky footer */}
      {tab === 'tickets' && selectedTicket && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Total Pembayaran</Text>
            <Text style={styles.footerPrice}>{formatRupiah(total)}</Text>
            <Text style={styles.footerSub}>
              {qty}x {selectedTicket.category_name}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push(
                `/checkout?event_id=${event.id}&ticket_id=${selectedTicket.id}&quantity=${qty}` as Href
              )
            }
            style={styles.checkoutBtn}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  heroWrap: { height: 320, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: 12, left: 16,
    width: 40, height: 40, borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadges: {
    position: 'absolute',
    bottom: 20, left: Spacing.margin,
    flexDirection: 'row', gap: 8,
  },
  heroBadgeDark: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 9999, backgroundColor: Colors.burgundy,
  },
  heroBadgeLight: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.95)',
  },
  heroBadgeText: {
    fontFamily: Fonts.bold, fontSize: 10,
    letterSpacing: 1, color: '#fff',
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFB3B3' },

  body: { paddingHorizontal: Spacing.margin, paddingTop: 8 },
  tourText: {
    fontFamily: Fonts.bold, fontSize: 11,
    letterSpacing: 1.1, color: Colors.wine,
    textTransform: 'uppercase', marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.bold, fontSize: 26,
    lineHeight: 32, color: Colors.espresso,
    letterSpacing: -0.4,
  },
  desc: {
    fontFamily: Fonts.regular, fontSize: 14,
    lineHeight: 21, color: 'rgba(30,30,30,0.8)',
    marginTop: 6,
  },

  specRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginTop: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EADBDB',
  },
  specLabel: {
    fontFamily: Fonts.bold, fontSize: 10,
    letterSpacing: 0.8, color: 'rgba(30,30,30,0.6)',
    textTransform: 'uppercase',
  },
  specValue: {
    fontFamily: Fonts.semibold, fontSize: 14,
    color: Colors.espresso, marginTop: 2,
  },

  tabs: {
    flexDirection: 'row', gap: 6,
    marginTop: 20, padding: 4,
    borderRadius: 9999, backgroundColor: '#F3EFEA',
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 9999,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.burgundy },
  tabText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.onSurfaceVariant },
  tabTextActive: { color: '#fff' },

  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 16,
    color: Colors.espresso, marginBottom: 6,
  },
  bodyText: {
    fontFamily: Fonts.regular, fontSize: 14,
    lineHeight: 22, color: 'rgba(30,30,30,0.8)',
  },

  ticketCat: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: Radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EADBDB',
    gap: 12,
  },
  ticketCatActive: {
    borderColor: Colors.burgundy,
    backgroundColor: '#F8F1E7',
  },
  ticketCatName: {
    fontFamily: Fonts.bold, fontSize: 14, color: Colors.espresso,
  },
  ticketCatStock: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  ticketCatPrice: {
    fontFamily: Fonts.bold, fontSize: 16, color: Colors.wine,
  },

  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14, marginTop: 10,
    backgroundColor: Colors.cream,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#EADBDB',
  },
  qtyBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EADBDB',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: {
    fontFamily: Fonts.bold, fontSize: 16,
    color: Colors.espresso, minWidth: 24, textAlign: 'center',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.margin, paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1, borderTopColor: '#EADBDB',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  footerLabel: {
    fontFamily: Fonts.bold, fontSize: 10,
    letterSpacing: 0.8, color: 'rgba(30,30,30,0.6)',
    textTransform: 'uppercase',
  },
  footerPrice: {
    fontFamily: Fonts.bold, fontSize: 18, color: Colors.espresso,
  },
  footerSub: {
    fontFamily: Fonts.regular, fontSize: 11,
    color: Colors.wine, marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 14,
    borderRadius: 9999, backgroundColor: Colors.burgundy,
  },
  checkoutText: {
    color: '#fff', fontFamily: Fonts.bold, fontSize: 14,
  },
});