// Safe Storage wrapper with memory fallback for environments where localStorage is restricted
const memoryStorage = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__cinematch_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const canUseLocalStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (canUseLocalStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return memoryStorage.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (canUseLocalStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
    memoryStorage.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (canUseLocalStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    memoryStorage.delete(key);
  },

  clear: (): void => {
    try {
      if (canUseLocalStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}
    memoryStorage.clear();
  },
};
