import React from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type FilterKey = 'all' | 'pending' | 'paid' | 'cancelled';

interface Pill {
  key: FilterKey;
  label: string;
  count?: number;
}

interface Props {
  filters: Pill[];
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

export default function FilterPills({ filters, active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {filters.map((f) => {
        const isActive = f.key === active;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={({ pressed }) => [
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#fff' : Colors.onSurfaceVariant },
              ]}
            >
              {f.label}
            </Text>
            {!!f.count && f.count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.25)'
                      : Colors.secondaryContainer,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isActive ? '#fff' : Colors.onSecondaryContainer },
                  ]}
                >
                  {f.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  pillActive: {
    backgroundColor: Colors.primaryContainer,
    shadowColor: Colors.primaryContainer,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillInactive: { backgroundColor: Colors.surfaceContainerLow },
  pillText: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
});