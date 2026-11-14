// app/(tabs)/tiket.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  BackHandler,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import { Colors, Fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatEventDate } from '@/utils/format';
import type { Ticket } from '@/types/api';

type ViewKey = 'events' | 'categories' | 'tickets';
type TicketFilter = 'all' | 'active' | 'used' | 'expired' | 'cancelled';

const TICKET_FILTERS: { key: TicketFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'used', label: 'Sudah discan' },
  { key: 'expired', label: 'Kedaluwarsa' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

interface EventGroup {
  key: string;
  event_id?: number;
  event_title: string;
  event_date: string | null | undefined;
  start_time: string | null | undefined;
  location: string | null | undefined;
  tickets: Ticket[];
}

interface CategoryGroup {
  key: string;
  category_name: string;
  tickets: Ticket[];
}

// ─── Palet: burgundy, putih, abu ───────────────────────────────
const GRAY = {
  line: '#E7E7EA',   // garis tipis
  soft: '#F3F3F5',   // latar abu muda
  mid: '#A0A0A8',    // ikon / teks pudar
  text: '#6B6B73',   // teks sekunder
  dark: '#26262B',   // teks utama
};

async function fetchMyTickets(): Promise<Ticket[]> {
  const res = await api.get('/tickets/my');
  return res.data.data ?? [];
}

// ─── Helpers ───────────────────────────────────────────────────
function getText(t: Ticket, key: string): string | null {
  const value = t[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

const isActive = (t: Ticket) => t.status === 'active';
const isScanned = (t: Ticket) => t.status === 'used';

function timeOf(raw?: string | null): number {
  const ts = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

const createdTime = (t: Ticket) => timeOf(getText(t, 'created_at'));

// Terbaru di atas (waktu pembelian, lalu id terbesar)
const newestFirst = (a: Ticket, b: Ticket) =>
  createdTime(b) - createdTime(a) || Number(b.id) - Number(a.id);

// Satu label status per tiket
const TICKET_STATUS: Record<string, { label: string; fg: string; bg: string }> = {
  active: { label: 'Aktif', fg: '#FFFFFF', bg: Colors.burgundy },
  used: { label: 'Sudah discan', fg: GRAY.text, bg: GRAY.soft },
  expired: { label: 'Kedaluwarsa', fg: GRAY.text, bg: GRAY.soft },
  cancelled: { label: 'Dibatalkan', fg: GRAY.text, bg: GRAY.soft },
};

const statusOf = (t: Ticket) =>
  TICKET_STATUS[String(t.status)] ?? {
    label: String(t.status ?? '-'),
    fg: GRAY.text,
    bg: GRAY.soft,
  };

function groupByEvent(tickets: Ticket[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  tickets.forEach((t) => {
    const key =
      t.event_id != null
        ? String(t.event_id)
        : `${t.event_title ?? 'Event'}|${t.event_date ?? ''}|${t.location ?? ''}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        event_id: t.event_id,
        event_title: t.event_title ?? 'Event',
        event_date: t.event_date ?? null,
        start_time: t.start_time ?? null,
        location: t.location ?? null,
        tickets: [],
      });
    }
    map.get(key)!.tickets.push(t);
  });

  // Event yang masih punya tiket aktif di atas (tanggal terdekat dulu),
  // sisanya di bawah (tanggal terbaru dulu).
  return Array.from(map.values()).sort((a, b) => {
    const aLive = a.tickets.some(isActive);
    const bLive = b.tickets.some(isActive);
    if (aLive !== bLive) return aLive ? -1 : 1;
    const diff = timeOf(a.event_date) - timeOf(b.event_date);
    return aLive ? diff : -diff;
  });
}

function groupByCategory(tickets: Ticket[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  tickets.forEach((t) => {
    const name = t.category_name ?? 'Tiket';
    const key =
      t.event_ticket_category_id != null ? String(t.event_ticket_category_id) : name;
    if (!map.has(key)) map.set(key, { key, category_name: name, tickets: [] });
    map.get(key)!.tickets.push(t);
  });
  return Array.from(map.values()).sort((a, b) => b.tickets.length - a.tickets.length);
}

// ─── Screen ────────────────────────────────────────────────────
export default function TiketScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // Yang disimpan hanya KUNCI pilihan. Datanya selalu diambil dari hasil terbaru,
  // jadi setelah refresh isi daftar ikut segar.
  const [selectedEventKey, setSelectedEventKey] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);
      setTickets(await fetchMyTickets());
    } catch (err) {
      console.warn('Fetch tickets error', err);
      setLoadError('Tiket gagal dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll(hasLoaded.current);
      hasLoaded.current = true;
    }, [loadAll])
  );

  const filteredTickets = useMemo(
    () => ticketFilter === 'all'
      ? tickets
      : tickets.filter((ticket) => ticket.status === ticketFilter),
    [tickets, ticketFilter]
  );
  const events = useMemo(() => groupByEvent(filteredTickets), [filteredTickets]);
  const selectedEvent = useMemo(
    () => events.find((e) => e.key === selectedEventKey) ?? null,
    [events, selectedEventKey]
  );
  const categories = useMemo(
    () => (selectedEvent ? groupByCategory(selectedEvent.tickets) : []),
    [selectedEvent]
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.key === selectedCategoryKey) ?? null,
    [categories, selectedCategoryKey]
  );
  // Salinan array, supaya sort tidak mengubah data asli
  const categoryTickets = useMemo(
    () => (selectedCategory ? [...selectedCategory.tickets].sort(newestFirst) : []),
    [selectedCategory]
  );

  const view: ViewKey = !selectedEvent
    ? 'events'
    : !selectedCategory
      ? 'categories'
      : 'tickets';

  const totalActive = useMemo(() => tickets.filter(isActive).length, [tickets]);
  const totalScanned = useMemo(() => tickets.filter(isScanned).length, [tickets]);
  const totalExpired = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'expired').length,
    [tickets]
  );
  const totalCancelled = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'cancelled').length,
    [tickets]
  );
  const filterCounts = useMemo(
    () => ({
      all: tickets.length,
      active: tickets.filter((ticket) => ticket.status === 'active').length,
      used: tickets.filter((ticket) => ticket.status === 'used').length,
      expired: tickets.filter((ticket) => ticket.status === 'expired').length,
      cancelled: tickets.filter((ticket) => ticket.status === 'cancelled').length,
    }),
    [tickets]
  );

  const handleBack = useCallback(() => {
    if (view === 'tickets') setSelectedCategoryKey(null);
    else if (view === 'categories') setSelectedEventKey(null);
  }, [view]);

  // Tombol back Android: naik satu level dulu, bukan langsung keluar dari tab
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (view !== 'events') {
          handleBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [view, handleBack])
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Memuat tiket...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Level 1: kartu event ───────────────────────────────────
  const renderEventCard = (event: EventGroup) => {
    const active = event.tickets.filter(isActive).length;
    const poster = event.tickets.map((t) => getText(t, 'poster')).find(Boolean) ?? null;
    const location = event.location ? String(event.location) : null;

    return (
      <Pressable
        key={event.key}
        onPress={() => {
          setSelectedEventKey(event.key);
          setSelectedCategoryKey(null);
        }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <MaterialIcons name="music-note" size={24} color={Colors.burgundy} />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {event.event_title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {formatEventDate(event.event_date, event.start_time)}
          </Text>
          {location && (
            <Text style={styles.cardMeta} numberOfLines={1}>
              {location}
            </Text>
          )}
          <View style={styles.countRow}>
            <Text style={styles.countText}>{event.tickets.length} tiket</Text>
            {active > 0 && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{active} aktif</Text>
              </View>
            )}
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={22} color={GRAY.mid} />
      </Pressable>
    );
  };

  // ─── Level 2: kartu kategori ────────────────────────────────
  const renderCategoryCard = (category: CategoryGroup) => {
    const active = category.tickets.filter(isActive).length;
    const scanned = category.tickets.filter(isScanned).length;
    return (
      <Pressable
        key={category.key}
        onPress={() => setSelectedCategoryKey(category.key)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <MaterialIcons name="confirmation-number" size={22} color={Colors.burgundy} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {category.category_name}
          </Text>
          <View style={styles.countRow}>
            <Text style={styles.countText}>{category.tickets.length} tiket</Text>
            {active > 0 && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{active} aktif</Text>
              </View>
            )}
            {scanned > 0 && (
              <View style={styles.usedPill}>
                <Text style={styles.usedPillText}>{scanned} sudah digunakan</Text>
              </View>
            )}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={GRAY.mid} />
      </Pressable>
    );
  };

  // ─── Level 3: satu tiket ────────────────────────────────────
  const renderTicketItem = (t: Ticket) => {
    const live = isActive(t);
    const st = statusOf(t);
    const code = getText(t, 'ticket_code');
    const category = getText(t, 'category_name');

    return (
      <Pressable
        key={t.id}
        onPress={() => router.push(`/tiket/${t.id}` as Href)}
        style={({ pressed }) => [styles.card, !live && styles.cardDim, pressed && styles.pressed]}
      >
        <View style={[styles.iconBox, !live && styles.iconBoxGray]}>
          <MaterialIcons
            name="qr-code-2"
            size={24}
            color={live ? Colors.burgundy : GRAY.mid}
          />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.ticketCode} numberOfLines={1}>
            {code ?? `Tiket #${t.id}`}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[category, formatEventDate(t.event_date, t.start_time)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={22} color={GRAY.mid} />
      </Pressable>
    );
  };

  const emptyBox = (title: string, sub: string) => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="confirmation-number" size={28} color={GRAY.mid} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );

  const upcoming = events.filter((e) => e.tickets.some(isActive));
  const past = events.filter((e) => !e.tickets.some(isActive));

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAll(true)}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        ),
      }}
    >
      {/* Header */}
      {view === 'events' ? (
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Tiket Saya</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-back" size={20} color={GRAY.dark} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.subTitle} numberOfLines={2}>
              {view === 'categories'
                ? selectedEvent?.event_title
                : selectedCategory?.category_name}
            </Text>
            <Text style={styles.subCaption} numberOfLines={1}>
              {view === 'categories'
                ? formatEventDate(selectedEvent?.event_date, selectedEvent?.start_time)
                : selectedEvent?.event_title}
            </Text>
          </View>
        </View>
      )}

      {loadError ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="cloud-off" size={28} color={GRAY.mid} />
          </View>
          <Text style={styles.emptyTitle}>Tiket tidak dapat dimuat</Text>
          <Text style={styles.emptySub}>{loadError}</Text>
          <Pressable
            onPress={() => loadAll(true)}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : view === 'events' ? (
        tickets.length === 0 ? (
          emptyBox('Belum ada tiket', 'Tiket yang kamu beli akan muncul di sini.')
        ) : (
          <>
            {/* Ringkasan */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{tickets.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: Colors.burgundy }]}>{totalActive}</Text>
                <Text style={styles.statLabel}>Aktif</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{totalScanned}</Text>
                <Text style={styles.statLabel}>Sudah discan</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{totalExpired}</Text>
                <Text style={styles.statLabel}>Kedaluwarsa</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{totalCancelled}</Text>
                <Text style={styles.statLabel}>Dibatalkan</Text>
              </View>
            </View>

            <Text style={styles.filterLabel}>Filter tiket</Text>
            <View style={styles.filterList}>
              {TICKET_FILTERS.map((filter) => {
                const selected = ticketFilter === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setTicketFilter(filter.key)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {filter.label} ({filterCounts[filter.key]})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {events.length === 0 ? (
              emptyBox(
                'Tidak ada tiket pada filter ini',
                'Pilih filter lain untuk melihat tiketmu.'
              )
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Akan datang</Text>
                    <View style={styles.list}>{upcoming.map(renderEventCard)}</View>
                  </>
                )}

                {past.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Riwayat</Text>
                    <View style={styles.list}>{past.map(renderEventCard)}</View>
                  </>
                )}
              </>
            )}

            <View style={styles.note}>
              <MaterialIcons name="shield" size={14} color={GRAY.mid} />
              <Text style={styles.noteText}>
                Jangan bagikan QR Code tiketmu kepada siapa pun.
              </Text>
            </View>
          </>
        )
      ) : view === 'categories' ? (
        categories.length === 0 ? (
          emptyBox('Belum ada kategori', 'Tidak ada kategori tiket pada event ini.')
        ) : (
          <View style={styles.list}>{categories.map(renderCategoryCard)}</View>
        )
      ) : categoryTickets.length === 0 ? (
        emptyBox('Belum ada tiket', 'Tidak ada tiket dalam kategori ini.')
      ) : (
        <View style={styles.list}>{categoryTickets.map(renderTicketItem)}</View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Fonts.regular, fontSize: 13, color: GRAY.text },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.burgundy,
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: GRAY.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    lineHeight: 25,
    color: GRAY.dark,
  },
  subCaption: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: GRAY.text,
    marginTop: 2,
  },

  // Ringkasan
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GRAY.line,
    padding: 10,
    marginBottom: 20,
  },
  stat: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 12,
    backgroundColor: GRAY.soft,
    paddingHorizontal: 4,
  },
  statNum: { fontFamily: Fonts.bold, fontSize: 20, color: GRAY.dark },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    color: GRAY.text,
    textAlign: 'center',
  },
  filterLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: GRAY.dark,
    marginBottom: 8,
  },
  filterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: GRAY.line,
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundy,
  },
  filterChipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: GRAY.text,
  },
  filterChipTextSelected: { color: '#FFFFFF' },

  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: GRAY.mid,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  list: { gap: 10, marginBottom: 16 },

  // Kartu (dipakai di ketiga level)
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GRAY.line,
    padding: 12,
  },
  cardDim: { opacity: 0.7 },
  pressed: { opacity: 0.85 },
  cardBody: { flex: 1, minWidth: 0, gap: 3 },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: GRAY.dark,
  },
  cardMeta: { fontFamily: Fonts.regular, fontSize: 12, color: GRAY.text },

  poster: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: GRAY.soft,
  },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(91,15,24,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGray: { backgroundColor: GRAY.soft },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  countText: { fontFamily: Fonts.semibold, fontSize: 12, color: GRAY.dark },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(91,15,24,0.08)',
  },
  activePillText: { fontFamily: Fonts.bold, fontSize: 10.5, color: Colors.burgundy },
  usedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: GRAY.soft,
  },
  usedPillText: { fontFamily: Fonts.bold, fontSize: 10.5, color: GRAY.text },

  ticketCode: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    letterSpacing: 0.4,
    color: GRAY.dark,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
    marginTop: 3,
  },
  statusText: { fontFamily: Fonts.bold, fontSize: 10.5, letterSpacing: 0.3 },

  // Catatan keamanan
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  noteText: { fontFamily: Fonts.regular, fontSize: 11.5, color: GRAY.mid },

  // Kosong / error
  emptyBox: { alignItems: 'center', paddingVertical: 56, gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GRAY.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 15, color: GRAY.dark },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: GRAY.text,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.burgundy,
  },
  retryText: { fontFamily: Fonts.semibold, fontSize: 13, color: '#FFFFFF' },
});