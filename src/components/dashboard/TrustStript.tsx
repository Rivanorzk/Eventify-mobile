import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function TrustStrip() {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <MaterialIcons name="verified-user" size={22} color={Colors.burgundy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>100% Garansi Tiket Resmi</Text>
          <Text style={styles.subtitle}>Barcode QR unik terenkripsi & transfer instan</Text>
        </View>
      </View>
      <MaterialIcons name="shield" size={20} color="rgba(91,15,24,0.6)" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.5)',
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.espresso,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
});