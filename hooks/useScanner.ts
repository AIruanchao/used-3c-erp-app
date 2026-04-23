import { useCallback, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { useInboundStore } from '../stores/inbound-store';

interface UseScannerOptions {
  onScan?: (code: string, format: string) => void;
  debounceMs?: number;
}

export function useScanner(options: UseScannerOptions = {}) {
  const { onScan, debounceMs = 500 } = options;
  const lastScanTime = useRef(0);
  const [isScanning, setIsScanning] = useState(true);
  const addScanResult = useInboundStore((s) => s.addScanResult);

  const handleBarcodeScanned = useCallback(
    (code: string, format: string) => {
      const now = Date.now();
      if (now - lastScanTime.current < debounceMs) return;
      lastScanTime.current = now;

      Vibration.vibrate(50);

      addScanResult({
        code,
        format,
        timestamp: now,
        synced: false,
      });

      onScan?.(code, format);
    },
    [debounceMs, onScan, addScanResult],
  );

  const toggleScanning = useCallback(() => {
    setIsScanning((prev) => !prev);
  }, []);

  return {
    isScanning,
    handleBarcodeScanned,
    toggleScanning,
  };
}
