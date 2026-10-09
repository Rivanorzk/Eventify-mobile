import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import VoucherOption from './VoucherOption';
import { Colors, Fonts, Radius } from '@/constants/theme';
import type { Voucher } from '@/types/api';

interface Props {
  vouchers: Voucher[];
  loading: boolean;
  error: boolean;
  selectedId: number | null;
  quantity: number;
  onSelect: (id: number) => void;
  onClear: () => void;
  onRetry: () => void;
}

export default function VoucherSection({
  vouchers,
  loading,
  error,
  selectedId,
  quantity,
  onSelect,
  onClear,
  onRetry,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="local-offer" size={16} color={Colors.wine} />
          <Text style={styles.headerTitle}>Voucher</Text>
        </View>
        {selectedId && (
          <Pressable onPress={onClear} style={styles.clearBtn}>
            <MaterialIcons name="close" size={14} color="#8C7777" />
            <Text style={styles.clearText}>Lepas voucher</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Memuat voucher Anda...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Voucher gagal dimuat. Anda tetap bisa lanjut tanpa voucher.
          </Text>
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <MaterialIcons name="refresh" size={14} color={Colors.wine} />
            <Text style={styles.retryText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : vouchers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Anda belum punya voucher untuk event ini.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/voucher' as Href)}
          >
            <Text style={styles.emptyLink}>Punya kode? Tukar di halaman voucher</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ maxHeight: 280 }}
          contentContainerStyle={{ gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {vouchers.map((v) => (
            <VoucherOption
              key={v.id}
              voucher={v}
              selected={v.id === selectedId}
              quantity={quantity}
              onSelect={onSelect}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.espresso,
  },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clearText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: '#8C7777',
  },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#8C7777',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    backgroundColor: '#F8F1E7',
    borderRadius: Radius.lg,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#8C7777',
    flex: 1,
  },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  retryText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
  },

  emptyBox: {
    padding: 12,
    backgroundColor: '#F8F1E7',
    borderRadius: Radius.lg,
    gap: 4,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#8C7777',
  },
  emptyLink: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
  },
});