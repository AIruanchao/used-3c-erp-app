import { useCallback, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import { useInboundStore } from '../stores/inbound-store';

interface UseScannerOptions {
  onScan?: (code: string, format: string) => void;
  debounceMs?: number;
  enableHaptic?: boolean;
}

export function useScanner(options: UseScannerOptions = {}) {
  const { onScan, debounceMs = 500, enableHaptic = true } = options;
  const lastScanTime = useRef(0);
  const addScanResult = useInboundStore((s) => s.addScanResult);

  const handleBarcodeScanned = useCallback(
    (code: string, format: string) => {
      const now = Date.now();
      if (now - lastScanTime.current < debounceMs) return;
      lastScanTime.current = now;

      // Haptic feedback
      if (enableHaptic) {
        Vibration.vibrate(50);
      }

      // Sound feedback - short system click via Vibration on Android
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }

      addScanResult({
        code,
        format,
        timestamp: now,
        synced: false,
      });

      onScan?.(code, format);
    },
    [debounceMs, onScan, addScanResult, enableHaptic],
  );

  return {
    isScanning: true as const,
    handleBarcodeScanned,
  };
}
