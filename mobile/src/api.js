import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// For Android emulator 10.0.2.2 points to host, for iOS / web localhost works
const DEFAULT_HOST = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const API_BASE_URL = DEFAULT_HOST;

let userToken = null;

export const setToken = async (token) => {
  userToken = token;
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem('stylemate_mobile_token', token);
    else localStorage.removeItem('stylemate_mobile_token');
  } else if (token) {
    await SecureStore.setItemAsync('stylemate_mobile_token', token);
  } else {
    await SecureStore.deleteItemAsync('stylemate_mobile_token');
  }
};

export const getToken = async () => {
  if (userToken) return userToken;
  if (Platform.OS === 'web') return localStorage.getItem('stylemate_mobile_token');
  userToken = await SecureStore.getItemAsync('stylemate_mobile_token');
  return userToken;
};

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...(options.headers || {}) };
  headers['X-StyleMate-Client'] = 'mobile';
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || `HTTP error ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return data;
  } catch (err) {
    if (!err.status || err.status >= 500) console.error(`Mobile API error on ${endpoint}:`, err);
    throw err;
  }
}
