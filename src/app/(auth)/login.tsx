import React, { useState } from 'react';
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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthInput from '@/components/authInput';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/constants/auth-theme';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email atau nomor HP wajib diisi';
    else if (!/^\S+@\S+\.\S+$/.test(email) && !/^[0-9+\-\s]{8,}$/.test(email))
      e.email = 'Format email / nomor HP tidak valid';
    if (!password) e.password = 'Kata sandi wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        'Login gagal',
        err?.response?.data?.message ?? 'Periksa email dan kata sandi kamu.'
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
          {/* Welcome badge */}
          <View style={s.badgeWrap}>
            <View style={s.badge}>
              <Ionicons name="ticket" size={15} color={theme.secondary} />
              <Text style={s.badgeText}>LOGIN</Text>
            </View>
          </View>

          {/* Hero title */}
          <Text style={s.title}>Selamat Datang</Text>
          <Text style={s.subtitle}>
            Masuk untuk akses tiket festival eksklusif dan voucher panggungmu
          </Text>

          {/* Form card */}
          <View style={s.card}>
            <AuthInput
              label="Email atau Nomor HP"
              placeholder="contoh@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
              error={errors.email}
            />

            <AuthInput
              label="Kata Sandi"
              placeholder="Masukkan kata sandi"
              value={password}
              onChangeText={setPassword}
              secure
              icon="lock-closed-outline"
              error={errors.password}
            />

            {/* Remember + Forgot */}
            <View style={s.rowBetween}>
              <TouchableOpacity
                onPress={() => setRemember(!remember)}
                style={s.rememberRow}
                hitSlop={6}
              >
                <View style={[s.checkbox, remember && s.checkboxActive]}>
                  {remember && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={s.rememberText}>Ingat Saya</Text>
              </TouchableOpacity>

              <TouchableOpacity hitSlop={6}>
                <Text style={s.forgotText}>Lupa Kata Sandi?</Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={s.ctaText}>Masuk ke Eventify</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.muted}>Belum punya akun Eventify? </Text>
            <Link href="/(auth)/register" style={s.link}>
              Daftar Sekarang
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
    maxWidth: 300,
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.muted,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  cta: {
    marginTop: 10,
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
  divider: {
    height: 1,
    backgroundColor: theme.surfaceContainerHighest,
    marginVertical: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  muted: { color: theme.muted, fontSize: 15 },
  link: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});