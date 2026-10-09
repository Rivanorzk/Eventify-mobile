import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import SearchBar from '@/components/dashboard/SearchBar';
import CategoryPills, { CategoryChip } from '@/components/dashboard/CategoryPills';
import HeroCard from '@/components/dashboard/HeroCard';
import HotEventCard from '@/components/dashboard/HotEventCard';
import UpcomingEventCard from '@/components/dashboard/UpcomingEventCard';
import ActiveTicketCard from '@/components/dashboard/ActiveTicketCard';
import TrustStrip from '@/components/dashboard/TrustStript';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { EventItem, Ticket, Category, CustomerDashboardStats } from '@/types/api';

const BASE_CATEGORY: CategoryChip = {
  id: 'all',
  label: 'Semua Event',
  icon: 'grid-view',
};

// ─── API helpers ───────────────────────────────────────────────
async function fetchDashboard() {
  const res = await api.get('/dashboard/customer');
  return res.data.data as CustomerDashboardStats;
}

async function fetchCategories() {
  try {
    const res = await api.get('/categories');
    return (res.data.data ?? []) as Category[];
  } catch {
    return [];
  }
}

async function fetchEvents(params: { status: string; sort: string }) {
  try {
    const res = await api.get('/events', { params });
    return (res.data.data ?? []) as EventItem[];
  } catch {
    return [];
  }
}

async function fetchMyTickets() {
  try {
    const res = await api.get('/tickets/me');
    return (res.data.data ?? []) as Ticket[];
  } catch {
    return [];
  }
}

async function toggleReminder(eventId: number) {
  const res = await api.post(`/reminders/${eventId}`);
  return res.data.data as { is_reminded: boolean };
}

// ─── Screen ────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | number>('all');
  const [categories, setCategories] = useState<CategoryChip[]>([BASE_CATEGORY]);

  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [hotEvents, setHotEvents] = useState<EventItem[]>([]);
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsRes, categoriesRes, latestEvents, dateEvents, ticketsRes] =
        await Promise.all([
          fetchDashboard().catch(() => null),
          fetchCategories(),
          fetchEvents({ status: 'published', sort: 'latest' }),
          fetchEvents({ status: 'draft', sort: 'date' }),
          fetchMyTickets(),
        ]);

      setStats(statsRes);
      setCategories([
        BASE_CATEGORY,
        ...categoriesRes.map((c) => ({
          id: String(c.id),
          label: c.category_name,
          icon: 'music-note' as const,
        })),
      ]);
      setHotEvents(latestEvents.slice(0, 6));

      const todayStr = new Date().toISOString().slice(0, 10);
      setUpcoming(
        dateEvents
          .filter((e) => e.event_date && e.event_date.slice(0, 10) >= todayStr)
          .slice(0, 3)
      );
      setMyTickets(ticketsRes);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const visibleEvents = useMemo(() => {
    let events = hotEvents;
    if (activeCategory !== 'all') {
      events = events.filter((e) => String(e.category_id) === String(activeCategory));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q)
      );
    }
    return events;
  }, [activeCategory, hotEvents, searchQuery]);

  const heroEvent = hotEvents[0];

  const activeTicket = useMemo(() => {
    return (
      myTickets
        .filter((t) => t.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        )[0] || null
    );
  }, [myTickets]);

  const handleToggleReminder = async (id: number) => {
    setUpcoming((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_reminded: !it.is_reminded } : it))
    );
    try {
      const result = await toggleReminder(id);
      setUpcoming((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, is_reminded: result.is_reminded } : it
        )
      );
    } catch {
      setUpcoming((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, is_reminded: !it.is_reminded } : it
        )
      );
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.burgundy} />
          <Text style={styles.loadingText}>Memuat dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

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
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.section}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => {}}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <CategoryPills
          categories={categories}
          activeId={activeCategory}
          onChange={setActiveCategory}
        />
      </View>

      {/* Hero */}
      {heroEvent && (
        <View style={styles.section}>
          <HeroCard
            title={heroEvent.title}
            image={heroEvent.poster}
            eventDate={heroEvent.event_date}
            startTime={heroEvent.start_time}
            location={heroEvent.location}
            price={heroEvent.price}
            onPress={() => router.push(`/event/${heroEvent.id}` as Href)}
          />
        </View>
      )}

      {/* Mini Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <MiniStat
            icon="confirmation-number"
            value={String(stats.total_tiket ?? 0)}
            label="Tiket Aktif"
          />
          <MiniStat
            icon="pending-actions"
            value={String(stats.order_pending ?? 0)}
            label="Pending"
          />
          <MiniStat
            icon="check-circle"
            value={String(stats.order_berhasil ?? 0)}
            label="Berhasil"
          />
        </View>
      )}

      {/* Sedang Hangat */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <MaterialIcons name="bolt" size={20} color={Colors.wine} />
          <Text style={styles.sectionTitle}>Sedang Hangat</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingRight: 8, paddingTop: 8 }}
        >
          {visibleEvents.length === 0 && (
            <Text style={styles.emptyText}>Belum ada event untuk filter ini.</Text>
          )}
          {visibleEvents.map((event) => (
            <HotEventCard
              key={event.id}
              title={event.title}
              image={event.poster}
              location={event.location}
              eventDate={event.event_date}
              startTime={event.start_time}
              price={event.price}
              onPress={() => router.push(`/event/${event.id}` as Href)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Akan Datang */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <MaterialIcons name="nightlife" size={20} color={Colors.wine} />
          <Text style={styles.sectionTitle}>Akan Datang Segera</Text>
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          {upcoming.length === 0 && (
            <Text style={styles.emptyText}>Tidak ada event mendatang.</Text>
          )}
          {upcoming.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              onToggleReminder={handleToggleReminder}
              onDetail={(id) => router.push(`/event/${id}` as Href)}
            />
          ))}
        </View>
      </View>

      {/* Tiket Kamu */}
      {activeTicket && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiket Kamu</Text>
          <View style={{ marginTop: 12 }}>
            <ActiveTicketCard
              ticket={activeTicket}
              onPress={() => router.push(`/tiket/${activeTicket.id}` as Href)}
            />
          </View>
        </View>
      )}

      {/* Trust */}
      <View style={styles.section}>
        <TrustStrip />
      </View>
    </ScreenContainer>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <MaterialIcons name={icon as any} size={20} color={Colors.burgundy} />
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  errorBox: {
    backgroundColor: '#FDF3D8',
    borderRadius: 12,
    padding: 12,
    marginBottom: Spacing.md,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 13, color: '#B4841F' },
  section: { marginBottom: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.espresso,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    paddingVertical: 20,
    textAlign: 'center',
    width: '100%',
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
  },
  miniStatValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.espresso,
  },
  miniStatLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
});