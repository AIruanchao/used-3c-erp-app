import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useObjectOutput } from 'react-native-vision-camera';
import { IconButton } from 'react-native-paper';
import { useAppStore } from '../../stores/app-store';
import type { ScannedCode, ScannedObject, ScannedObjectType } from 'react-native-vision-camera';

interface BarcodeScannerViewProps {
  onBarcodeScanned: (code: string, format: string) => void;
  isActive?: boolean;
}

const FORMAT_MAP: Record<string, string> = {
  'code-128': 'Code128',
  'ean-13': 'EAN13',
  'ean-8': 'EAN8',
  'qr': 'QR',
  'itf-14': 'ITF',
  'interleaved-2-of-5': 'ITF',
  'upc-e': 'UPC-E',
  'code-39': 'Code39',
  'code-93': 'Code93',
  'codabar': 'Codabar',
};

const BARCODE_TYPES: ScannedObjectType[] = [
  'code-128', 'code-39', 'code-39-mod-43', 'code-93',
  'ean-13', 'ean-8',
  'interleaved-2-of-5', 'itf-14',
  'upc-e',
  'qr',
  'data-matrix',
  'pdf-417',
  'aztec',
];

export const BarcodeScannerView = React.memo(function BarcodeScannerView({
  onBarcodeScanned,
  isActive = true,
}: BarcodeScannerViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const torchOn = useAppStore((s) => s.scannerTorchOn);
  const setScannerTorch = useAppStore((s) => s.setScannerTorch);
  const lastCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef(0);
  const [lastCodeDisplay, setLastCodeDisplay] = useState<string | null>(null);

  const handleObjectsScanned = useCallback(
    (objects: ScannedObject[]) => {
      if (!isActive) return;
      const now = Date.now();
      if (now - lastScanTimeRef.current < 500) return;

      for (const obj of objects) {
        if (!('value' in obj)) continue;
        const scannedCode = obj as ScannedCode;
        const value = scannedCode.value;
        if (!value) continue;
        if (value === lastCodeRef.current) continue;

        lastScanTimeRef.current = now;
        lastCodeRef.current = value;
        setLastCodeDisplay(value);
        const format = FORMAT_MAP[obj.type] ?? obj.type;
        onBarcodeScanned(value, format);
        break;
      }
    },
    [isActive, onBarcodeScanned],
  );

  const objectOutput = useObjectOutput({
    types: BARCODE_TYPES,
    onObjectsScanned: handleObjectsScanned,
  });

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <IconButton icon="camera" size={48} iconColor="#757575" />
        <Text style={styles.permissionText}>需要相机权限以扫描条码</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>授权相机</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.permissionText}>正在初始化相机...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={isActive}
        torchMode={torchOn ? 'on' : 'off'}
        outputs={[objectOutput]}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.torchBtn}
          onPress={() => setScannerTorch(!torchOn)}
        >
          <IconButton
            icon={torchOn ? 'flashlight' : 'flashlight-off'}
            iconColor="#fff"
            size={24}
          />
        </TouchableOpacity>
      </View>
      {lastCodeDisplay ? (
        <View style={styles.lastCode}>
          <Text style={styles.lastCodeText} numberOfLines={1}>
            上次扫码: {lastCodeDisplay}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#4caf50',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  controls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
  },
  torchBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lastCode: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
  },
  lastCodeText: {
    color: '#4caf50',
    fontSize: 14,
  },
});
