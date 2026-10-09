import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  // Auth masih loading (cek token) — jangan redirect dulu
  if (loading) return null;

  // Sudah login → masuk tabs
  if (user) return <Redirect href="/(tabs)" />;

  // Belum login → ke login
  return <Redirect href="/(auth)/login" />;
}