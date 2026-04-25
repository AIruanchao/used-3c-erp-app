import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';

interface BarcodeScannerViewProps {
  onBarcodeScanned: (barcode: string) => void;
  isActive: boolean;
}

/**
 * 手动输入条码组件（替代expo-camera扫码）
 * TODO: 后续可用expo-barcode-scanner或其他方案替换
 */
export function BarcodeScannerView({ onBarcodeScanned, isActive }: BarcodeScannerViewProps) {
  const [manualCode, setManualCode] = useState('');

  const handleSubmit = useCallback(() => {
    if (manualCode.trim()) {
      onBarcodeScanned(manualCode.trim());
      setManualCode('');
    }
  }, [manualCode, onBarcodeScanned]);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 扫码功能暂未就绪</Text>
      <Text style={styles.subtitle}>请手动输入条码：</Text>
      <TextInput
        mode="outlined"
        value={manualCode}
        onChangeText={setManualCode}
        placeholder="输入条码/序列号"
        onSubmitEditing={handleSubmit}
        style={styles.input}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>确认</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
