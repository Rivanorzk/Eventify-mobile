import * as SecureStore from 'expo-secure-store';

// Khusus mobile (Android/iOS): semua disimpan terenkripsi lewat SecureStore.
export const storage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};