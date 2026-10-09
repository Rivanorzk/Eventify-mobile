import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InfoModal({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: visible ? 0 : SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
        mass: 0.9,
      }),
    ]).start();
  }, [visible, overlay, translateY]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Petunjuk Klaim Voucher</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={18} color={Colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <Text style={styles.body}>
          Klaim voucher diskon tiket konser, cashback bank, atau pass fast-track langsung
          dari halaman ini tanpa biaya tambahan. Setelah diklaim, voucher akan otomatis
          tersedia di halaman checkout tiket Anda.
        </Text>

        <View style={styles.tipBox}>
          <MaterialIcons name="verified" size={24} color={Colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>TIPS BERHEMAT</Text>
            <Text style={styles.tipText}>
              Gunakan voucher cashback VA untuk potongan tambahan saat promo bank
              berlangsung.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaText}>MENGERTI</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(48,48,48,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    color: Colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.onSurfaceVariant,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  tipTitle: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.onSurface,
  },
  tipText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 14,
    letterSpacing: 1,
  },
});