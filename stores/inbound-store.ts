import { create } from 'zustand';
import { mmkv, STORAGE_KEYS } from '../lib/storage';

export interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
  synced: boolean;
}

interface InboundState {
  scanResults: ScanResult[];
  currentSkuId: string | null;
  currentSkuName: string | null;

  addScanResult: (result: ScanResult) => void;
  clearScanResults: () => void;
  markSynced: (code: string) => void;
  setCurrentSku: (skuId: string | null, skuName: string | null) => void;
  loadOfflineCache: () => void;
  saveOfflineCache: () => void;
}

export const useInboundStore = create<InboundState>((set, get) => ({
  scanResults: [],
  currentSkuId: null,
  currentSkuName: null,

  addScanResult: (result) => {
    set((state) => ({
      scanResults: [...state.scanResults, result],
    }));
    get().saveOfflineCache();
  },

  clearScanResults: () => {
    set({ scanResults: [] });
    mmkv.remove(STORAGE_KEYS.SCAN_HISTORY);
  },

  markSynced: (code) => {
    set((state) => ({
      scanResults: state.scanResults.map((r) =>
        r.code === code ? { ...r, synced: true } : r,
      ),
    }));
    get().saveOfflineCache();
  },

  setCurrentSku: (skuId, skuName) => set({ currentSkuId: skuId, currentSkuName: skuName }),

  loadOfflineCache: () => {
    const raw = mmkv.getString(STORAGE_KEYS.SCAN_HISTORY);
    if (raw) {
      try {
        const results = JSON.parse(raw) as ScanResult[];
        set({ scanResults: results });
      } catch {
        // ignore corrupt cache
      }
    }
  },

  saveOfflineCache: () => {
    const { scanResults } = get();
    mmkv.set(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(scanResults));
  },
}));
