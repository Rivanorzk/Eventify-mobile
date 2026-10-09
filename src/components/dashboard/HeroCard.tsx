import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { formatEventDate, formatRupiah } from '@/utils/format';

interface Props {
  title: string;
  image?: string | null;
  eventDate?: string;
  startTime?: string;
  location?: string;
  price?: number;
  onPress?: () => void;
}

export default function HeroCard({
  title,
  image,
  eventDate,
  startTime,
  location,
  price,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Image / Fallback */}
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <MaterialIcons name="music-note" size={64} color={Colors.roseDust} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(30,30,30,0.35)', 'rgba(30,30,30,0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom content */}
        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={14} color={Colors.roseDust} />
            <Text style={styles.metaText}>
              {formatEventDate(eventDate, startTime)}
            </Text>
            {location && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <MaterialIcons name="stadium" size={14} color={Colors.roseDust} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {location}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Ticket notch strip */}
      <View style={styles.notchStrip}>
        <View style={styles.notchLeft} />
        <View style={styles.dashed}>
          {Array.from({ length: 11 }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        <View style={styles.notchRight} />
      </View>

      {/* Pricing & CTA */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>HARGA MULAI DARI</Text>
          <Text style={styles.price}>{formatRupiah(price)}</Text>
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.96 }] }]}
        >
          <Text style={styles.ctaText}>Beli Tiket</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.4)',
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  imageWrap: { height: 260, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    gap: 6,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: '#fff',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  metaDot: { color: 'rgba(255,255,255,0.6)', marginHorizontal: 2 },

  notchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(248,241,231,0.7)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: Colors.background,
    marginLeft: -8,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
  },
  dashed: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    opacity: 0.4,
  },
  dash: {
    height: 2,
    width: 8,
    borderRadius: 9999,
    backgroundColor: Colors.burgundy,
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: Colors.background,
    marginRight: -8,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
  },
  footer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    gap: 12,
  },
  priceLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
  },
  price: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.burgundy,
    letterSpacing: -0.3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.burgundy,
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});