import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { TicketDetail } from '@/types/api';

interface Props {
  ticket: TicketDetail;
}

export default function ETicketCard({ ticket }: Props) {
  return (
    <View style={styles.card}>
      {/* Upper zone — event visuals */}
      <View style={styles.upper}>
        {ticket.poster && (
          <Image
            source={{ uri: ticket.poster }}
            style={StyleSheet.absoluteFill as any}
            resizeMode="cover"
            blurRadius={2}
          />
        )}
        <LinearGradient
          colors={['rgba(91,15,24,0.95)', 'rgba(59,0,8,0.92)']}
          style={StyleSheet.absoluteFill as any}
        />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.passBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.passBadgeText}>E-PASS AKTIF</Text>
            </View>
            <View style={styles.officialBadge}>
              <Text style={styles.officialText}>E-TICKET RESMI</Text>
            </View>
          </View>

          <Text style={styles.tourText}>WORLD TOUR 2025</Text>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {ticket.event_title}
          </Text>

          {/* Logistics grid */}
          <View style={styles.grid}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                <MaterialIcons name="calendar-today" size={11} color="#FFDAD9" /> Waktu
              </Text>
              <Text style={styles.value} numberOfLines={1}>
                {formatEventDate(ticket.event_date, ticket.start_time)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                <MaterialIcons name="stadium" size={11} color="#FFDAD9" /> Lokasi
              </Text>
              <Text style={styles.value} numberOfLines={1}>
                {ticket.event_location}
              </Text>
            </View>
          </View>

          {/* Tier & seat */}
          <View style={styles.tierBand}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierLabel}>KATEGORI</Text>
              <Text style={styles.tierValue} numberOfLines={1}>
                {ticket.category_name}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.tierLabel}>STATUS</Text>
              <Text style={styles.tierValue}>{ticket.status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notch / perforation */}
      <View style={styles.notchRow}>
        <View style={styles.notchLeft} />
        <View style={styles.dashed} />
        <View style={styles.notchRight} />
      </View>

      {/* Lower zone — QR */}
      <View style={styles.lower}>
        {/* Watermark strip */}
        <View style={styles.watermarkRow}>
          <MaterialIcons name="security" size={14} color={Colors.burgundy} />
          <Text style={styles.watermarkText}>
            DYNAMIC WATERMARK #{ticket.ticket_code?.slice(-6)}
          </Text>
        </View>

        {/* QR + metadata */}
        <View style={styles.qrSection}>
          <View style={styles.qrBox}>
            {/* Isi QR = ticket_code (pendek, mis. TKT-XXXXXXXXXX), sama dengan
                yang diterima endpoint redeem. Jangan pakai ticket.qr_code:
                itu data-URL gambar PNG (ribuan karakter) untuk web. */}
            <QRCode
              value={ticket.ticket_code || 'N/A'}
              size={96}
              ecl="M"
              quietZone={4}
              backgroundColor="#fff"
            />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.metaLabel}>Nomor Order</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {ticket.invoice_number || `#${ticket.ticket_code}`}
            </Text>

            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Total</Text>
            <Text style={[styles.metaValue, { color: Colors.burgundy }]}>
              {formatRupiah(ticket.final_price)}
            </Text>
          </View>
        </View>

        {/* Barcode strip (simple mock) */}
        <View style={styles.barcode}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.barcodeLine,
                { width: i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2 },
              ]}
            />
          ))}
        </View>
        <Text style={styles.barcodeText}>
          * {ticket.ticket_code} *
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#F8F1E7',
    borderWidth: 1,
    borderColor: '#EADBCC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  // Upper
  upper: { position: 'relative', overflow: 'hidden' },
  content: { padding: 16, gap: 14, zIndex: 2 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399',
  },
  passBadgeText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  officialBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  officialText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },

  tourText: {
    color: '#FFDAD9',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  eventTitle: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  grid: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  label: {
    color: '#FFDAD9',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  value: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 12,
    marginTop: 2,
  },

  tierBand: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  tierLabel: {
    color: '#FFDAD9',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  tierValue: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginTop: 2,
  },

  // Notch
  notchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#F8F1E7',
  },
  notchLeft: {
    width: 24, height: 24, borderRadius: 9999,
    backgroundColor: Colors.background,
    marginLeft: -12,
    borderRightWidth: 1,
    borderRightColor: '#EADBCC',
  },
  notchRight: {
    width: 24, height: 24, borderRadius: 9999,
    backgroundColor: Colors.background,
    marginRight: -12,
    borderLeftWidth: 1,
    borderLeftColor: '#EADBCC',
  },
  dashed: {
    flex: 1,
    marginHorizontal: 12,
    borderStyle: 'dashed',
    borderBottomWidth: 2,
    borderBottomColor: '#D5C6B7',
  },

  // Lower
  lower: { padding: 16, backgroundColor: '#F8F1E7', alignItems: 'center' },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignSelf: 'stretch',
  },
  watermarkText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.espresso,
    flex: 1,
  },

  qrSection: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 14,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignSelf: 'stretch',
  },
  qrBox: {
    width: 112, height: 112,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  metaValue: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.espresso,
    letterSpacing: 0.5,
  },

  barcode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 44,
    paddingHorizontal: 8,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'stretch',
  },
  barcodeLine: { height: '80%', backgroundColor: Colors.espresso },
  barcodeText: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(30,30,30,0.7)',
    marginTop: 6,
  },
});