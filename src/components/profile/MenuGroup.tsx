import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  children: ReactNode;
}

export default function MenuGroup({ title, children }: Props) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});