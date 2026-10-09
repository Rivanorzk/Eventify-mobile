import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

const VALID_CODES = ['FESTIVALHEMAT2025', 'EVENTIFYVIP', 'MUSICLOVER', 'KONSER2025'];

interface Props {
  onSuccess: (code: string) => void;
  onError: (msg: string) => void;
}

type Feedback = { type: 'success' | 'error'; msg: string } | null;

export default function RedeemPromoCard({ onSuccess, onError }: Props) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleRedeem = () => {
    const code = value.trim().toUpperCase();
    if (!code) {
      setFeedback({
        type: 'error',
        msg: 'Masukkan kode kupon atau promo terlebih dahulu.',
      });
      onError('Masukkan kode kupon terlebih dahulu.');
      return;
    }
    if (VALID_CODES.includes(code)) {
      setFeedback({
        type: 'success',
        msg: 'Selamat! Voucher promo aktif dan tersimpan di dompet tiket.',
      });
      setValue('');
      onSuccess(code);
    } else {
      setFeedback({
        type: 'error',
        msg: 'Kode voucher tidak valid atau sudah kadaluarsa.',
      });
      onError('Kode voucher tidak valid atau kadaluarsa.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialIcons name="confirmation-number" size={20} color={Colors.secondary} />
          <Text style={styles.title}>Punya Kode Promo / Kupon?</Text>
        </View>
        <View style={styles.giftBadge}>
          <Text style={styles.giftText}>GIFT CARD</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name="local-offer"
            size={18}
            color={Colors.onSurfaceVariant}
            style={styles.inputIcon}
          />
          <TextInput
            value={value}
            onChangeText={(t) => setValue(t.toUpperCase())}
            placeholder="Contoh: FESTIVALHEMAT2025"
            placeholderTextColor="rgba(85,66,66,0.5)"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <Pressable
          onPress={handleRedeem}
          style={({ pressed }) => [styles.ctaBtn, pressed && { transform: [{ scale: 0.96 }] }]}
        >
          <Text style={styles.ctaText}>Klaim / Terapkan</Text>
        </Pressable>
      </View>

      {feedback && (
        <View
          style={[
            styles.feedback,
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <MaterialIcons
            name={feedback.type === 'success' ? 'check-circle' : 'error'}
            size={15}
            color={
              feedback.type === 'success'
                ? Colors.onSecondaryContainer
                : Colors.onErrorContainer
            }
          />
          <Text
            style={[
              styles.feedbackText,
              {
                color:
                  feedback.type === 'success'
                    ? Colors.onSecondaryContainer
                    : Colors.onErrorContainer,
              },
            ]}
          >
            {feedback.msg}
          </Text>
        </View>
      )}

      <View style={styles.hintRow}>
        <MaterialIcons name="info-outline" size={15} color={Colors.secondary} />
        <Text style={styles.hintText}>
          Kode langsung memotong total pembayaran pada saat checkout tiket konser.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    gap: Spacing.sm,
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.onSurface,
    flexShrink: 1,
  },
  giftBadge: {
    backgroundColor: 'rgba(255,218,218,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  giftText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.secondary,
  },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  inputWrapper: { flex: 1, justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLow,
    color: Colors.onSurface,
    fontFamily: Fonts.regular,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  ctaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  feedbackSuccess: { backgroundColor: Colors.secondaryFixed },
  feedbackError: { backgroundColor: Colors.errorContainer },
  feedbackText: { fontFamily: Fonts.regular, fontSize: 13, flex: 1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  hintText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(85,66,66,0.8)',
    flex: 1,
  },
});