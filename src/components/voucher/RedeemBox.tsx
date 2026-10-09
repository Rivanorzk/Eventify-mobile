import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props {
  onRedeem: (code: string) => Promise<void>;
}

type Feedback = { type: 'success' | 'error'; text: string } | null;

export default function RedeemBox({ onRedeem }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSubmit = async () => {
    const promoCode = code.trim();
    if (!promoCode) {
      setFeedback({ type: 'error', text: 'Masukkan kode voucher terlebih dahulu.' });
      return;
    }
    try {
      setLoading(true);
      setFeedback(null);
      await onRedeem(promoCode);
      setCode('');
      setFeedback({ type: 'success', text: 'Voucher berhasil ditambahkan.' });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text:
          err?.response?.data?.message ||
          err?.message ||
          'Kode voucher tidak valid atau sudah kadaluarsa.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="card-giftcard" size={20} color={Colors.wine} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Punya Kode Voucher?</Text>
          <Text style={styles.subtitle}>
            Masukkan kode dari penyelenggara. Setiap kode hanya bisa ditukar satu kali
            dan berlaku untuk event yang tertera.
          </Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name="local-offer"
            size={16}
            color={Colors.onSurfaceVariant}
            style={styles.inputIcon}
          />
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase().replace(/\s/g, ''));
              if (feedback) setFeedback(null);
            }}
            placeholder="Contoh: KONSER2025"
            placeholderTextColor="rgba(85,66,66,0.5)"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={50}
            editable={!loading}
            style={styles.input}
          />
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.cta,
            (pressed || loading) && { opacity: 0.9 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaText}>Tukar</Text>
          )}
        </Pressable>
      </View>

      {feedback && (
        <View
          style={[
            styles.feedback,
            feedback.type === 'success' ? styles.fbSuccess : styles.fbError,
          ]}
        >
          <MaterialIcons
            name={feedback.type === 'success' ? 'check-circle' : 'error-outline'}
            size={15}
            color={feedback.type === 'success' ? '#047857' : Colors.onErrorContainer}
          />
          <Text
            style={[
              styles.fbText,
              { color: feedback.type === 'success' ? '#047857' : Colors.onErrorContainer },
            ]}
          >
            {feedback.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    padding: Spacing.md,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8EFEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.espresso,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.onSurfaceVariant,
    marginTop: 3,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputWrapper: { flex: 1, justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    color: Colors.espresso,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    letterSpacing: 1,
  },
  cta: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  ctaText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  fbSuccess: { backgroundColor: '#E4F3EA' },
  fbError: { backgroundColor: Colors.errorContainer },
  fbText: { fontFamily: Fonts.regular, fontSize: 12, flex: 1 },
});