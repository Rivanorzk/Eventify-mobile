import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onFilterPress?: () => void;
}

export default function SearchBar({ value, onChangeText, onFilterPress }: Props) {
  return (
    <View style={styles.wrap}>
      <MaterialIcons
        name="search"
        size={20}
        color={Colors.onSurfaceVariant}
        style={styles.leftIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Cari artis, konser, atau festival..."
        placeholderTextColor="rgba(85,66,66,0.6)"
        style={styles.input}
        returnKeyType="search"
      />
      <Pressable
        onPress={onFilterPress}
        style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons name="tune" size={16} color={Colors.wine} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.6)',
    borderRadius: 9999,
    paddingLeft: 16,
    paddingRight: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  leftIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.espresso,
    paddingVertical: 10,
  },
  filterBtn: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});