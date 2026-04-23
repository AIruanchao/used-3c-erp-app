import { create } from 'zustand';
import { mmkv, STORAGE_KEYS } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  theme: ThemeMode;
  isOffline: boolean;
  scannerTorchOn: boolean;

  setTheme: (theme: ThemeMode) => void;
  setOffline: (offline: boolean) => void;
  setScannerTorch: (on: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: (mmkv.getString(STORAGE_KEYS.THEME) as ThemeMode) || 'system',
  isOffline: false,
  scannerTorchOn: false,

  setTheme: (theme) => {
    mmkv.set(STORAGE_KEYS.THEME, theme);
    set({ theme });
  },

  setOffline: (offline) => set({ isOffline: offline }),

  setScannerTorch: (on) => set({ scannerTorchOn: on }),
}));
