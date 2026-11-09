// src/app/checkout/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import VoucherSection from '@/components/checkout/VoucherSection';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { EventDetail, TicketCategory, Voucher, CreatedOrder } from '@/types/api';

// ─── API ───────────────────────────────────────────────────────
async function fetchEvent(id: string): Promise<EventDetail> {
  const res = await api.get(`/events/${id}`);
  return res.data.data;
}

async function fetchAvailableVouchers(eventId: string): Promise<Voucher[]> {
  const res = await api.get('/vouchers/available', { params: { event_id: eventId } });
  return res.data.data ?? [];
}

async function createOrderAPI(payload: any): Promise<CreatedOrder> {
  const res = await api.post('/orders', payload);
  return res.data.data;
}

// ─── Helpers ───────────────────────────────────────────────────
type CartLine = { ticket_id: number; quantity: number };

// Baca keranjang dari param `items` (JSON). Tetap mendukung format lama
// (ticket_id + quantity) supaya link lama tidak rusak.
function parseCartParams(params: {
  items?: string;
  ticket_id?: string;
  quantity?: string;
}): CartLine[] {
  if (params.items) {
    try {
      const parsed = JSON.parse(params.items);
      if (Array.isArray(parsed)) {
        const merged = new Map<number, number>();
        for (const row of parsed) {
          const id = Number(row?.ticket_id);
          const qty = Math.floor(Number(row?.quantity));
          if (Number.isFinite(id) && Number.isFinite(qty) && qty > 0) {
            merged.set(id, (merged.get(id) ?? 0) + qty);
          }
        }
        return Array.from(merged, ([ticket_id, quantity]) => ({ ticket_id, quantity }));
      }
    } catch {
      // abaikan, lanjut ke format lama
    }
  }
  if (params.ticket_id) {
    const id = Number(params.ticket_id);
    const qty = Math.floor(Number(params.quantity || 1));
    if (Number.isFinite(id)) {
      return [{ ticket_id: id, quantity: Number.isFinite(qty) && qty > 0 ? qty : 1 }];
    }
  }
  return [];
}

function estimateDiscount(v: Voucher | null, subtotal: number): number {
  if (!v) return 0;
  const value = Number(v.discount_value);
  let raw: number;
  if (v.discount_type === 'percentage') {
    raw = Math.floor((subtotal * value) / 100);
    if (v.maximum_discount != null && raw > Number(v.maximum_discount)) {
      raw = Number(v.maximum_discount);
    }
  } else {
    raw = value;
  }
  return Math.min(raw, subtotal);
}

// Persentase biaya layanan diambil OTOMATIS dari backend (event.service_fee_percent,
// sama dengan pengaturan superadmin), jadi tidak perlu diubah manual. Env
// EXPO_PUBLIC_SERVICE_FEE_PERCENT hanya cadangan kalau backend belum mengirimnya.
// Angka di checkout tetap PERKIRAAN; total final dihitung server saat order
// dibuat dan ditampilkan di halaman pembayaran.
const ENV_FEE_PERCENT = Number(process.env.EXPO_PUBLIC_SERVICE_FEE_PERCENT);

type EventWithFee = EventDetail & { service_fee_percent?: number | string | null };

