import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Colors, Fonts, Hairline, Spacing } from '@/constants/theme';

const BRAND_LOGO =
  'https://res.cloudinary.com/dsdv1ovoc/image/upload/v1791204591/Eventify_wh7izn.png';

interface Props {
  hideNotification?: boolean;
  hideAvatar?: boolean;
}

export default function AppHeader({
  hideNotification = false,
  hideAvatar = false,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  // ← Ambil unread count
  const { count: unread } = useUnreadCount({ pollMs: 30000 });

  const goHome = () => router.push('/(tabs)' as Href);
  const goNotifikasi = () => router.push('/notifikasi' as Href);
  const goProfile = () => router.push('/(tabs)/akun' as Href);

  const badgeText = unread > 99 ? '99+' : String(unread);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Brand */}
        <Pressable
          onPress={goHome}
          style={({ pressed }) => [styles.left, pressed && { opacity: 0.8 }]}
        >
          <Image source={{ uri: BRAND_LOGO }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>Eventify</Text>
        </Pressable>

        {/* Right actions */}
        <View style={styles.right}>
          {!hideNotification && (
            <Pressable
              accessibilityLabel="Notifikasi"
              onPress={goNotifikasi}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="notifications" size={24} color={Colors.onPrimary} />

              {/* 🔴 Badge angka unread */}
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {badgeText}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {!hideAvatar && (
            <Pressable
              onPress={goProfile}
              style={({ pressed }) => [styles.avatarRing, pressed && { opacity: 0.85 }]}
            >
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.primaryContainer,
    borderBottomWidth: Hairline,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  row: {
    height: 64,
    paddingHorizontal: Spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logo: { height: 32, width: 32, borderRadius: 8 },
  brand: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    letterSpacing: -0.1,
    color: Colors.onPrimary,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },

  // 🔴 Badge merah dengan angka
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 9999,
    paddingHorizontal: 5,
    backgroundColor: '#E53935',           // merah terang
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryContainer,  // biar "cut out" dari header burgundy
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },

  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 32, height: 32, borderRadius: 9999 },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.onPrimary,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});