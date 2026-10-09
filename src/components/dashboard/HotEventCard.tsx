import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { formatEventDate, formatRupiah } from '@/utils/format';

interface Props {
  title: string;
  image?: string | null;
  location?: string;
  eventDate?: string;
  startTime?: string;
  price?: number;
  onPress?: () => void;
}

export default function HotEventCard({
  title,
  image,
  location,
  eventDate,
  startTime,
  price,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <MaterialIcons name="image-not-supported" size={40} color={Colors.roseDust} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {formatEventDate(eventDate, startTime).split('•')[0].trim()}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {location && (
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={Colors.wine} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>MULAI DARI</Text>
            <Text style={styles.price}>{formatRupiah(price)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaText}>Beli Tiket</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 288,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageWrap: { height: 144, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  dateText: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    color: Colors.espresso,
  },
  body: { padding: 16, gap: 6 },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.espresso,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(219,192,192,0.3)',
  },
  priceLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  price: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.burgundy,
  },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.4)',
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.burgundy,
  },
});