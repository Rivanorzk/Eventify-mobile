import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface TabConfig {
  name: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

/** Urutan & nama harus sama dengan file di src/app/(tabs)/ */
const TABS: TabConfig[] = [
  { name: 'index', label: 'Dashboard', icon: 'explore' },
  { name: 'tiket', label: 'Tiket', icon: 'confirmation-number' },
  { name: 'riwayat', label: 'Riwayat', icon: 'receipt-long' },
  { name: 'voucher', label: 'Voucher', icon: 'local-offer' },
  { name: 'akun', label: 'Akun', icon: 'person' },
];

/**
 * Inline type — menghindari konflik type dari expo-router bundled
 * @react-navigation/bottom-tabs vs yang standalone.
 */
type BottomNavProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: any) => { defaultPrevented: boolean };
  };
};

export default function BottomNav({ state, navigation }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          const isFocused = state.index === index;
          const color = isFocused
            ? Colors.onPrimary // putih penuh
            : 'rgba(255,255,255,0.55)'; // putih pudar

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  isFocused && styles.iconWrapActive,
                ]}
              >
                <MaterialIcons name={tab.icon} size={22} color={color} />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: isFocused ? Fonts.bold : Fonts.medium,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.primaryContainer, // 🍷 burgundy #5b0f18
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  item: {
    flex: 1,
    minWidth: 56,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)', // pill putih transparan
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
});