import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconButton } from 'react-native-paper';
import { useAppStore } from '../../stores/app-store';

export interface BarcodeScannerViewProps {
  /** 扫码或手动确认时回传；`format` 为条码类型或 `manual` */
  onBarcodeScanned: (code: string, format: string) => void;
  isActive?: boolean;
}

const FORMAT_MAP: Record<string, string> = {
  code128: 'Code128',
  ean13: 'EAN13',
  ean8: 'EAN8',
  qr: 'QR',
  itf14: 'ITF',
  interleaved2of5: 'ITF',
  upc_e: 'UPC-E',
  code39: 'Code39',
  code93: 'Code93',
  codabar: 'Codabar',
};

/**
 * 使用 expo-camera（CameraView）进行条码/二维码识别。
 * 与 RN 0.81 的 React 版本一致时使用（react@19.1.0）。
 */
export const BarcodeScannerView = React.memo(function BarcodeScannerView({
  onBarcodeScanned,
  isActive = true,
}: BarcodeScannerViewProps) {
  const torchOn = useAppStore((s) => s.scannerTorchOn);
  const setScannerTorch = useAppStore((s) => s.setScannerTorch);
  const lastCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef(0);
  const [lastCodeDisplay, setLastCodeDisplay] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Hooks must run every render; deactivate after hooks.
  if (!isActive) {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>正在检查相机权限…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>需要相机权限才能扫码</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => { void requestPermission(); }}>
          <Text style={styles.permBtnText}>授权相机</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isActive) return;
    const now = Date.now();
    if (now - lastScanTimeRef.current < 500) return;
    if (data === lastCodeRef.current) return;

    lastScanTimeRef.current = now;
    lastCodeRef.current = data;
    setLastCodeDisplay(data);
    const format = FORMAT_MAP[type] ?? type;
    onBarcodeScanned(data, format);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'code128',
            'code39',
            'code93',
            'itf14',
            'upc_e',
            'codabar',
            'pdf417',
            'aztec',
            'datamatrix',
          ],
        }}
        flash={torchOn ? 'on' : 'off'}
        active={isActive}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.torchBtn}
          onPress={() => setScannerTorch(!torchOn)}
          accessibilityLabel={torchOn ? '关闭闪光灯' : '开启闪光灯'}
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
  centered: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  hint: {
    fontSize: 15,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 12,
  },
  permBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
