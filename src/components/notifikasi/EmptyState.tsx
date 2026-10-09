import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface Props {
  filter: 'all' | 'unread' | 'read';
}

export default function EmptyState({ filter }: Props) {
  const subtitle =
    filter === 'unread'
      ? 'Semua notifikasi sudah Anda baca.'
      : filter === 'read'
      ? 'Belum ada notifikasi yang sudah dibaca.'
      : 'Tidak ada pembaruan saat ini. Semua pengingat konser Anda akan tampil di sini.';

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="notifications-paused" size={32} color={Colors.outline} />
      </View>
      <Text style={styles.title}>Belum Ada Notifikasi</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 6,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: Colors.onSurface,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
});