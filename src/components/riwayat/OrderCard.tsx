import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatEventDate, formatRupiah } from '@/utils/format';
import type { Order } from '@/types/api';

type Variant = 'pending' | 'completed' | 'archive';

interface Props {
  order: Order;
  variant: Variant;
  onPress?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

function formatDeadline(deadline?: string | null): string {
  if (!deadline) return '-';
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ][d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} • ${hh}:${mm} WIB`;
}

const STATUS_META: Record<Variant, { label: string; icon: string; bg: string; fg: string }> = {
  pending: {
    label: 'Menunggu Bayar',
    icon: 'hourglass-empty',
    bg: Colors.secondaryFixed,
    fg: Colors.onSecondaryContainer,
  },
  completed: {
    label: 'Lunas & Selesai',
    icon: 'check-circle',
    bg: Colors.surfaceContainerHighest,
    fg: Colors.primaryContainer,
  },
  archive: {
    label: 'Konser Selesai',
    icon: 'history',
    bg: Colors.surfaceContainer,
    fg: Colors.onSurfaceVariant,
  },
};

export default function OrderCard({
  order,
  variant,
  onPress,
  onPrimaryAction,
  onSecondaryAction,
}: Props) {
  const meta = STATUS_META[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
    >
      {/* Pending top accent */}
      {variant === 'pending' && <View style={styles.topAccent} />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name={variant === 'completed' ? 'confirmation-number' : 'receipt-long'}
            size={16}
            color={variant === 'pending' ? Colors.secondary : Colors.outline}
          />
          <Text style={styles.orderId}>ORDER #{order.invoice_number}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          {variant === 'pending' && <View style={styles.pulseDot} />}
          <MaterialIcons
            name={meta.icon as any}
            size={13}
            color={meta.fg}
          />
          <Text style={[styles.statusText, { color: meta.fg }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Body: poster + info */}
      <View style={styles.body}>
        <View style={styles.posterWrap}>
          {order.poster ? (
            <Image source={{ uri: order.poster }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterFallback]}>
              <MaterialIcons name="music-note" size={28} color={Colors.burgundy} />
            </View>
          )}
          {order.event_location && (
            <View style={styles.venueTag}>
              <Text style={styles.venueTagText} numberOfLines={1}>
                {order.event_location.split(',')[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {order.event_title || 'Event'}
          </Text>

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-month" size={13} color={Colors.secondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatEventDate(order.event_date, order.start_time)}
            </Text>
          </View>

          {order.event_location && (
            <View style={styles.metaRow}>
              <MaterialIcons name="location-on" size={13} color={Colors.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {order.event_location}
              </Text>
            </View>
          )}

          {/* Quantity line (only for pending/completed) */}
          {variant !== 'archive' && (
            <Text style={styles.lineItem} numberOfLines={1}>
              {order.quantity ?? order.ticket_count ?? 1}x{' '}
              <Text style={styles.lineItemStrong}>{order.category_name || 'Tiket'}</Text>
              {order.seat_info ? ` (${order.seat_info})` : ''}
            </Text>
          )}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatRupiah(order.final_price)}</Text>
          </View>
        </View>
      </View>

      {/* Pending: VA box */}
      {variant === 'pending' && (
        <View style={styles.vaBox}>
            {/* Static deadline row */}
            <View style={styles.deadlineRow}>
            <View style={styles.deadlineLeft}>
                <MaterialIcons name="timer" size={16} color={Colors.secondary} />
                <Text style={styles.deadlineLabel}>BATAS WAKTU BAYAR</Text>
            </View>
            <Text style={styles.deadlineValue}>
                {formatDeadline(order.payment_deadline)}
            </Text>
            </View>

            <View style={styles.vaInner}>
            <View style={styles.vaLeft}>
                <View style={styles.bankChip}>
                <Text style={styles.bankChipText}>
                    {order.payment_type?.toUpperCase() || 'BCA VA'}
                </Text>
                </View>
                <Text style={styles.vaNumber}>
                {order.payment_va || '8273 0918 2746 119'}
                </Text>
            </View>
            <Pressable style={styles.copyBtn}>
                <MaterialIcons name="content-copy" size={13} color={Colors.secondary} />
                <Text style={styles.copyText}>Salin</Text>
            </Pressable>
            </View>
        </View>
        )}

      {/* Completed: perforation */}
      {variant === 'completed' && (
        <View style={styles.notchRow}>
          <View style={styles.notchLeft} />
          <View style={styles.dashed} />
          <View style={styles.notchRight} />
        </View>
      )}

      {/* Completed: payment summary */}
      {variant === 'completed' && (
        <View style={styles.paymentRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.payLabel}>Metode Pembayaran</Text>
            <Text style={styles.payValue} numberOfLines={1}>
              {order.payment_type || 'BCA KlikPay'} •{' '}
              {new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.payLabel}>Total Bayar</Text>
            <Text style={styles.payTotal}>{formatRupiah(order.final_price)}</Text>
          </View>
        </View>
      )}

      {/* Archive: rating */}
      {variant === 'archive' && (
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color={Colors.secondary} />
          <Text style={styles.ratingText}>
            {order.rating?.toFixed(1) || '5.0'} Dinilai oleh kamu
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {variant === 'pending' && (
          <>
            <Pressable
              onPress={onPrimaryAction}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.primaryText}>Bayar Sekarang</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={onSecondaryAction}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="receipt" size={16} color={Colors.primaryContainer} />
              <Text style={styles.ghostText}>Detail</Text>
            </Pressable>
          </>
        )}

        {variant === 'completed' && (
          <>
            <Pressable
              onPress={onSecondaryAction}
              style={({ pressed }) => [styles.softBtn, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name="receipt-long" size={16} color={Colors.primaryContainer} />
              <Text style={styles.softText}>E-Receipt</Text>
            </Pressable>
            <Pressable
              onPress={onPrimaryAction}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name="qr-code-2" size={16} color="#fff" />
              <Text style={styles.primaryText}>Buka E-Ticket</Text>
            </Pressable>
          </>
        )}

        {variant === 'archive' && (
          <>
            <Pressable
              onPress={onPrimaryAction}
              style={({ pressed }) => [styles.softBtn, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name="photo-library" size={16} color={Colors.primaryContainer} />
              <Text style={styles.softText}>Kilas Balik Konser</Text>
            </Pressable>
            <Pressable
              onPress={onSecondaryAction}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="share" size={16} color={Colors.onSurfaceVariant} />
              <Text style={[styles.ghostText, { color: Colors.onSurfaceVariant }]}>
                Bagikan
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    overflow: 'hidden',
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  orderId: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  pulseDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.3,
  },

  body: { flexDirection: 'row', gap: 12 },
  posterWrap: { position: 'relative' },
  poster: {
    width: 80, height: 96,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  posterFallback: {
    alignItems: 'center', justifyContent: 'center',
  },
  venueTag: {
    position: 'absolute',
    bottom: 4, right: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(91,15,24,0.85)',
  },
  venueTagText: {
    color: '#fff', fontFamily: Fonts.bold,
    fontSize: 8.5, letterSpacing: 0.4,
  },
  info: { flex: 1, minWidth: 0, gap: 3, justifyContent: 'center' },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primaryContainer,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  lineItem: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurface,
    marginTop: 3,
  },
  lineItemStrong: {
    fontFamily: Fonts.semibold,
    color: Colors.primaryContainer,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 5,
  },
  totalLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  totalValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primaryContainer,
  },

  // VA Box
  vaBox: {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  backgroundColor: Colors.surfaceContainerLow,
  gap: 10,
},
deadlineRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
},
deadlineLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
deadlineLabel: {
  fontFamily: Fonts.bold,
  fontSize: 10,
  letterSpacing: 0.8,
  color: Colors.secondary,
},
deadlineValue: {
  fontFamily: Fonts.bold,
  fontSize: 12,
  color: Colors.primaryContainer,
  letterSpacing: 0.3,
},
vaInner: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 10,
  borderTopWidth: 1,
  borderTopColor: 'rgba(219,192,192,0.3)',
  gap: 8,
},
  
  vaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bankChip: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainer,
  },
  bankChipText: {
    fontFamily: Fonts.bold, fontSize: 10,
    color: Colors.primaryContainer, letterSpacing: 0.4,
  },
  vaNumber: {
    fontFamily: Fonts.bold, fontSize: 13,
    color: Colors.onSurface, letterSpacing: 0.8,
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  copyText: {
    fontFamily: Fonts.bold, fontSize: 10.5,
    color: Colors.secondary,
  },

  // Perforation
  notchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  notchLeft: {
    width: 14, height: 24, marginLeft: -22,
    borderTopRightRadius: 9999, borderBottomRightRadius: 9999,
    backgroundColor: Colors.background,
    borderWidth: 1, borderLeftWidth: 0,
    borderColor: 'rgba(219,192,192,0.4)',
  },
  notchRight: {
    width: 14, height: 24, marginRight: -22,
    borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999,
    backgroundColor: Colors.background,
    borderWidth: 1, borderRightWidth: 0,
    borderColor: 'rgba(219,192,192,0.4)',
  },
  dashed: {
    flex: 1,
    marginHorizontal: 8,
    borderStyle: 'dashed',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(219,192,192,0.6)',
  },

  // Completed payment
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  payLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  payValue: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.onSurface,
    marginTop: 2,
  },
  payTotal: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primaryContainer,
    marginTop: 2,
  },

  // Archive rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  ratingText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.secondary,
  },

  // Actions
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
  },
  primaryText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#fff',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLow,
  },
  ghostText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.primaryContainer,
  },
  softBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLow,
  },
  softText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.primaryContainer,
  },
});