import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';

const memoryFallback = new Map();

export const storage = {
  async setToken(token) {
    try {
      memoryFallback.set(STORAGE_KEYS.AUTH_TOKEN, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (e) {
      // Memory fallback active
    }
  },

  async getToken() {
    try {
      const val = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (val) return val;
      return memoryFallback.get(STORAGE_KEYS.AUTH_TOKEN) || null;
    } catch (e) {
      return memoryFallback.get(STORAGE_KEYS.AUTH_TOKEN) || null;
    }
  },

  async setUser(user) {
    try {
      const str = JSON.stringify(user);
      memoryFallback.set(STORAGE_KEYS.USER_DATA, str);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, str);
    } catch (e) {
      // Memory fallback active
    }
  },

  async getUser() {
    try {
      const str = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      if (str) return JSON.parse(str);
      const mem = memoryFallback.get(STORAGE_KEYS.USER_DATA);
      return mem ? JSON.parse(mem) : null;
    } catch (e) {
      const mem = memoryFallback.get(STORAGE_KEYS.USER_DATA);
      return mem ? JSON.parse(mem) : null;
    }
  },

  async setServerUrl(url) {
    try {
      memoryFallback.set(STORAGE_KEYS.SERVER_URL, url);
      await SecureStore.setItemAsync(STORAGE_KEYS.SERVER_URL, url);
    } catch (e) {
      // Memory fallback active
    }
  },

  async getServerUrl() {
    try {
      const val = await SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL);
      if (val) return val;
      return memoryFallback.get(STORAGE_KEYS.SERVER_URL) || null;
    } catch (e) {
      return memoryFallback.get(STORAGE_KEYS.SERVER_URL) || null;
    }
  },

  async clearAll() {
    try {
      memoryFallback.delete(STORAGE_KEYS.AUTH_TOKEN);
      memoryFallback.delete(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA).catch(() => {});
    } catch (e) {
      // Memory cleared
    }
  },
};
