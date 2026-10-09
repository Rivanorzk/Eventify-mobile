import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

const RULES = [
  {
    icon: 'shopping-cart',
    title: 'Redeem Saat Checkout',
    subtitle: 'Pilih voucher pada menu pembayaran',
    tag: 'Otomatis',
  },
  {
    icon: 'calendar-today',
    title: 'Masa Berlaku Voucher',
    subtitle: 'Klaim voucher aktif hingga 30 hari ke depan',
    tag: '30 Hari',
  },
  {
    icon: 'confirmation-number',
    title: '1 Voucher Per Transaksi',
    subtitle: 'Tidak dapat digabung promo sejenis',
    tag: '1x Pakai',
  },
];

export default function TermsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="verified" size={18} color={Colors.primaryContainer} />
        </View>
        <Text style={styles.headerText}>Syarat & Ketentuan Voucher</Text>
      </View>

      <View style={{ gap: 10 }}>
        {RULES.map((r) => (
          <View key={r.title} style={styles.ruleRow}>
            <View style={styles.ruleLeft}>
              <View style={styles.ruleIcon}>
                <MaterialIcons
                  name={r.icon as any}
                  size={18}
                  color={Colors.primaryContainer}
                />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.ruleTitle}>{r.title}</Text>
                <Text style={styles.ruleSubtitle}>{r.subtitle}</Text>
              </View>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{r.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.2)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    gap: 8,
  },
  ruleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,218,218,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  ruleSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
  },
  tagText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.primaryContainer,
    letterSpacing: 0.4,
  },
});