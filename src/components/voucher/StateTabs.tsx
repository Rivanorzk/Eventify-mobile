import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

export type VoucherTabKey = 'available' | 'used' | 'expired';

interface TabConfig {
  key: VoucherTabKey;
  label: string;
  count: number;
}

interface Props {
  tabs: TabConfig[];
  active: VoucherTabKey;
  onChange: (key: VoucherTabKey) => void;
}

export default function StateTabs({ tabs, active, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((t) => {
        const selected = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>
              {t.label}
            </Text>
            <View style={[styles.badge, selected && styles.badgeActive]}>
              <Text style={[styles.badgeText, selected && styles.badgeTextActive]}>
                {t.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
    backgroundColor: '#F1ECEA',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  labelActive: { color: Colors.burgundy },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: Colors.burgundy },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  badgeTextActive: { color: '#fff' },
});