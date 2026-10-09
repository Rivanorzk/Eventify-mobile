import React from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type NotificationFilter = 'all' | 'unread' | 'read';

interface Props {
  active: NotificationFilter;
  counts: { all: number; unread: number; read: number };
  onChange: (f: NotificationFilter) => void;
}

const CHIPS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum dibaca' },
  { key: 'read', label: 'Sudah dibaca' },
];

export default function FilterChips({ active, counts, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {CHIPS.map((c) => {
        const isActive = c.key === active;
        const count = counts[c.key];
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.chipText, { color: isActive ? '#fff' : Colors.onSurfaceVariant }]}>
              {c.label} ({count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
    shadowColor: Colors.primaryContainer,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipInactive: { backgroundColor: Colors.surfaceContainer },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
});