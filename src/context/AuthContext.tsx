import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

type User = {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role?: string;
  profile_image?: string | null;
  [k: string]: any;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi saat app dibuka
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.get('token');
        if (token) {
          const res = await api.get('/users/me');
          setUser(res.data.data); // backend membungkus respons: { success, message, data }
        }
      } catch {
        await storage.remove('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data.data; // { token, user } ada di dalam "data"
    if (!token) throw new Error('Server tidak mengembalikan token');
    await storage.set('token', token);
    setUser(user);
  };

  const register = async (username: string, email: string, phone: string, password: string) => {
    // Endpoint register hanya membuat akun (tanpa token), jadi langsung login setelahnya
    await api.post('/auth/register', { username, email, phone, password });
    await login(email, password);
  };

  const logout = async () => {
    await storage.remove('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}