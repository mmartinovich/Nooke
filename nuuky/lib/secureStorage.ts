import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { StateStorage } from 'zustand/middleware';

const ENCRYPTION_KEY_ALIAS = 'nooke-storage-key';

// Get or create a persistent encryption key stored in SecureStore
const getEncryptionKey = async (): Promise<string> => {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!key) {
    key = Crypto.randomUUID() + Crypto.randomUUID();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
  }
  return key;
};

// Simple XOR-based obfuscation with the key
// This isn't AES but provides at-rest obfuscation that prevents
// casual reading of AsyncStorage contents. For full AES, a native
// module would be needed since expo-crypto only exposes hashing.
const xorEncrypt = (data: string, key: string): string => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    result.push(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  // Encode as base64-safe string
  return btoa(String.fromCharCode(...result));
};

const xorDecrypt = (encoded: string, key: string): string => {
  const decoded = atob(encoded);
  const result: number[] = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return String.fromCharCode(...result);
};

let cachedKey: string | null = null;

const getKey = async (): Promise<string> => {
  if (!cachedKey) {
    cachedKey = await getEncryptionKey();
  }
  return cachedKey;
};

// Zustand-compatible encrypted storage adapter
export const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const encrypted = await AsyncStorage.getItem(name);
    if (!encrypted) return null;

    try {
      const key = await getKey();
      return xorDecrypt(encrypted, key);
    } catch {
      // If decryption fails (e.g. key changed, old unencrypted data),
      // clear and return null so state rehydrates fresh
      await AsyncStorage.removeItem(name);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const key = await getKey();
    const encrypted = xorEncrypt(value, key);
    await AsyncStorage.setItem(name, encrypted);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};
