import { create } from 'zustand';
import { mmkv, STORAGE_KEYS } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  theme: ThemeMode;
  isOffline: boolean;
  scannerTorchOn: boolean;
  offlineQueueCount: number;

  setTheme: (theme: ThemeMode) => void;
  setOffline: (offline: boolean) => void;
  setScannerTorch: (on: boolean) => void;
  setOfflineQueueCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Real theme applied after `hydrateStorage` in `app/_layout` (see `getStoredThemeOrDefault`)
  theme: 'system',
  isOffline: false,
  scannerTorchOn: false,
  offlineQueueCount: 0,

  setTheme: (theme) => {
    mmkv.set(STORAGE_KEYS.THEME, theme);
    set({ theme });
  },

  setOffline: (offline) => set({ isOffline: offline }),

  setScannerTorch: (on) => set({ scannerTorchOn: on }),

  setOfflineQueueCount: (count) => set({ offlineQueueCount: count }),
}));