function resolveFeePercent(fromApi: number | string | null | undefined): number {
  const value =
    fromApi !== null && fromApi !== undefined ? Number(fromApi) : ENV_FEE_PERCENT;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// Rumus sama dengan backend: dari harga tiket setelah diskon, dibulatkan ke rupiah.
function estimateServiceFee(amountAfterDiscount: number, percent: number): number {
  return percent > 0 ? Math.round((amountAfterDiscount * percent) / 100) : 0;
}

// 5 -> "5%", 2.5 -> "2,5%" (tanpa Intl supaya aman di semua mesin JS)
function formatPercent(value: number): string {
  return `${String(Number(value.toFixed(2))).replace('.', ',')}%`;
}

// ─── Screen ────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    event_id?: string;
    items?: string;
    ticket_id?: string;
    quantity?: string;
  }>();

  const eventId = params.event_id;
  const initialLines = useMemo(
    () => parseCartParams(params),
    [params.items, params.ticket_id, params.quantity]
  );

  const [event, setEvent] = useState<EventDetail | null>(null);
  // Kategori yang dipilih (urutan tetap), dan jumlah per kategori
  const [lineTickets, setLineTickets] = useState<TicketCategory[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [vouchersError, setVouchersError] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // ─── Load event + tiket terpilih ────────────────────────────
  useEffect(() => {
    (async () => {
      if (!eventId || initialLines.length === 0) {
        setError('Data tiket tidak lengkap');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchEvent(eventId);
        const all = data.ticket_categories || [];

        const found: TicketCategory[] = [];
        const qty: Record<number, number> = {};
        for (const line of initialLines) {
          const cat = all.find((t) => Number(t.id) === line.ticket_id);
          if (!cat) continue;
          found.push(cat);
          qty[cat.id] = Math.min(Math.max(line.quantity, 1), cat.remaining_stock || 1);
        }

        if (found.length === 0) {
          setError('Kategori tiket tidak ditemukan');
          return;
        }
        setEvent(data);
        setLineTickets(found);
        setQuantities(qty);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Gagal memuat data checkout');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, initialLines]);

  // ─── Load vouchers ──────────────────────────────────────────
  const loadVouchers = useCallback(async () => {
    if (!eventId) return;
    try {
      setVouchersLoading(true);
      setVouchersError(false);
      const list = await fetchAvailableVouchers(eventId);
      setVouchers(list);
      setSelectedVoucherId((prev) =>
        list.some((v) => v.id === prev) ? prev : null
      );
    } catch {
      setVouchersError(true);
    } finally {
      setVouchersLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const changeQty = (cat: TicketCategory, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [cat.id]: Math.min(
        cat.remaining_stock || 0,
        Math.max(0, (prev[cat.id] ?? 0) + delta)
      ),
    }));
  };

  // ─── Derived ────────────────────────────────────────────────
  const selectedVoucher = useMemo(
    () => vouchers.find((v) => v.id === selectedVoucherId) || null,
    [vouchers, selectedVoucherId]
  );

  const activeLines = useMemo(
    () =>
      lineTickets
        .map((t) => ({ ticket: t, quantity: quantities[t.id] ?? 0 }))
        .filter((l) => l.quantity > 0),
    [lineTickets, quantities]
  );

  const totalQty = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.quantity, 0),
    [activeLines]
  );

  const subtotal = useMemo(
    () =>
      activeLines.reduce((sum, l) => sum + Number(l.ticket.price) * l.quantity, 0),
    [activeLines]
  );

  const discount = useMemo(
    () => estimateDiscount(selectedVoucher, subtotal),
    [selectedVoucher, subtotal]
  );

  // Harga tiket setelah diskon, lalu ditambah biaya layanan (perkiraan).
  const finalPrice = Math.max(subtotal - discount, 0);
  const feePercent = resolveFeePercent(
    (event as EventWithFee | null)?.service_fee_percent
  );
  const hasFeeEstimate = feePercent > 0;
  const serviceFee = estimateServiceFee(finalPrice, feePercent);
  const grandTotal = finalPrice + serviceFee;

  // Auto-release voucher kalau total tiket turun di bawah minimum
  useEffect(() => {
    if (!selectedVoucher) return;
    const minimum = Number(selectedVoucher.minimum_quantity) || 1;
    if (totalQty < minimum) {
      setSelectedVoucherId(null);
      Alert.alert('Info', `Voucher dilepas, butuh minimal ${minimum} tiket`);
    }
  }, [totalQty, selectedVoucher]);

  const handleSelectVoucher = (id: number) => {
    setSelectedVoucherId((prev) => (prev === id ? null : id));
  };

  // ─── Checkout (Buat order → Midtrans) ───────────────────────
  const handleCheckout = async () => {
    if (!event || activeLines.length === 0) {
      Alert.alert('Error', 'Pilih minimal 1 tiket');
      return;
    }

    for (const line of activeLines) {
      if (line.quantity > line.ticket.remaining_stock) {
        Alert.alert(
          'Error',
          `Stok ${line.ticket.category_name} tersisa hanya ${line.ticket.remaining_stock}`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const order = await createOrderAPI({
        event_id: Number(eventId),
        user_voucher_id: selectedVoucher?.id ?? null,
        tickets: activeLines.map((l) => ({
          ticket_category_id: l.ticket.id,
          quantity: l.quantity,
        })),
      });

      // Redirect ke halaman payment (yang akan buka Midtrans Snap)
      router.replace(`/payment/${order.id}` as Href);
    } catch (err: any) {
      Alert.alert(
        'Checkout gagal',
        err?.response?.data?.message || 'Gagal membuat order'
      );
      loadVouchers(); // refresh voucher state
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Menyiapkan checkout...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !event || lineTickets.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={Colors.outline} />
          <Text style={styles.errorTitle}>Checkout tidak tersedia</Text>
          <Text style={styles.errorSub}>{error || 'Data tiket tidak ditemukan.'}</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="arrow-back" size={16} color={Colors.wine} />
            <Text style={styles.backText}>Kembali</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const canPay = totalQty > 0 && !submitting;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenContainer
        scrollProps={{ contentContainerStyle: { paddingBottom: 120 } }}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtnSm, pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="arrow-back" size={16} color={Colors.espresso} />
            <Text style={styles.backSmText}>Kembali</Text>
          </Pressable>
          <Text style={styles.topTitle}>Checkout</Text>
        </View>

        {/* Event info */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={styles.posterWrap}>
              {event.poster ? (
                <Image source={{ uri: event.poster }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, styles.posterFallback]}>
                  <MaterialIcons name="music-note" size={24} color="rgba(255,255,255,0.5)" />
                </View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="calendar-today" size={13} color="#8C7777" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {formatEventDate(event.event_date, event.start_time)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={13} color="#8C7777" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.location || 'To be announced'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ticket detail (satu baris per kategori) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="confirmation-number" size={16} color={Colors.wine} />
            <Text style={styles.cardTitle}>
              Detail Tiket{lineTickets.length > 1 ? ` (${lineTickets.length} kategori)` : ''}
            </Text>
          </View>

          {lineTickets.map((ticket) => {
            const qty = quantities[ticket.id] ?? 0;
            const soldOut = ticket.remaining_stock === 0;
            const maxed = qty >= ticket.remaining_stock;
            return (
              <View
                key={ticket.id}
                style={[styles.ticketRow, qty === 0 && { opacity: 0.55 }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.ticketName}>
                    {ticket.category_name || 'Regular'}
                  </Text>
                  <Text style={styles.ticketPrice}>
                    {formatRupiah(ticket.price)} / tiket
                  </Text>
                  {soldOut ? (
                    <Text style={styles.soldOutText}>Tiket kategori ini sudah habis.</Text>
                  ) : (
                    <Text style={styles.ticketStock}>
                      Sisa {ticket.remaining_stock} tiket
                    </Text>
                  )}
                </View>

                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => changeQty(ticket, -1)}
                    disabled={soldOut || qty === 0}
                    style={[styles.qtyBtn, qty === 0 && { opacity: 0.4 }]}
                  >
                    <MaterialIcons name="remove" size={16} color={Colors.espresso} />
                  </Pressable>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <Pressable
                    onPress={() => changeQty(ticket, 1)}
                    disabled={soldOut || maxed}
                    style={[
                      styles.qtyBtn,
                      !soldOut && styles.qtyBtnActive,
                      (soldOut || maxed) && { opacity: 0.4 },
                    ]}
                  >
                    <MaterialIcons name="add" size={16} color={soldOut ? Colors.espresso : '#fff'} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {totalQty === 0 && (
            <Text style={styles.soldOutText}>
              Pilih minimal 1 tiket untuk melanjutkan.
            </Text>
          )}
        </View>

        {/* Voucher */}
        <VoucherSection
          vouchers={vouchers}
          loading={vouchersLoading}
          error={vouchersError}
          selectedId={selectedVoucherId}
          quantity={totalQty}
          onSelect={handleSelectVoucher}
          onClear={() => setSelectedVoucherId(null)}
          onRetry={loadVouchers}
        />

        {/* Price summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitleSimple}>Ringkasan Pembayaran</Text>

          <View style={{ gap: 8, marginTop: 10 }}>
            {activeLines.map((l) => (
              <View key={l.ticket.id} style={styles.sumRow}>
                <Text style={[styles.sumLabel, { flex: 1, paddingRight: 8 }]} numberOfLines={1}>
                  {l.quantity}x {l.ticket.category_name || 'Tiket'}
                </Text>
                <Text style={styles.sumValue}>
                  {formatRupiah(Number(l.ticket.price) * l.quantity)}
                </Text>
              </View>
            ))}

            {activeLines.length > 1 && (
              <View style={[styles.sumRow, styles.subtotalRow]}>
                <Text style={styles.sumLabel}>Subtotal ({totalQty} tiket)</Text>
                <Text style={styles.sumValue}>{formatRupiah(subtotal)}</Text>
              </View>
            )}

            {discount > 0 && (
              <View style={styles.sumRow}>
                <Text style={[styles.sumLabel, { color: '#1E7A4C' }]}>
                  Diskon ({selectedVoucher?.promo_code})
                </Text>
                <Text style={[styles.sumValue, { color: '#1E7A4C' }]}>
                  -{formatRupiah(discount)}
                </Text>
              </View>
            )}

            {hasFeeEstimate && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>
                  Biaya Layanan ({formatPercent(feePercent)})
                </Text>
                <Text style={styles.sumValue}>{formatRupiah(serviceFee)}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {hasFeeEstimate ? 'Total Bayar' : 'Total Tiket'}
            </Text>
            <Text style={styles.totalValue}>{formatRupiah(grandTotal)}</Text>
          </View>

          <Text style={styles.sumNote}>
            {hasFeeEstimate
              ? 'Perkiraan. Total final tampil di halaman pembayaran setelah order dibuat.'
              : 'Biaya layanan (jika ada) ditambahkan di halaman pembayaran.'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <MaterialIcons name="verified-user" size={16} color={Colors.wine} />
          <Text style={styles.infoText}>
            Order akan menunggu pembayaran selama 15 menit. Jika belum dibayar,
            tiket akan otomatis dilepas.
          </Text>
        </View>
      </ScreenContainer>

      {/* Sticky CTA */}
      <View style={styles.stickyFooter}>
        <Pressable
          onPress={handleCheckout}
          disabled={!canPay}
          style={({ pressed }) => [
            styles.cta,
            !canPay && { opacity: 0.6 },
            pressed && { opacity: 0.9 },
          ]}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.ctaText}>Memproses...</Text>
            </>
          ) : (
            <>
              <Text style={styles.ctaText}>Bayar</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.onSurfaceVariant,
  },
  errorTitle: {
    fontFamily: Fonts.bold, fontSize: 16, color: Colors.espresso,
  },
  errorSub: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 9999, backgroundColor: Colors.cream,
    marginTop: 8,
  },
  backText: {
    fontFamily: Fonts.semibold, fontSize: 13, color: Colors.wine,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 4, paddingBottom: Spacing.md,
  },
  backBtnSm: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 9999, backgroundColor: '#fff',
  },
  backSmText: {
    fontFamily: Fonts.semibold, fontSize: 12.5, color: Colors.espresso,
  },
  topTitle: {
    fontFamily: Fonts.bold, fontSize: 18, color: Colors.espresso,
  },

  card: {
    backgroundColor: '#fff', borderRadius: Radius.xl,
    padding: 16, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: {
    fontFamily: Fonts.bold, fontSize: 13, color: Colors.espresso,
  },
  cardTitleSimple: {
    fontFamily: Fonts.bold, fontSize: 13, color: Colors.espresso,
  },

  posterWrap: {
    width: 80, height: 80, borderRadius: 12,
    overflow: 'hidden', backgroundColor: Colors.burgundy,
  },
  poster: { width: '100%', height: '100%' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  eventTitle: {
    fontFamily: Fonts.bold, fontSize: 14, color: Colors.espresso,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3,
  },
  metaText: {
    fontFamily: Fonts.regular, fontSize: 11.5, color: '#8C7777', flex: 1,
  },

  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#E5D6D0',
    gap: 12,
  },
  ticketName: {
    fontFamily: Fonts.semibold, fontSize: 13, color: Colors.espresso,
  },
  ticketPrice: {
    fontFamily: Fonts.regular, fontSize: 12, color: '#8C7777', marginTop: 2,
  },
  ticketStock: {
    fontFamily: Fonts.regular, fontSize: 11, color: '#8C7777', marginTop: 2,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5D6D0',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnActive: {
    backgroundColor: Colors.burgundy, borderColor: Colors.burgundy,
  },
  qtyText: {
    fontFamily: Fonts.bold, fontSize: 15, color: Colors.espresso,
    minWidth: 24, textAlign: 'center',
  },
  soldOutText: {
    fontFamily: Fonts.semibold, fontSize: 12.5, color: '#B3261E', marginTop: 2,
  },

  sumRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  subtotalRow: {
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0E6E1',
  },
  sumLabel: {
    fontFamily: Fonts.regular, fontSize: 13, color: '#8C7777',
  },
  sumValue: {
    fontFamily: Fonts.semibold, fontSize: 13, color: Colors.espresso,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#E5D6D0',
  },
  totalLabel: {
    fontFamily: Fonts.semibold, fontSize: 14, color: Colors.espresso,
  },
  totalValue: {
    fontFamily: Fonts.bold, fontSize: 20, color: Colors.burgundy,
  },
  sumNote: {
    fontFamily: Fonts.regular, fontSize: 11.5, lineHeight: 16, color: '#8C7777',
  },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, borderRadius: Radius.lg,
    backgroundColor: '#F8F1E7',
  },
  infoText: {
    fontFamily: Fonts.regular, fontSize: 12, lineHeight: 17,
    color: '#8C7777', flex: 1,
  },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.margin, paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5D6D0',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 9999,
    backgroundColor: Colors.burgundy,
  },
  ctaText: {
    color: '#fff', fontFamily: Fonts.bold, fontSize: 15,
  },
});