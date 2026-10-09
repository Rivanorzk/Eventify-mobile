import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';
import type { AppNotification } from '@/types/api';

interface Props {
  notification: AppNotification;
  onPress?: () => void;
  onAction?: () => void;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function NotificationCard({ notification, onPress, onAction }: Props) {
  const unread = !notification.is_read;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        unread ? styles.cardUnread : null,
        pressed ? { opacity: 0.96 } : null,
      ]}
    >
      {unread ? <View style={styles.accentBar} /> : null}

      <View style={styles.row}>
        <View style={[styles.iconWrap, unread ? styles.iconWrapUnread : null]}>
          <MaterialIcons
            name="notifications"
            size={20}
            color={unread ? '#fff' : Colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.timeText}>{timeAgo(notification.created_at)}</Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text
            style={[styles.title, unread ? styles.titleUnread : null]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>

          {/* DB field = "message" */}
          <Text style={styles.body} numberOfLines={3}>
            {notification.message}
          </Text>

          {/* DB field = "link" */}
          {notification.link ? (
            <Pressable
              onPress={onAction}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <MaterialIcons name="arrow-forward" size={15} color="#fff" />
              <Text style={styles.actionText}>Lihat Detail</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 14,
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardUnread: {
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primaryContainer,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapUnread: {
    backgroundColor: Colors.primaryContainer,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.onSurface,
    letterSpacing: -0.1,
  },
  titleUnread: {
    color: Colors.espresso,
    fontFamily: Fonts.bold,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.onSurfaceVariant,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    marginTop: 6,
  },
  actionText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
});