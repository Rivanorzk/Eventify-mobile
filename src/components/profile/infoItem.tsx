import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string | null;
  verified?: boolean;
  badge?: string;
}

export default function InfoItem({ icon, label, value, verified, badge }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={20} color={Colors.wine} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value} numberOfLines={1}>
            {value || '-'}
          </Text>
          {verified && (
            <MaterialIcons name="check-circle" size={14} color="#1E7A4C" />
          )}
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#EDE1DB',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  value: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.espresso,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});