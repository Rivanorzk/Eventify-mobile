import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: { text: string; tone?: 'secondary' | 'burgundy' };
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

export default function MenuItem({
  icon,
  title,
  subtitle,
  badge,
  iconBg = Colors.primaryFixed,
  iconColor = Colors.primaryContainer,
  onPress,
  right,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceContainerLow }]}
    >
      <View style={styles.left}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {badge && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  badge.tone === 'burgundy'
                    ? Colors.burgundy
                    : Colors.secondary,
              },
            ]}
          >
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        )}
        {right ?? (
          <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.espresso,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.4,
  },
});