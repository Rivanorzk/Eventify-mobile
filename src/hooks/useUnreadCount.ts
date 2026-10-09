import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '@/lib/api';

interface Options {
  pollMs?: number;
}

export function useUnreadCount({ pollMs = 30000 }: Options = {}) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const n =
        res?.data?.data?.unread_count ??
        res?.data?.unread_count ??
        0;
      if (mountedRef.current) {
        setCount(Number(n) || 0);
      }
    } catch (err: any) {
      // Silent — jangan crash header
      console.log('🔕 unread fetch error:', err?.response?.status);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Fetch pertama kali mount
  useEffect(() => {
    mountedRef.current = true;
    fetchCount();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCount]);

  // Polling
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;
    const id = setInterval(fetchCount, pollMs);
    return () => clearInterval(id);
  }, [fetchCount, pollMs]);

  // Refetch saat app kembali ke foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        fetchCount();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount, setCount };
}