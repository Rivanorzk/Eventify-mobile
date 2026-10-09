import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';

export interface CategoryChip {
  id: string | number;
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

interface Props {
  categories: CategoryChip[];
  activeId: string | number;
  onChange: (id: string | number) => void;
}

export default function CategoryPills({ categories, activeId, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed && { opacity: 0.85 },
            ]}
          >
            {cat.icon && (
              <MaterialIcons
                name={cat.icon}
                size={16}
                color={isActive ? '#fff' : Colors.wine}
              />
            )}
            <Text
              style={[
                styles.chipText,
                { color: isActive ? '#fff' : Colors.espresso },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  chipActive: {
    backgroundColor: Colors.burgundy,
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.5)',
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});