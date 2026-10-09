import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatEventDate } from '@/utils/format';
import type { Voucher } from '@/types/api';

interface Props {
  voucher: Voucher;
  selected: boolean;
  quantity: number;
  onSelect: (id: number) => void;
}

function compactRupiah(v: number): string {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `Rp${+(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp${+(n / 1_000).toFixed(1)}rb`;
  return `Rp${n}`;
}

function discountLabel(v: Voucher): string {
  return v.discount_type === 'percentage'
    ? `${Number(v.discount_value)}%`
    : compactRupiah(v.discount_value);
}

export default function VoucherOption({ voucher, selected, quantity, onSelect }: Props) {
  const minimum = Number(voucher.minimum_quantity) || 1;
  const disabled = quantity < minimum;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelect(voucher.id)}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        disabled && { opacity: 0.55 },
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.stub, disabled && { backgroundColor: '#7C726F' }]}>
        <Text style={styles.stubText} numberOfLines={1}>
          {discountLabel(voucher)}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={styles.title} numberOfLines={1}>
          {voucher.title || voucher.promo_code}
        </Text>
        <Text style={styles.sub}>
          {disabled
            ? `Butuh minimal ${minimum} tiket`
            : `Berlaku sampai ${formatEventDate(voucher.end_date)}`}
        </Text>
        {!disabled && minimum > 1 && (
          <Text style={styles.sub}>Minimal {minimum} tiket</Text>
        )}
      </View>

      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5D6D0',
    backgroundColor: '#fff',
  },
  rowSelected: {
    borderColor: Colors.wine,
    backgroundColor: '#FBF3F1',
  },
  stub: {
    width: 56,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  stubText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.espresso,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#8C7777',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#D9C5BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.wine },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: Colors.wine,
  },
});