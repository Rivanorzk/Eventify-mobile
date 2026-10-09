// app/payment/[id].tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Alert, BackHandler, Linking,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import {
  fetchOrder, createPayment, checkStatusWithRetry,
  isFinishUrl, isWebUrl,
} from '@/lib/payment';
import type { Order } from '@/types/api';

type Phase = 'preparing' | 'paying' | 'verifying' | 'error';
type FinalizeSource = 'finish' | 'manual' | 'expired';

const TIKET_HREF = '/(tabs)/tiket' as Href;
const RIWAYAT_HREF = '/(tabs)/riwayat' as Href;

function formatCountdown(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('preparing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const busyRef = useRef(false);
  const expiredHandledRef = useRef(false);
  const initRef = useRef(false);

  // ─── 1. Ambil order → buat transaksi Midtrans Snap ──────────
  const init = useCallback(async () => {
    if (!id) {
      setErrorMsg('ID pesanan tidak valid');
      setPhase('error');
      return;
    }
    try {
      setPhase('preparing');
      setErrorMsg(null);

      const o = await fetchOrder(id);

      if (o.status === 'paid') {
        router.replace(TIKET_HREF);
        return;
      }
      if (o.status !== 'pending') {
        setErrorMsg(
          o.status === 'expired'
            ? 'Waktu pembayaran pesanan ini sudah habis.'
            : 'Pesanan ini sudah dibatalkan.'
        );
        setPhase('error');
        return;
      }

      const { redirect_url } = await createPayment(id);
      if (!redirect_url) throw new Error('Halaman pembayaran tidak tersedia');

      setOrder(o);
      const deadline = o.expired_at ? new Date(o.expired_at).getTime() : null;
      setExpiresAt(deadline && Number.isFinite(deadline) ? deadline : null);
      setRedirectUrl(redirect_url);
      setPhase('paying');
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Gagal menyiapkan pembayaran'
      );
      setPhase('error');
    }
  }, [id, router]);

  useEffect(() => {
    if (initRef.current) return; // cegah dobel panggil (StrictMode)
    initRef.current = true;
    init();
  }, [init]);

  // ─── 2. Verifikasi status ke backend (→ Midtrans Core API) ──
  const finalize = useCallback(
    async (source: FinalizeSource) => {
      if (!id || busyRef.current) return;
      busyRef.current = true;
      setPhase('verifying');

      try {
        const status = await checkStatusWithRetry(id);

        if (status === 'paid') {
          Alert.alert('Pembayaran berhasil', 'E-ticket Anda sudah terbit.', [
            { text: 'Lihat Tiket', onPress: () => router.replace(TIKET_HREF) },
          ], { cancelable: false });
          return;
        }

        if (status === 'pending') {
          if (source === 'manual') {
            Alert.alert('Belum terbayar', 'Pembayaran Anda belum kami terima.');
            setPhase('paying');
            return;
          }
          Alert.alert(
            source === 'expired' ? 'Waktu pembayaran habis' : 'Menunggu pembayaran',
            source === 'expired'
              ? 'Pesanan akan dibatalkan otomatis.'
              : 'Selesaikan pembayaran dari menu Riwayat sebelum waktunya habis.',
            [{ text: 'Lihat Riwayat', onPress: () => router.replace(RIWAYAT_HREF) }],
            { cancelable: false }
          );
          return;
        }

        Alert.alert(
          status === 'expired' ? 'Pembayaran kedaluwarsa' : 'Pembayaran dibatalkan',
          'Pesanan ini tidak dapat dilanjutkan. Silakan buat pesanan baru.',
          [{ text: 'Lihat Riwayat', onPress: () => router.replace(RIWAYAT_HREF) }],
          { cancelable: false }
        );
      } catch (err: any) {
        Alert.alert(
          'Gagal memeriksa status',
          err?.response?.data?.message || 'Periksa koneksi Anda lalu coba lagi.'
        );
        setPhase('paying');
      } finally {
        busyRef.current = false;
      }
    },
    [id, router]
  );

  // ─── 3. Hitung mundur sampai order expired ──────────────────
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  useEffect(() => {
    if (secondsLeft === 0 && phase === 'paying' && !expiredHandledRef.current) {
      expiredHandledRef.current = true;
      finalize('expired');
    }
  }, [secondsLeft, phase, finalize]);

  // ─── 4. Keluar halaman (pesanan tetap pending sampai expired) ─
  const confirmExit = useCallback(() => {
    if (phase === 'verifying') return true;
    Alert.alert(
      'Keluar dari pembayaran?',
      'Pesanan tetap tersimpan dan bisa dibayar dari Riwayat sebelum waktunya habis.',
      [
        { text: 'Lanjut Bayar', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => router.replace(RIWAYAT_HREF) },
      ]
    );
    return true;
  }, [phase, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () =>
      phase === 'paying' || phase === 'verifying' ? confirmExit() : false
    );
    return () => sub.remove();
  }, [phase, confirmExit]);

  // ─── 5. Cegat navigasi WebView ──────────────────────────────
  const onShouldStartLoad = useCallback(
    (req: WebViewNavigation) => {
      const url = req.url;

      // Midtrans selesai/batal/pending → jangan buka halaman web, cek status saja
      if (isFinishUrl(url)) {
        finalize('finish');
        return false;
      }

      // Deep link e-wallet (gojek://, shopeeid://, dll.) → buka aplikasinya
      if (!isWebUrl(url) && url !== 'about:blank') {
        Linking.openURL(url).catch(() =>
          Alert.alert('Aplikasi tidak ditemukan', 'Pilih metode pembayaran lain.')
        );
        return false;
      }

      return true;
    },
    [finalize]
  );

  // ─── Render ─────────────────────────────────────────────────
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => (phase === 'paying' ? confirmExit() : router.replace(RIWAYAT_HREF))}
        style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
      >
        <MaterialIcons name="close" size={20} color={Colors.espresso} />
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        {order && (
          <Text style={styles.headerSub} numberOfLines={1}>
            {order.invoice_number} · {formatRupiah(Number(order.final_price))}
          </Text>
        )}
      </View>

      {secondsLeft !== null && phase !== 'error' && (
        <View style={[styles.timer, secondsLeft <= 60 && styles.timerUrgent]}>
          <MaterialIcons
            name="timer"
            size={14}
            color={secondsLeft <= 60 ? '#B3261E' : Colors.wine}
          />
          <Text
            style={[styles.timerText, secondsLeft <= 60 && { color: '#B3261E' }]}
          >
            {formatCountdown(secondsLeft)}
          </Text>
        </View>
      )}
    </View>
  );

  if (phase === 'preparing') {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.centerText}>Menyiapkan pembayaran...</Text>
        </View>
      </View>
    );
  }

  if (phase === 'error' || !redirectUrl) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={Colors.outline} />
          <Text style={styles.errorTitle}>Pembayaran tidak tersedia</Text>
          <Text style={styles.centerText}>{errorMsg || 'Terjadi kesalahan.'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => router.replace(RIWAYAT_HREF)}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ghostBtnText}>Lihat Riwayat</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                initRef.current = true;
                init();
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.primaryBtnText}>Coba Lagi</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}

      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: redirectUrl }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={onShouldStartLoad}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
            </View>
          )}
        />

        {phase === 'verifying' && (
          <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Memeriksa status pembayaran...</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={() => finalize('manual')}
          disabled={phase === 'verifying'}
          style={({ pressed }) => [
            styles.checkBtn,
            phase === 'verifying' && { opacity: 0.6 },
            pressed && { opacity: 0.9 },
          ]}
        >
          <MaterialIcons name="refresh" size={18} color={Colors.burgundy} />
          <Text style={styles.checkBtnText}>Saya sudah bayar — cek status</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.margin, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5D6D0',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 9999,
    backgroundColor: Colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.espresso },
  headerSub: {
    fontFamily: Fonts.regular, fontSize: 11.5,
    color: Colors.onSurfaceVariant, marginTop: 1,
  },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 9999, backgroundColor: Colors.cream,
  },
  timerUrgent: { backgroundColor: '#FDECEA' },
  timerText: { fontFamily: Fonts.bold, fontSize: 12.5, color: Colors.wine },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  centerText: {
    fontFamily: Fonts.regular, fontSize: 13,
    color: Colors.onSurfaceVariant, textAlign: 'center',
  },
  errorTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.espresso },

  primaryBtn: {
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 9999, backgroundColor: Colors.burgundy,
  },
  primaryBtnText: { fontFamily: Fonts.semibold, fontSize: 13, color: '#fff' },
  ghostBtn: {
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 9999, backgroundColor: Colors.cream,
  },
  ghostBtnText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.wine },

  overlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  overlayText: { fontFamily: Fonts.semibold, fontSize: 13, color: '#fff' },

  footer: {
    paddingHorizontal: Spacing.margin, paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5D6D0',
  },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: Radius.lg,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#EADBCC',
  },
  checkBtnText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.burgundy },
});