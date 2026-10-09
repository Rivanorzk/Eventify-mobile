import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { getCountdownParts } from '@/utils/format';
import type { Ticket } from '@/types/api';

interface Props {
  ticket: Ticket;
  onPress: () => void;
}

export default function ActiveTicketCard({ ticket, onPress }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = getCountdownParts(ticket.event_date, ticket.start_time);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[Colors.burgundy, '#3A0810']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <MaterialIcons name="confirmation-number" size={14} color="#F3D9A4" />
            <Text style={styles.brandText}>Eventify Pass</Text>
          </View>
          <Text style={styles.code}>{ticket.ticket_code}</Text>
        </View>

        <Text style={styles.category}>{ticket.category_name?.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {ticket.event_title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {ticket.location}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Kategori</Text>
            <Text style={styles.infoValue}>{ticket.category_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{ticket.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.countdownRow}>
        <View style={styles.qrBox}>
          <MaterialIcons name="qr-code" size={30} color={Colors.espresso} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cdLabel}>Waktu Hitung Mundur</Text>
          <Text style={styles.cdValue}>
            {countdown?.expired
              ? 'Event dimulai'
              : countdown
              ? `${String(countdown.days).padStart(2, '0')}h : ${String(
                  countdown.hours
                ).padStart(2, '0')}j : ${String(countdown.minutes).padStart(2, '0')}m`
              : '-'}
          </Text>
          <Text style={styles.cdDate}>{ticket.event_date}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
      >
        <MaterialIcons name="qr-code" size={16} color={Colors.burgundy} />
        <Text style={styles.ctaText}>Lihat E-Ticket & QR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.burgundy,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  body: { padding: 20, gap: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: '#F3D9A4',
  },
  code: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  category: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 14,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#fff',
    marginTop: 2,
  },
  location: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  infoRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  infoItem: { gap: 2 },
  infoLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  infoValue: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: '#fff',
    textTransform: 'capitalize',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qrBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  cdValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#fff',
  },
  cdDate: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#F3D9A4',
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.burgundy,
  },
});