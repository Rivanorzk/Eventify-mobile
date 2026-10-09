import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ScreenContainer from '@/components/ScreenContainer';
import MenuItem from '@/components/profile/MenuItem';
import MenuGroup from '@/components/profile/MenuGroup';
import InfoItem from '@/components/profile/infoItem';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Ticket, UserProfile, Voucher } from '@/types/api';

const COVER_FALLBACK =
  'https://lh3.googleusercontent.com/aida/AEtjO1XXw2oLKmsXTymzju6A-0K2tPRFjdN_lzoMSWwU1kmzkSz_vNXstXBPB4red8szRBggDCJc8t_s8tRAOBL9uwyeXxnPrTPM9wsIK2SMGVALWI0Y9kG-RKaXybnljHqOgF0ecOo41lRRrG_MPa6KVSYc7RD7bg2lyFoyCePOMogzJpUH9jB2xAwCzOR0uSGlqlGXM9R5OJOzsl3jY83rkJZ_L0hmf0O5ydxOjCpxMffxXiV5dJird_kKhMg';

// Batas upload di backend (middleware/upload.js): 5 MB
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type UploadField = 'avatar' | 'cover';

export default function AkunScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Data segar dari GET /users/me (punya cover_image). `user` dari
  // AuthContext dipakai sebagai cadangan sebelum data selesai dimuat.
  const [me, setMe] = useState<UserProfile | null>(null);
  const profile = me ?? (user as UserProfile | null);

  const [stats, setStats] = useState({
    attended: 0,
    activeTickets: 0,
    vouchers: 0,
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [presaleReminder, setPresaleReminder] = useState(true);

  // ─── Muat profil + statistik tiap layar ini difokuskan ────
  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const [meRes, ticketsRes, vouchersRes] = await Promise.allSettled([
          api.get('/users/me'),
          api.get('/tickets/my'),
          api.get('/vouchers/my'), // khusus customer; admin → 403, dihitung 0
        ]);
        if (!alive) return;

        if (meRes.status === 'fulfilled') {
          setMe(meRes.value.data.data as UserProfile);
        }

        const tickets: Ticket[] =
          ticketsRes.status === 'fulfilled'
            ? ticketsRes.value.data.data ?? []
            : [];
        const vouchers: Voucher[] =
          vouchersRes.status === 'fulfilled'
            ? vouchersRes.value.data.data ?? []
            : [];

        // "Konser dihadiri" = konser unik yang tiketnya sudah di-scan di gate
        const attendedEvents = new Set(
          tickets
            .filter((t) => t.status === 'used')
            .map((t) => `${t.event_title}|${t.event_date}`)
        );

        setStats({
          attended: attendedEvents.size,
          activeTickets: tickets.filter((t) => t.status === 'active').length,
          vouchers: vouchers.filter((v) => v.state === 'available').length,
        });
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  // ─── Pick & upload image ───────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin ditolak', 'Aktifkan izin galeri untuk mengubah foto.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
      Alert.alert('Foto terlalu besar', 'Ukuran maksimal foto adalah 5 MB.');
      return null;
    }
    return asset;
  };

  // Nama field harus sama dengan backend: upload.single("avatar") / ("cover")
  const uploadImage = async (
    asset: ImagePicker.ImagePickerAsset,
    endpoint: string,
    field: UploadField
  ): Promise<UserProfile> => {
    const formData = new FormData();
    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    const mime =
      asset.mimeType || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);

    formData.append(field, {
      uri: asset.uri,
      name: `${field}.${ext}`,
      type: mime,
    } as any);

    const res = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as UserProfile;
  };

  const handleAvatarPress = async () => {
    try {
      const asset = await pickImage();
      if (!asset) return;
      setAvatarUploading(true);
      const updated = await uploadImage(asset, '/users/me/avatar', 'avatar');
      setMe((prev) => ({ ...(prev ?? (profile as UserProfile)), ...updated }));
      Alert.alert('Berhasil', 'Foto profil berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert(
        'Gagal upload',
        err?.response?.data?.message || 'Terjadi kesalahan, coba lagi.'
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverPress = async () => {
    try {
      const asset = await pickImage();
      if (!asset) return;
      setCoverUploading(true);
      const updated = await uploadImage(asset, '/users/me/cover', 'cover');
      setMe((prev) => ({ ...(prev ?? (profile as UserProfile)), ...updated }));
      Alert.alert('Berhasil', 'Banner berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert(
        'Gagal upload',
        err?.response?.data?.message || 'Terjadi kesalahan, coba lagi.'
      );
    } finally {
      setCoverUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar Akun', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // ─── Derived values ────────────────────────────────────────
  const avatarUri = profile?.profile_image || null;
  const coverUri = profile?.cover_image || COVER_FALLBACK;
  const initial = profile?.username?.charAt(0)?.toUpperCase() || 'U';
  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrator'
      : profile?.role === 'superadmin'
      ? 'Super Admin'
      : 'Customer';

  return (
    <ScreenContainer padded={false} hideHeader={false} scrollProps={{ contentContainerStyle: { paddingBottom: 32 } }}>

      {/* ─── Banner ─────────────────────────────────────── */}
      <View style={styles.bannerWrap}>
        <Image source={{ uri: coverUri }} style={styles.banner} resizeMode="cover" />
        <Pressable
          onPress={handleCoverPress}
          disabled={coverUploading}
          style={({ pressed }) => [styles.bannerBtn, pressed && { opacity: 0.85 }]}
        >
          {coverUploading ? (
            <ActivityIndicator size="small" color={Colors.burgundy} />
          ) : (
            <>
              <MaterialIcons name="photo-camera" size={14} color={Colors.burgundy} />
              <Text style={styles.bannerBtnText}>Ubah Banner</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ─── Avatar overlapping banner ─────────────────── */}
      <View style={styles.avatarSection}>
        <Pressable onPress={handleAvatarPress} disabled={avatarUploading}>
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </View>

          {avatarUploading && (
            <View style={styles.avatarLoading}>
              <ActivityIndicator color="#fff" />
            </View>
          )}

          {/* Music note badge */}
          <View style={styles.avatarBadge}>
            <MaterialIcons name="music-note" size={13} color={Colors.burgundy} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/akun/edit' as Href)}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="edit" size={16} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profil</Text>
        </Pressable>
      </View>

      {/* ─── Identity ───────────────────────────────────── */}
      <View style={styles.identitySection}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.username ?? 'Pengguna'}</Text>
          <MaterialIcons name="verified" size={20} color={Colors.secondary} />
        </View>
        <Text style={styles.handle}>
          @{profile?.username ?? 'user'} • {profile?.email ?? '-'}
        </Text>

        {/* Bio & kota belum ada di backend; tampil hanya jika terisi */}
        {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.badgeRow}>
          <View style={styles.tag}>
            <MaterialIcons name="confirmation-number" size={13} color={Colors.secondary} />
            <Text style={styles.tagText}>Verified Concertgoer</Text>
          </View>
          <View style={styles.tag}>
            <MaterialIcons name="celebration" size={13} color={Colors.secondary} />
            <Text style={styles.tagText}>Festival Lover</Text>
          </View>
          {!!profile?.city && (
            <View style={[styles.tag, { backgroundColor: Colors.surfaceContainerHigh }]}>
              <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
              <Text style={[styles.tagText, { color: Colors.onSurfaceVariant }]}>
                {profile.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── Stats snapshot ─────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.statsCard}>
          <StatBlock value={String(stats.attended)} label="Konser Dihadiri" />
          <View style={styles.divider} />
          <StatBlock
            value={String(stats.activeTickets)}
            label="Tiket Aktif"
            hasDot={stats.activeTickets > 0}
          />
          <View style={styles.divider} />
          <Pressable
            onPress={() => router.push('/(tabs)/voucher' as Href)}
            style={styles.statBlock}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                {stats.vouchers}
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.secondary} />
            </View>
            <Text style={[styles.statLabel, { color: Colors.secondary, fontWeight: '700' }]}>
              Voucher Saya
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Menu: Tiket & Pembelian ─────────────────────── */}
      <View style={styles.section}>
        <MenuGroup title="Tiket & Pembelian">
          <MenuItem
            icon="confirmation-number"
            title="Tiket & Transaksi Saya"
            subtitle="Riwayat pesanan, e-tiket siap scan"
            badge={
              stats.activeTickets > 0
                ? { text: `${stats.activeTickets} Siap`, tone: 'secondary' }
                : undefined
            }
            onPress={() => router.push('/(tabs)/tiket' as Href)}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="redeem"
            title="Koleksi Voucher & Promo"
            subtitle="Diskon VIP presale & cashback konser"
            iconBg={Colors.secondaryFixed}
            iconColor={Colors.secondary}
            badge={
              stats.vouchers > 0
                ? { text: `${stats.vouchers} Aktif`, tone: 'burgundy' }
                : undefined
            }
            onPress={() => router.push('/(tabs)/voucher' as Href)}
          />
        </MenuGroup>
      </View>

      {/* ─── Menu: Pengaturan Akun ───────────────────────── */}
      <View style={styles.section}>
        <MenuGroup title="Pengaturan Akun">
          <MenuItem
            icon="notifications"
            title="Pengingat Presale Musik"
            subtitle="Peringatan 15 menit sebelum kuota dibuka"
            iconBg={Colors.surfaceContainerHigh}
            iconColor={Colors.espresso}
            right={
              <Switch
                value={presaleReminder}
                onValueChange={setPresaleReminder}
                trackColor={{ false: Colors.outlineVariant, true: Colors.burgundy }}
                thumbColor="#fff"
                ios_backgroundColor={Colors.outlineVariant}
              />
            }
          />
          <View style={styles.separator} />
          <MenuItem
            icon="security"
            title="Keamanan & Verifikasi ID"
            subtitle="KTP terverifikasi untuk anti-calo"
            iconBg={Colors.surfaceContainerHigh}
            iconColor={Colors.espresso}
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="help-outline"
            title="Pusat Bantuan & FAQ Konser"
            subtitle="Panduan penukaran wristband & tiket"
            iconBg={Colors.surfaceContainerHigh}
            iconColor={Colors.espresso}
            onPress={() => {}}
          />
        </MenuGroup>
      </View>

      {/* ─── Account info cards (dari web) ──────────────── */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconWrap}>
              <MaterialIcons name="person" size={20} color={Colors.burgundy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Informasi Akun</Text>
              <Text style={styles.infoSub}>
                Data pengguna yang terdaftar di Eventify
              </Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <InfoItem icon="person" label="Username" value={profile?.username} verified />
            <InfoItem icon="mail" label="Email" value={profile?.email} verified />
            <InfoItem icon="phone" label="Nomor Telepon" value={profile?.phone} />
            <InfoItem
              icon="shield"
              label="Role Akun"
              value={roleLabel}
              badge={profile?.role?.toUpperCase()}
            />
          </View>

          {/* Anti-calo note */}
          <View style={styles.noteBox}>
            <MaterialIcons name="shield" size={20} color={Colors.burgundy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>Validasi Identitas Anti-Calo</Text>
              <Text style={styles.noteText}>
                Tiket konser Eventify tertaut permanen dengan akun Anda.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Logout ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="logout" size={20} color={Colors.secondary} />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </Pressable>

        <Text style={styles.version}>Eventify VIP Edition • Versi 3.8.2</Text>
      </View>
    </ScreenContainer>
  );
}

// Small inline components
function StatBlock({
  value,
  label,
  hasDot,
}: {
  value: string;
  label: string;
  hasDot?: boolean;
}) {
  return (
    <View style={styles.statBlock}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={styles.statValue}>{value}</Text>
        {hasDot && <View style={styles.statDot} />}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Banner
  bannerWrap: { height: 176, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  bannerBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.burgundy,
    letterSpacing: 0.4,
  },

  // Avatar + Edit
  avatarSection: {
    paddingHorizontal: Spacing.margin,
    marginTop: -48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    padding: 4,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.onPrimary,
    fontFamily: Fonts.bold,
    fontSize: 38,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    marginBottom: 6,
  },
  editBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Identity
  identitySection: {
    paddingHorizontal: Spacing.margin,
    paddingTop: 14,
    paddingBottom: 16,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    color: Colors.espresso,
    letterSpacing: -0.3,
  },
  handle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  bio: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.espresso,
    marginTop: 10,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tagText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },

  // Section wrap
  section: { paddingHorizontal: Spacing.margin, marginTop: Spacing.md },

  // Stats
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.primaryContainer,
    letterSpacing: -0.3,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
    marginLeft: 3,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    letterSpacing: 0.4,
    color: Colors.onSurfaceVariant,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(219,192,192,0.4)',
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    marginHorizontal: 16,
  },

  // Info card
  infoCard: {
    padding: 20,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 16,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.espresso,
  },
  infoSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cream,
    alignItems: 'flex-start',
  },
  noteTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.espresso,
  },
  noteText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  logoutText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.secondary,
  },
  version: {
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
  },
});