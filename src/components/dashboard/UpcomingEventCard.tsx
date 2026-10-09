import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { getMonthDayBadge, getSalesCountdown, formatSalesStartLabel } from '@/utils/format';
import type { EventItem } from '@/types/api';

interface Props {
  event: EventItem;
  onToggleReminder: (id: number) => void;
  onDetail: (id: number) => void;
}

export default function UpcomingEventCard({ event, onToggleReminder, onDetail }: Props) {
  const { month, day } = getMonthDayBadge(event.event_date);
  const salesLabel = formatSalesStartLabel(event.sales_start_at);
  const salesCountdown = getSalesCountdown(event.sales_start_at);

  // tick tiap menit agar countdown sales update
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.card}>
      {/* Date badge */}
      <View style={styles.dateBox}>
        <Text style={styles.month}>{month}</Text>
        <Text style={styles.day}>{day}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>
          {event.category_name || 'SEGERA DIBUKA'}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {event.description || event.location || '-'}
        </Text>

        {salesLabel && salesCountdown && !salesCountdown.opened && (
          <View style={styles.salesRow}>
            <MaterialIcons name="confirmation-number" size={13} color="#B4841F" />
            <Text style={styles.salesText}>Tiket dibuka {salesLabel}</Text>
          </View>
        )}
        {salesLabel && salesCountdown && !salesCountdown.opened && (
          <Text style={styles.salesCountdown}>
            Dibuka dalam {salesCountdown.label}
          </Text>
        )}
        {salesLabel && salesCountdown?.opened && (
          <View style={styles.openedRow}>
            <MaterialIcons name="confirmation-number" size={13} color="#1E7A4C" />
            <Text style={styles.openedText}>Tiket sudah dibuka</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => onToggleReminder(event.id)}
            style={({ pressed }) => [
              styles.reminderBtn,
              event.is_reminded && styles.reminderBtnActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <MaterialIcons
              name="notifications"
              size={12}
              color={event.is_reminded ? '#fff' : Colors.burgundy}
            />
            <Text
              style={[
                styles.reminderText,
                { color: event.is_reminded ? '#fff' : Colors.burgundy },
              ]}
            >
              {event.is_reminded ? 'Diingatkan' : 'Ingatkan Saya'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onDetail(event.id)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.detailText}>Lihat Detail →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.burgundy,
  },
  day: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.burgundy,
    lineHeight: 22,
  },
  content: { flex: 1, gap: 2 },
  category: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#B4841F',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.espresso,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  salesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  salesText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#B4841F',
  },
  salesCountdown: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.burgundy,
    marginTop: 2,
  },
  openedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  openedText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#1E7A4C',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: Colors.cream,
  },
  reminderBtnActive: { backgroundColor: Colors.burgundy },
  reminderText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  detailText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.wine,
  },
});