import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent?: string;
}

export default function StatTile({
  label,
  value,
  sub,
  icon,
  accent = Colors.cream,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {sub && (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      <View style={[styles.iconBox, { backgroundColor: accent }]}>
        <MaterialIcons name={icon} size={20} color={Colors.burgundy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 16,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.espresso,
    marginTop: 4,
  },
  sub: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});