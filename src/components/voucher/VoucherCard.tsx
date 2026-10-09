import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import type { Voucher } from '@/types/api';

interface Props {
  voucher: Voucher;
  onUseInEvent?: (eventId: number) => void;
  onPress?: () => void;
}

function compactRupiah(v: number): string {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `Rp${+(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp${+(n / 1_000).toFixed(1)}rb`;
  return `Rp${n}`;
}

function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

function formatDate(d?: string | null): string {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  const day = dt.getDate();
  const month = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][dt.getMonth()];
  return `${day} ${month} ${dt.getFullYear()}`;
}

const STATE_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  used:     { label: 'Sudah dipakai',  bg: '#F1ECEA', fg: '#5F5551' },
  expired:  { label: 'Kedaluwarsa',    bg: '#FEE2E2', fg: '#B91C1C' },
  inactive: { label: 'Tidak aktif',    bg: '#F1ECEA', fg: '#5F5551' },
  upcoming: { label: 'Akan datang',    bg: '#FEF3C7', fg: '#B45309' },
};

export default function VoucherCard({ voucher, onUseInEvent }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const isPercent = voucher.discount_type === 'percentage';
  const isUsable = voucher.state === 'available';
  const isMuted = !isUsable && voucher.state !== 'upcoming';
  const days = isUsable ? daysLeft(voucher.end_date) : null;
  const endingSoon = isUsable && days !== null && days <= 3;
  const badge = STATE_BADGE[voucher.state];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(voucher.promo_code);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={styles.wrap}>
      {/* Ticket stub left */}
      <View style={[styles.stub, isMuted && styles.stubMuted]}>
        <Text
          style={[
            styles.stubValue,
            { fontSize: isPercent ? 28 : 22 },
          ]}
          numberOfLines={1}
        >
          {isPercent ? `${Number(voucher.discount_value)}%` : compactRupiah(voucher.discount_value)}
        </Text>
        <Text style={styles.stubLabel}>
          {isPercent ? 'diskon' : 'potongan'}
        </Text>
      </View>

      {/* Dashed separator with notches */}
      <View style={styles.separatorCol}>
        <View style={styles.notchTop} />
        <View style={styles.dashed} />
        <View style={styles.notchBottom} />
      </View>

      {/* Right detail */}
      <View style={styles.detail}>
        {/* Title + state badge */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {voucher.title || 'Voucher'}
          </Text>
          {badge && (
            <View style={[styles.stateBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.stateText, { color: badge.fg }]}>
                {badge.label}
              </Text>
            </View>
          )}
          {endingSoon && (
            <View style={[styles.stateBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.stateText, { color: '#B45309' }]}>
                {days === 0 ? 'Segera berakhir' : `${days} hari lagi`}
              </Text>
            </View>
          )}
        </View>

        {/* Event */}
        <View style={styles.eventRow}>
          <MaterialIcons name="confirmation-number" size={14} color={Colors.wine} />
          <Text style={styles.eventText} numberOfLines={1}>
            {voucher.event_title ? `Untuk ${voucher.event_title}` : 'Event tertentu'}
          </Text>
        </View>

        {/* Rule list */}
        <View style={styles.rules}>
          <Text style={styles.ruleText}>Minimal {voucher.minimum_quantity} tiket</Text>
          {isPercent &&
            voucher.maximum_discount !== null &&
            voucher.maximum_discount !== undefined && (
              <Text style={styles.ruleText}>
                Maksimal potongan {formatRupiah(voucher.maximum_discount)}
              </Text>
            )}
          <View style={styles.ruleInline}>
            <MaterialIcons name="event" size={12} color={Colors.wine} />
            <Text style={styles.ruleText}>
              {voucher.state === 'upcoming'
                ? `Berlaku mulai ${formatDate(voucher.start_date)}`
                : voucher.state === 'used' && voucher.used_at
                ? `Dipakai pada ${formatDate(voucher.used_at)}`
                : `Berlaku sampai ${formatDate(voucher.end_date)}`}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [styles.codeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.codeText} numberOfLines={1}>
              {voucher.promo_code}
            </Text>
            <MaterialIcons
              name={copied ? 'check' : 'content-copy'}
              size={14}
              color={copied ? '#047857' : Colors.onSurfaceVariant}
            />
          </Pressable>

          {isUsable && voucher.event_id && onUseInEvent && (
            <Pressable
              onPress={() => onUseInEvent(voucher.event_id!)}
              style={({ pressed }) => [styles.useBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.useText}>Pakai di Event</Text>
              <MaterialIcons name="chevron-right" size={16} color={Colors.wine} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const STUB_WIDTH = 100;
const NOTCH_SIZE = 18;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(229,214,208,1)',
    overflow: 'hidden',
  },

  // Stub
  stub: {
    width: STUB_WIDTH,
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubMuted: { backgroundColor: '#7C726F' },
  stubValue: {
    fontFamily: Fonts.bold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  stubLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },

  // Dashed separator (with notches)
  separatorCol: {
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  dashed: {
    flex: 1,
    width: 1.5,
    borderStyle: 'dashed',
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(229,214,208,1)',
  },
  notchTop: {
    position: 'absolute',
    top: -NOTCH_SIZE / 2,
    left: -NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(229,214,208,1)',
  },
  notchBottom: {
    position: 'absolute',
    bottom: -NOTCH_SIZE / 2,
    left: -NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(229,214,208,1)',
  },

  // Detail
  detail: { flex: 1, padding: 14, gap: 8, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.espresso,
    letterSpacing: -0.1,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stateText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
    flex: 1,
  },

  rules: { gap: 3, marginTop: 2 },
  ruleText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  ruleInline: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D9C5BE',
    backgroundColor: '#FAF7F5',
    maxWidth: '100%',
  },
  codeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#3A2A2C',
    letterSpacing: 0.6,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  useText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
  },
});