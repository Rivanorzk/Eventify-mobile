import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
}

export default function FAQItem({ icon, title, body }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons name={icon} size={20} color={Colors.burgundy} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={20}
          color={Colors.onSurfaceVariant}
        />
      </Pressable>

      {open && (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{body}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(234,219,219,1)',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.espresso,
    flex: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0E5DC',
  },
  bodyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.onSurfaceVariant,
    paddingTop: 10,
  },
});