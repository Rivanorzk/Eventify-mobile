import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthInput from '@/components/authInput';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/constants/auth-theme';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // --- Password strength ---
  const strength = useMemo(() => {
    const val = form.password;
    const hasLen = val.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(val);
    const hasDigit = /[0-9]/.test(val);
    const hasNumCombo = hasLetter && hasDigit;

    let score = 0;
    if (val.length >= 6) score++;
    if (hasLen && (hasLetter || hasDigit)) score++;
    if (hasLen && hasNumCombo && val.length >= 10) score++;

    let label = 'Belum Diisi';
    let color = theme.outline;
    let bars = 0;

    if (val) {
      if (score === 1) {
        label = 'Lemah';
        color = theme.danger;
        bars = 1;
      } else if (score === 2) {
        label = 'Cukup';
        color = theme.secondary;
        bars = 2;
      } else if (score >= 3) {
        label = 'Sangat Kuat';
        color = theme.primary;
        bars = 3;
      }
    }

    return { hasLen, hasNumCombo, label, color, bars };
  }, [form.password]);

  const passwordsMatch =
    !!form.password && !!form.confirm && form.password === form.confirm;

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.username.trim().length < 3) e.username = 'Nama minimal 3 karakter';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email tidak valid';
    if (form.phone.trim().length < 8) e.phone = 'Nomor HP tidak valid';
    if (form.password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
    if (form.confirm !== form.password) e.confirm = 'Konfirmasi kata sandi tidak cocok';
    if (!terms) e.terms = 'Kamu harus menyetujui syarat & ketentuan';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(
        form.username.trim(),
        form.email.trim(),
        form.phone.trim(),
        form.password
      );
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        'Pendaftaran gagal',
        err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header centered */}
      <View style={s.header}>
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
          {/* Badge */}
          <View style={s.badge}>
            <Ionicons name="musical-notes" size={14} color={theme.secondary} />
            <Text style={s.badgeText}>REGISTER</Text>
          </View>

          {/* Hero */}
          <Text style={s.hero}>Mulai Pengalaman Musikmu</Text>
          <Text style={s.subHero}>
            Buat akun Eventify untuk kemudahan beli tiket festival resmi bebas calo
            dan klaim promo eksklusif.
          </Text>

          {/* Form */}
          <View style={{ marginTop: 8 }}>
            <AuthInput
              label="Nama Lengkap"
              placeholder="Nama lengkap sesuai kartu identitas"
              value={form.username}
              onChangeText={set('username')}
              autoCapitalize="words"
              icon="person-outline"
              error={errors.username}
            />

            <AuthInput
              label="Alamat Email"
              placeholder="contoh: musicfan@gmail.com"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
              error={errors.email}
            />

            {/* Phone with +62 prefix */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.label}>Nomor WhatsApp / HP</Text>
              <View style={s.phoneRow}>
                <View style={s.phonePrefix}>
                  <Text style={s.phonePrefixText}>🇮🇩 +62</Text>
                </View>
                <View style={s.phoneInputWrap}>
                  <TextInput
                    value={form.phone}
                    onChangeText={set('phone')}
                    placeholder="812-3456-7890"
                    placeholderTextColor="rgba(85,66,66,0.5)"
                    keyboardType="phone-pad"
                    style={s.phoneInput}
                  />
                </View>
              </View>
              {!!errors.phone && <Text style={s.error}>{errors.phone}</Text>}
            </View>

            {/* Password + strength */}
            <AuthInput
              label="Kata Sandi"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChangeText={set('password')}
              secure
              icon="lock-closed-outline"
              error={errors.password}
            />

            {/* Strength meter */}
            <View style={s.strengthCard}>
              <View style={s.strengthHeader}>
                <Text style={s.strengthLabel}>KEKUATAN SANDI:</Text>
                <Text style={[s.strengthValue, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>

              <View style={s.barsRow}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      s.bar,
                      {
                        backgroundColor:
                          i < strength.bars
                            ? strength.color
                            : theme.surfaceContainerHighest,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={s.reqRow}>
                <View style={s.reqItem}>
                  <Ionicons
                    name={strength.hasLen ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={strength.hasLen ? theme.secondary : theme.outline}
                  />
                  <Text
                    style={[
                      s.reqText,
                      strength.hasLen && { color: theme.secondary, fontWeight: '600' },
                    ]}
                  >
                    Min. 8 Karakter
                  </Text>
                </View>
                <View style={s.reqItem}>
                  <Ionicons
                    name={strength.hasNumCombo ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={strength.hasNumCombo ? theme.secondary : theme.outline}
                  />
                  <Text
                    style={[
                      s.reqText,
                      strength.hasNumCombo && {
                        color: theme.secondary,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    Huruf & Angka
                  </Text>
                </View>
              </View>
            </View>

            {/* Confirm password with match indicator */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.label}>Ulangi Kata Sandi</Text>
              <View
                style={[
                  s.confirmBox,
                  passwordsMatch && { borderColor: theme.primary },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.muted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={form.confirm}
                  onChangeText={set('confirm')}
                  placeholder="Ketik ulang kata sandi"
                  placeholderTextColor="rgba(85,66,66,0.5)"
                  secureTextEntry
                  style={s.confirmInput}
                />
                {passwordsMatch && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                )}
              </View>
              {!!errors.confirm && <Text style={s.error}>{errors.confirm}</Text>}
            </View>

            {/* Terms */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTerms(!terms)}
              style={s.termsRow}
            >
              <View style={[s.checkbox, terms && s.checkboxActive]}>
                {terms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={s.termsText}>
                Saya menyetujui{' '}
                <Text style={s.termsLink}>Syarat & Ketentuan</Text> serta{' '}
                <Text style={s.termsLink}>Kebijakan Privasi</Text> Eventify, termasuk
                verifikasi tiket resmi tanpa calo.
              </Text>
            </TouchableOpacity>
            {!!errors.terms && <Text style={[s.error, { marginTop: 4 }]}>{errors.terms}</Text>}

            {/* CTA */}
            <TouchableOpacity
              onPress={onSubmit}
              disabled={loading}
              style={[s.cta, loading && { opacity: 0.75 }]}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.ctaText}>Buat Akun Sekarang</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.muted}>Sudah punya akun Eventify? </Text>
            <Link href="/(auth)/login" style={s.link}>
              Masuk di sini
            </Link>
          </View>
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
  headerBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: -0.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: theme.surfaceContainerHigh,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.muted,
    letterSpacing: 1.1,
  },
  hero: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: -0.6,
  },
  subHero: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted,
    marginTop: 10,
    marginBottom: 8,
  },

  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  error: { color: theme.danger, fontSize: 12, marginTop: 4 },

  // Phone
  phoneRow: { flexDirection: 'row', gap: 8 },
  phonePrefix: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: theme.radius,
    backgroundColor: theme.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  phoneInputWrap: {
    flex: 1,
    backgroundColor: theme.input,
    borderRadius: theme.radius,
    justifyContent: 'center',
  },
  phoneInput: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.text,
    fontSize: 15,
  },

  // Strength meter
  strengthCard: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginTop: -6,
    marginBottom: 16,
    gap: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.muted,
    letterSpacing: 0.8,
  },
  strengthValue: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  barsRow: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 9999 },
  reqRow: { flexDirection: 'row', gap: 16, marginTop: 2 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqText: { fontSize: 12, color: theme.outline },

  // Confirm password box
  confirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: theme.radius,
    paddingHorizontal: 14,
  },
  confirmInput: {
    flex: 1,
    color: theme.text,
    paddingVertical: 14,
    fontSize: 15,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.muted,
  },
  termsLink: {
    color: theme.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // CTA
  cta: {
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: theme.primary,
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

  divider: {
    height: 1,
    backgroundColor: theme.surfaceContainerHighest,
    marginVertical: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  muted: { color: theme.muted, fontSize: 15 },
  link: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});