import axios from 'axios';
import { storage } from './storage';

// Isi di .env: EXPO_PUBLIC_API_URL=https://nama-backend.up.railway.app/api
// (saat testing lokal pakai URL ngrok / IP LAN, bukan localhost)
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});