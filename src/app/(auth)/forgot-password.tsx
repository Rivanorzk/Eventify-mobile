import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AuthInput from '@/components/authInput';
import { theme } from '@/constants/auth-theme';

// Kalau AuthContext kamu sudah punya instance axios (mis. '@/lib/api'),
// pakai itu saja dan ganti tiga pemanggilan axios.post di bawah.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type Step = 'email' | 'otp' | 'reset' | 'done';

const STEPS: Step[] = ['email', 'otp', 'reset'];

const apiMessage = (err: any) =>
  err?.response?.data?.message ?? 'Tidak dapat terhubung ke server.';

const formatTime = (total: number) => {
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState(''); // terisi hanya saat backend OTP_DUMMY=true
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [resetToken, setResetToken] = useState('');
  const [resetExpiresAt, setResetExpiresAt] = useState(0);
  const [resetLeft, setResetLeft] = useState(0);
  const [resendLeft, setResendLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // Hitung mundur tombol "kirim ulang"
  useEffect(() => {
    if (resendLeft <= 0) return;
    const id = setTimeout(() => setResendLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendLeft]);

  // Hitung mundur masa berlaku token reset
  useEffect(() => {
    if (step !== 'reset' || !resetExpiresAt) return;

    const tick = () => {
      const left = Math.max(0, Math.round((resetExpiresAt - Date.now()) / 1000));
      setResetLeft(left);

      if (left === 0) {
        setResetToken('');
        setPassword('');
        setConfirm('');
        setOtp('');
        setStep('email');
        Alert.alert('Sesi habis', 'Silakan ulangi proses dari awal.');
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, resetExpiresAt]);

  const requestOtp = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email wajib diisi' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrors({ email: 'Format email tidak valid' });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/forgot-password/otp`, {
        email: email.trim(),
      });

      setDemoOtp(data.data.otp ?? '');
      setOtp('');
      setResendLeft(data.data.resend_in ?? 30);
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Gagal mengirim kode', apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setErrors({ otp: 'Kode OTP harus 6 digit' });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/auth/forgot-password/verify-otp`,
        { email: email.trim(), otp }
      );

      setResetToken(data.data.reset_token);
      setResetExpiresAt(Date.now() + data.data.expires_in * 1000);
      setDemoOtp('');
      setStep('reset');
    } catch (err: any) {
      Alert.alert('Verifikasi gagal', apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const e: typeof errors = {};
    if (password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
    if (confirm !== password) e.confirm = 'Konfirmasi kata sandi tidak sama';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        reset_token: resetToken,
        password,
      });

      setResetToken('');
      setPassword('');
      setConfirm('');
      setStep('done');
    } catch (err: any) {
      Alert.alert('Gagal mengubah kata sandi', apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => router.replace('/(auth)/login');

  const activeIndex = STEPS.indexOf(step);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header centered */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Ionicons name="ticket" size={22} color={theme.primary} />
        <Text style={s.headerBrand}>Eventify</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step !== 'done' && (
            <>
              {/* Badge */}
              <View style={s.badgeWrap}>
                <View style={s.badge}>
                  <Ionicons name="key" size={15} color={theme.secondary} />
                  <Text style={s.badgeText}>LUPA KATA SANDI</Text>
                </View>
              </View>

              {/* Progress */}
              <View style={s.progress}>
                {STEPS.map((k, i) => (
                  <View
                    key={k}
                    style={[s.progressBar, i <= activeIndex && s.progressBarActive]}
                  />
                ))}
              </View>
            </>
          )}

          {step === 'email' && (
            <>
              <Text style={s.title}>Atur Ulang Kata Sandi</Text>
              <Text style={s.subtitle}>
                Masukkan email akunmu, kami akan mengirim kode OTP 6 digit
              </Text>

              <View style={s.card}>
                <AuthInput
                  label="Email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon="mail-outline"
                  error={errors.email}
                />

                <TouchableOpacity
                  onPress={requestOtp}
                  disabled={loading}
                  style={[s.cta, loading && { opacity: 0.75 }]}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.ctaText}>Kirim Kode OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={s.title}>Masukkan Kode OTP</Text>
              <Text style={s.subtitle}>
                Jika {email.trim()} terdaftar, kode 6 digit sudah dikirim. Berlaku 5 menit.
              </Text>

              {!!demoOtp && (
                <View style={s.demoBox}>
                  <Text style={s.demoTitle}>Mode demo</Text>
                  <Text style={s.demoText}>
                    Email belum benar-benar dikirim. Kode OTP kamu:
                  </Text>
                  <Text style={s.demoCode}>{demoOtp}</Text>
                  <TouchableOpacity onPress={() => setOtp(demoOtp)} hitSlop={6}>
                    <Text style={s.demoLink}>Isi otomatis</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={s.card}>
                <Text style={s.label}>Kode OTP</Text>
                <TextInput
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  placeholder="••••••"
                  placeholderTextColor={theme.outline}
                  style={[s.otpInput, !!errors.otp && s.otpInputError]}
                />
                {!!errors.otp && <Text style={s.errorText}>{errors.otp}</Text>}

                <TouchableOpacity
                  onPress={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  style={[s.cta, (loading || otp.length !== 6) && { opacity: 0.6 }]}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.ctaText}>Verifikasi</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={s.rowBetween}>
                  <TouchableOpacity
                    onPress={() => {
                      setErrors({});
                      setStep('email');
                    }}
                    hitSlop={6}
                  >
                    <Text style={s.mutedLink}>Ganti email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={requestOtp}
                    disabled={loading || resendLeft > 0}
                    hitSlop={6}
                  >
                    <Text style={[s.link, resendLeft > 0 && { color: theme.outline }]}>
                      {resendLeft > 0 ? `Kirim ulang (${resendLeft}s)` : 'Kirim ulang kode'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 'reset' && (
            <>
              <Text style={s.title}>Buat Kata Sandi Baru</Text>
              <Text style={s.subtitle}>
                OTP benar. Selesaikan dalam{' '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  {formatTime(resetLeft)}
                </Text>
              </Text>

              <View style={s.card}>
                <AuthInput
                  label="Kata Sandi Baru"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChangeText={setPassword}
                  secure
                  icon="lock-closed-outline"
                  error={errors.password}
                />

                <AuthInput
                  label="Konfirmasi Kata Sandi"
                  placeholder="Ulangi kata sandi baru"
                  value={confirm}
                  onChangeText={setConfirm}
                  secure
                  icon="lock-closed-outline"
                  error={errors.confirm}
                />

                <TouchableOpacity
                  onPress={resetPassword}
                  disabled={loading}
                  style={[s.cta, loading && { opacity: 0.75 }]}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.ctaText}>Simpan Kata Sandi Baru</Text>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'done' && (
            <View style={s.doneWrap}>
              <View style={s.doneIcon}>
                <Ionicons name="checkmark" size={36} color="#fff" />
              </View>
              <Text style={s.title}>Kata Sandi Berhasil Diubah</Text>
              <Text style={s.subtitle}>
                Silakan masuk dengan kata sandi barumu.
              </Text>
              <TouchableOpacity
                onPress={goLogin}
                style={[s.cta, { alignSelf: 'stretch' }]}
                activeOpacity={0.9}
              >
                <Text style={s.ctaText}>Ke Halaman Login</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {step !== 'done' && (
            <>
              <View style={s.divider} />
              <View style={s.footer}>
                <Text style={s.muted}>Ingat kata sandi? </Text>
                <TouchableOpacity onPress={goLogin} hitSlop={6}>
                  <Text style={s.link}>Kembali ke Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: theme.hairline,
    borderBottomColor: 'rgba(219,192,192,0.35)',
    backgroundColor: 'rgba(252,249,248,0.9)',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    height: 64,
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: -0.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  badgeWrap: { alignItems: 'center', marginBottom: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,218,218,0.5)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.secondary,
    letterSpacing: 1.1,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.surfaceContainerHighest,
  },
  progressBarActive: { backgroundColor: theme.primary },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    maxWidth: 320,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: theme.outline,
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    color: theme.text,
  },
  otpInputError: { borderColor: '#BA1A1A' },
  errorText: { color: '#BA1A1A', fontSize: 12, marginTop: 6 },
  demoBox: {
    backgroundColor: '#FFF4D6',
    borderColor: '#F0D58A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  demoTitle: { fontSize: 13, fontWeight: '700', color: '#7A5A00' },
  demoText: { fontSize: 13, color: '#7A5A00', marginTop: 4, textAlign: 'center' },
  demoCode: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    color: '#7A5A00',
    marginVertical: 6,
  },
  demoLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A5A00',
    textDecorationLine: 'underline',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cta: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 9999,
    backgroundColor: theme.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  doneWrap: { alignItems: 'center', paddingTop: 24 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.surfaceContainerHighest,
    marginVertical: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  muted: { color: theme.muted, fontSize: 15 },
  mutedLink: { color: theme.muted, fontSize: 14, fontWeight: '500' },
  link: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});