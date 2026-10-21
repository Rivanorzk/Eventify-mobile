import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ActivityIndicator,
  ScrollView, RefreshControl, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { OrderDetail } from '@/types/api';

// ─── API ───────────────────────────────────────────────────────
async function fetchOrder(id: string): Promise<OrderDetail> {
  const res = await api.get(`/orders/${id}`);
  // Backend: { success, data: { ...order, order_details: [...], tickets: [...] } }
  const raw = res?.data?.data ?? res?.data;
  return raw;
}

// ─── Helpers ───────────────────────────────────────────────────
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm} WIB`;
}

function formatLongDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${days[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start) return '-';
  const s = String(start).slice(0, 5);
  if (!end) return `Mulai: ${s} WIB`;
  return `Gate Buka: ${s} WIB`;
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Transfer Bank',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  qris: 'QRIS',
  credit_card: 'Kartu Kredit',
  cstore: 'Convenience Store',
  echannel: 'Mandiri Bill',
};

function paymentLabel(type?: string | null): string {
  if (!type) return '-';
  return PAYMENT_LABELS[type] || type;
}

function statusMeta(status: string) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return { label: 'Transaksi Berhasil', short: 'Lunas', icon: 'check-circle' as const, bg: Colors.secondaryFixed, fg: Colors.onSecondaryContainer };
    case 'pending':
      return { label: 'Menunggu Pembayaran', short: 'Pending', icon: 'hourglass-empty' as const, bg: '#FDF3D8', fg: '#B4841F' };
    case 'expired':
      return { label: 'Pesanan Kedaluwarsa', short: 'Expired', icon: 'error-outline' as const, bg: Colors.errorContainer, fg: Colors.onErrorContainer };
    case 'cancelled':
      return { label: 'Pesanan Dibatalkan', short: 'Batal', icon: 'cancel' as const, bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant };
    default:
      return { label: 'Status', short: status, icon: 'info' as const, bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant };
  }
}

// ─── Screen ────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchOrder(id);
      setOrder(data);
    } catch (err: any) {
      console.log('❌ order fetch:', err?.response?.status, err?.response?.data);
      Alert.alert('Gagal', 'Tidak dapat memuat detail order.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const handleCopyInvoice = async () => {
    if (!order?.invoice_number) return;
    await Clipboard.setStringAsync(order.invoice_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    Alert.alert('Info', 'Fitur unduh invoice segera hadir.');
  };

  const handleShare = () => {
    Alert.alert('Info', 'Fitur bagikan segera hadir.');
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Order tidak ditemukan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = statusMeta(order.status);
  const lines = order.order_details ?? [];
  const flatTickets = order.tickets ?? lines.flatMap((l) => l.tickets ?? []);
  const payment = order.payment ?? null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header
        onBack={() => router.back()}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ padding: Spacing.margin, paddingBottom: 40, gap: Spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.burgundy}
          />
        }
      >
        {/* ─── Banner Status ────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
              <MaterialIcons name={meta.icon} size={16} color={meta.fg} />
              <Text style={[styles.statusBadgeText, { color: meta.fg }]}>
                {meta.label.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.statusShort}>{meta.short}</Text>
          </View>

          <View style={{ gap: 8, marginTop: 12 }}>
            <RowInfo
              label="No. Pesanan"
              value={`#${order.invoice_number}`}
              onCopy={handleCopyInvoice}
              valueBold
            />
            <RowInfo label="Waktu Transaksi" value={formatDateTime(order.created_at)} />
            <RowInfo
              label="Kanal Pembayaran"
              value={payment ? paymentLabel(payment.payment_type) : 'Belum dibayar'}
            />
          </View>

          {copied && (
            <View style={styles.copyToast}>
              <Text style={styles.copyToastText}>Nomor pesanan disalin!</Text>
            </View>
          )}
        </View>

        {/* ─── Kartu Konser ─────────────────────────────── */}
        <View style={styles.ticketCard}>
          {/* Poster */}
          <View style={styles.posterWrap}>
            {order.event_poster ? (
              <Image source={{ uri: order.event_poster }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterFallback]}>
                <MaterialIcons name="music-note" size={32} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={styles.posterOverlay} />
            <View style={styles.posterContent}>
              <View style={styles.posterTag}>
                <Text style={styles.posterTagText}>Event Pass</Text>
              </View>
              <Text style={styles.posterTitle} numberOfLines={2}>
                {order.event_title}
              </Text>
            </View>
          </View>

          {/* Detail lokasi/tanggal */}
          <View style={styles.metaSection}>
            <MetaRow
              icon="location-on"
              title={order.event_location || '-'}
              subtitle={order.event_location?.split(',').slice(1).join(',').trim() || ''}
            />
            <MetaRow
              icon="calendar-month"
              title={formatLongDate(order.event_date)}
              subtitle={formatTimeRange(order.start_time, order.end_time)}
            />
          </View>

          {/* Notch / perforation */}
          <View style={styles.notchRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashed} />
            <View style={styles.notchRight} />
          </View>

          {/* Kategori tiket & kode */}
          <View style={styles.ticketBody}>
            {lines.map((line) => (
              <View key={line.id} style={styles.ticketLineCard}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.ticketLineLabel}>KATEGORI TIKET</Text>
                  <Text style={styles.ticketLineName}>
                    {line.category_name || 'Tiket'}
                  </Text>
                </View>
                <View style={styles.qtyPill}>
                  <Text style={styles.qtyPillText}>{line.quantity} Tiket</Text>
                </View>
              </View>
            ))}

            {flatTickets.length > 0 && (
              <View style={{ gap: 6, marginTop: 10 }}>
                {flatTickets.map((t, i) => (
                  <RowInfo
                    key={t.id}
                    label={flatTickets.length > 1 ? `Kode Unik Tiket ${i + 1}` : 'Kode Unik Tiket'}
                    value={t.ticket_code}
                    valueColor={Colors.primaryContainer}
                    valueBold
                  />
                ))}
              </View>
            )}

            {/* CTA Lihat E-Ticket */}
            <Pressable
              onPress={() => router.push(`/(tabs)/tiket` as Href)}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name="qr-code-2" size={20} color="#fff" />
              <Text style={styles.ctaText}>Lihat E-Ticket & Barcode</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Rincian Pembayaran ───────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt-long" size={20} color={Colors.primaryContainer} />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>

          <View style={{ gap: 10, marginTop: 10 }}>
            {lines.map((line) => (
              <View key={line.id} style={styles.sumRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sumLabel}>
                    {line.quantity}x {line.category_name || 'Tiket'}
                  </Text>
                  <Text style={styles.sumSub}>
                    @ {formatRupiah(line.price)}
                  </Text>
                </View>
                <Text style={styles.sumValue}>{formatRupiah(line.subtotal)}</Text>
              </View>
            ))}

            {/* Service fee */}
            {order.service_fee > 0 && (
              <View style={styles.sumRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sumLabel}>Biaya Layanan</Text>
                  <Text style={styles.sumSub}>
                    {order.service_fee_percent}% dari harga tiket
                  </Text>
                </View>
                <Text style={styles.sumValue}>{formatRupiah(order.service_fee)}</Text>
              </View>
            )}

            {/* Diskon */}
            {order.discount_amount > 0 && (
              <View style={styles.sumRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.sumLabel, { color: Colors.secondary }]}>
                    Diskon Promosi
                  </Text>
                  {order.voucher_promo_code && (
                    <View style={styles.promoPill}>
                      <Text style={styles.promoPillText}>{order.voucher_promo_code}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sumValue, { color: Colors.secondary }]}>
                  - {formatRupiah(order.discount_amount)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalSub}>Termasuk pajak & biaya layanan</Text>
            </View>
            <Text style={styles.totalValue}>{formatRupiah(order.grand_total)}</Text>
          </View>
        </View>

        {/* ─── Info Pembayaran ──────────────────────────── */}
        {payment && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="account-balance-wallet" size={20} color={Colors.primaryContainer} />
              <Text style={styles.sectionTitle}>Informasi Pembayaran</Text>
            </View>

            <View style={styles.bankBox}>
              <View style={styles.bankIconWrap}>
                <Text style={styles.bankIconText}>
                  {payment.payment_type?.includes('bca') ? 'BCA'
                    : payment.payment_type?.includes('mandiri') ? 'MDR'
                    : payment.payment_type?.toUpperCase().slice(0, 3) || 'PAY'}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.bankName}>{paymentLabel(payment.payment_type)}</Text>
                <Text style={styles.bankNumber} numberOfLines={1}>
                  {payment.transaction_id || payment.midtrans_order_id}
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedText}>
                  {payment.transaction_status?.toUpperCase() || 'OK'}
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 12 }}>
              {payment.settlement_time && (
                <RowInfo
                  label="Waktu Penyelesaian"
                  value={formatDateTime(payment.settlement_time)}
                />
              )}
              {order.customer_username && (
                <RowInfo label="Nama Pemesan" value={order.customer_username} />
              )}
              {order.customer_email && (
                <RowInfo label="Email Terdaftar" value={order.customer_email} />
              )}
              {order.customer_phone && (
                <RowInfo label="Nomor Handphone" value={order.customer_phone} />
              )}
            </View>
          </View>
        )}

        {/* ─── Tombol Invoice ───────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleDownload}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="download" size={18} color={Colors.espresso} />
            <Text style={styles.ghostBtnText}>Unduh Invoice</Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="mail" size={18} color={Colors.espresso} />
            <Text style={styles.ghostBtnText}>Kirim Email</Text>
          </Pressable>
        </View>

        {/* ─── Panduan Wristband ───────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shield" size={20} color={Colors.primaryContainer} />
            <Text style={styles.sectionTitle}>Panduan Masuk & Wristband</Text>
          </View>

          <View style={{ gap: 8, marginTop: 10 }}>
            <BulletRow text="Wajib membawa e-ticket ber-barcode dan identitas asli (KTP/Paspor)." />
            <BulletRow text="Penukaran wristband bisa dilakukan H-2 di lokasi yang ditentukan." />
            <BulletRow
              text="Dilarang membawa kamera profesional, botol kaca, atau payung panjang."
              icon="block"
            />
          </View>
        </View>

        {/* ─── Bantuan ──────────────────────────────────── */}
        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <MaterialIcons name="support-agent" size={20} color={Colors.onSecondaryFixed} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.helpTitle}>Butuh Bantuan Tiket?</Text>
            <Text style={styles.helpSub}>Customer Care aktif 24/7</Text>
          </View>
          <Pressable
            onPress={() => Alert.alert('Info', 'Menghubungi Customer Care...')}
            style={({ pressed }) => [styles.helpCta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.helpCtaText}>Hubungi</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────
function Header({
  onBack,
  onDownload,
  onShare,
}: {
  onBack: () => void;
  onDownload?: () => void;
  onShare?: () => void;
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
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Riwayat Order
          </Text>
        </View>

        <View style={styles.headerRight}>
          {onDownload && (
            <Pressable onPress={onDownload} hitSlop={8} style={styles.headerBtn}>
              <MaterialIcons name="download" size={22} color="#fff" />
            </Pressable>
          )}
          {onShare && (
            <Pressable onPress={onShare} hitSlop={8} style={styles.headerBtn}>
              <MaterialIcons name="share" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function RowInfo({
  label,
  value,
  onCopy,
  valueBold,
  valueColor,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  valueBold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        <Text
          style={[
            styles.infoValue,
            valueBold && { fontFamily: Fonts.semibold, color: valueColor || Colors.espresso },
            valueColor ? { color: valueColor } : null,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {onCopy && (
          <Pressable onPress={onCopy} hitSlop={6} style={{ padding: 4 }}>
            <MaterialIcons name="content-copy" size={14} color={Colors.primaryContainer} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function MetaRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons name={icon} size={20} color={Colors.primaryContainer} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.metaTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.metaSub} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function BulletRow({ text, icon = 'check' }: { text: string; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={styles.bulletRow}>
      <MaterialIcons
        name={icon}
        size={16}
        color={icon === 'block' ? Colors.error : Colors.secondary}
        style={{ marginTop: 2 }}
      />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryContainer },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontFamily: Fonts.regular, fontSize: 14 },

  // Header
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
    gap: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.2,
    flex: 1,
  },

  // Card generic
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  // Status banner
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  statusShort: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.onSurfaceVariant,
  },
  infoValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  infoValue: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.espresso,
    textAlign: 'right',
  },

  copyToast: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignSelf: 'center',
  },
  copyToastText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },

  // Ticket card
  ticketCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  posterWrap: { height: 176, position: 'relative' },
  poster: { width: '100%', height: '100%' },
  posterFallback: {
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(91,15,24,0.55)',
  },
  posterContent: {
    position: 'absolute',
    left: 16, right: 16, bottom: 12,
    gap: 6,
  },
  posterTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: Colors.secondaryContainer,
  },
  posterTagText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.onSecondaryContainer,
    textTransform: 'uppercase',
  },
  posterTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    color: '#fff',
    letterSpacing: -0.2,
  },

  metaSection: {
    padding: 16,
    backgroundColor: Colors.surfaceContainerLow,
    gap: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  metaTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  metaSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  // Notch
  notchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 4,
  },
  notchLeft: {
    width: 16, height: 32,
    backgroundColor: Colors.background,
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
    marginLeft: -8,
  },
  notchRight: {
    width: 16, height: 32,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
    marginRight: -8,
  },
  dashed: {
    flex: 1,
    marginHorizontal: 8,
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },

  // Ticket body
  ticketBody: {
    padding: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  ticketLineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
  },
  ticketLineLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  ticketLineName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primaryContainer,
    marginTop: 2,
  },
  qtyPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: Colors.tertiaryFixed,
  },
  qtyPillText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.onTertiaryFixed,
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    marginTop: 12,
  },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.espresso,
  },

  // Rincian pembayaran
  sumRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sumLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.espresso,
  },
  sumSub: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  sumValue: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.espresso,
  },
  promoPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.secondaryFixed,
  },
  promoPillText: {
    fontFamily: Fonts.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: Colors.onSecondaryFixed,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 12,
    opacity: 0.6,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.espresso,
  },
  totalSub: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  totalValue: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.primaryContainer,
    letterSpacing: -0.4,
  },

  // Info pembayaran
  bankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    marginTop: 12,
  },
  bankIconWrap: {
    width: 40, height: 40, borderRadius: 9999,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  bankIconText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.3,
  },
  bankName: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.espresso,
  },
  bankNumber: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  verifiedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
  },
  verifiedText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.onSurfaceVariant,
  },

  // Ghost button
  ghostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  ghostBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.espresso,
  },

  // Bullet
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.onSurfaceVariant,
  },

  // Help card
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  helpIcon: {
    width: 40, height: 40, borderRadius: 9999,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  helpTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  helpSub: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  helpCta: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
  },
  helpCtaText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: '#fff',
  },
});