import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { TicketDetail } from '@/types/api';

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await api.get(`/tickets/${id}`);
  return res.data.data;
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTicket(id);
        setTicket(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
      </SafeAreaView>
    );
  }

  if (!ticket) return null;

  const statusLabel =
    ticket.status === 'active'
      ? 'TIKET AKTIF • SIAP DIGUNAKAN'
      : ticket.status === 'used'
      ? 'TIKET SUDAH DIGUNAKAN'
      : ticket.status === 'expired'
      ? 'TIKET KEDALUWARSA'
      : 'TIKET DIBATALKAN';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color={Colors.espresso} />
        </Pressable>
        <Text style={styles.headerTitle}>E-Ticket Detail</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title}>E-Ticket Digital Pass</Text>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        {/* Hero ticket */}
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {ticket.category_name?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{ticket.event_title}</Text>
            <Text style={styles.heroMeta}>
              {formatEventDate(ticket.event_date, ticket.start_time)} • {ticket.event_location}
            </Text>
          </View>

          {/* Notch */}
          <View style={styles.notchRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashed} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.ticketCode}>Kode: {ticket.ticket_code}</Text>
            <View style={styles.areaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>KATEGORI</Text>
                <Text style={styles.metaValue}>{ticket.category_name}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>HARGA</Text>
                <Text style={[styles.metaValue, { color: '#FFDEAA' }]}>
                  {formatRupiah(ticket.ticket_price)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* QR */}
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            {/* Isi QR = ticket_code, bukan ticket.qr_code (data-URL PNG) */}
            <QRCode
              value={ticket.ticket_code}
              size={200}
              ecl="M"
              quietZone={8}
              backgroundColor="#fff"
            />
          </View>
          <Text style={styles.qrHint}>
            Tunjukkan QR ini di pintu masuk venue
          </Text>
          <Text style={styles.qrCode}>{ticket.ticket_code}</Text>
        </View>

        {/* Invoice */}
        <View style={styles.invoiceCard}>
          <Text style={styles.sectionTitle}>Rincian Faktur</Text>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>No. Faktur</Text>
            <Text style={styles.invoiceValue}>{ticket.invoice_number}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Metode Bayar</Text>
            <Text style={styles.invoiceValue}>
              {ticket.payment_type || '-'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>1x {ticket.category_name}</Text>
            <Text style={styles.invoiceValue}>
              {formatRupiah(ticket.ticket_price)}
            </Text>
          </View>

          {!!ticket.discount_amount && ticket.discount_amount > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Diskon Voucher</Text>
              <Text style={[styles.invoiceValue, { color: '#1E7A4C' }]}>
                -{formatRupiah(ticket.discount_amount)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.invoiceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatRupiah(ticket.final_price)}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F1E7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F1E7' },

  header: {
    height: 56, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F1E7',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.semibold, fontSize: 16, color: Colors.espresso,
  },

  body: { paddingHorizontal: Spacing.margin, paddingTop: 8, gap: 14 },
  title: {
    fontFamily: Fonts.bold, fontSize: 24,
    color: Colors.burgundy, letterSpacing: -0.4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 9999, backgroundColor: '#FDF3D8',
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#B4841F',
  },
  statusText: {
    fontFamily: Fonts.bold, fontSize: 10,
    letterSpacing: 0.8, color: '#B4841F',
  },

  hero: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.burgundy,
    overflow: 'hidden',
  },
  heroHeader: { padding: 20, gap: 6 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 9999, backgroundColor: '#7D5700',
  },
  heroBadgeText: {
    color: '#fff', fontFamily: Fonts.bold,
    fontSize: 10, letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#fff', fontFamily: Fonts.bold,
    fontSize: 22, lineHeight: 28, marginTop: 6,
  },
  heroMeta: {
    color: '#FFB2BB', fontFamily: Fonts.regular,
    fontSize: 12, marginTop: 4,
  },

  notchRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 24, backgroundColor: '#F8F1E7',
  },
  notchLeft: {
    width: 24, height: 24, borderRadius: 9999,
    backgroundColor: '#F8F1E7', marginLeft: -12,
  },
  notchRight: {
    width: 24, height: 24, borderRadius: 9999,
    backgroundColor: '#F8F1E7', marginRight: -12,
  },
  dashed: {
    flex: 1, marginHorizontal: 12,
    borderStyle: 'dashed', borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,178,187,0.4)',
  },

  heroFooter: {
    padding: 20, backgroundColor: 'rgba(96,12,31,0.4)',
    gap: 10,
  },
  ticketCode: {
    fontFamily: Fonts.bold, fontSize: 11,
    color: '#FFDEAA', letterSpacing: 0.8,
  },
  areaRow: { flexDirection: 'row', gap: 20, marginTop: 6 },
  metaLabel: {
    color: '#FFB2BB', fontFamily: Fonts.bold,
    fontSize: 10, letterSpacing: 1,
  },
  metaValue: {
    color: '#fff', fontFamily: Fonts.bold,
    fontSize: 16, marginTop: 2,
  },

  qrCard: {
    backgroundColor: '#fff', borderRadius: Radius.xl,
    padding: 20, alignItems: 'center', gap: 12,
  },
  qrBox: {
    padding: 12, borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EADBCC',
  },
  qrHint: {
    fontFamily: Fonts.semibold, fontSize: 14,
    color: Colors.espresso, textAlign: 'center',
  },
  qrCode: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.onSurfaceVariant, letterSpacing: 0.5,
  },

  invoiceCard: {
    backgroundColor: '#fff', borderRadius: Radius.xl,
    padding: 20, gap: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 15,
    color: Colors.espresso, marginBottom: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontFamily: Fonts.regular, fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  invoiceValue: {
    fontFamily: Fonts.semibold, fontSize: 13,
    color: Colors.espresso,
  },
  divider: {
    height: 1, backgroundColor: '#EAE7E7', marginVertical: 4,
  },
  totalLabel: {
    fontFamily: Fonts.bold, fontSize: 15, color: Colors.espresso,
  },
  totalValue: {
    fontFamily: Fonts.bold, fontSize: 16, color: Colors.burgundy,
  },
});