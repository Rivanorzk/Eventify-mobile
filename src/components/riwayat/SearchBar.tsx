import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  year?: string;
  onYearPress?: () => void;
}

export default function SearchBar({ value, onChangeText, year = '2025', onYearPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={Colors.outline} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Cari artis, festival, atau #order..."
          placeholderTextColor="rgba(136,114,113,0.7)"
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      <Pressable
        onPress={onYearPress}
        style={({ pressed }) => [styles.yearBtn, pressed && { opacity: 0.8 }]}
      >
        <MaterialIcons name="calendar-today" size={14} color={Colors.secondary} />
        <Text style={styles.yearText}>{year}</Text>
        <MaterialIcons name="expand-more" size={16} color={Colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurface,
    paddingVertical: 2,
  },
  yearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  yearText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.primaryContainer,
  },
});