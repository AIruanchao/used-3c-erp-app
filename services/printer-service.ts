import { BleManager, type Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { mmkv } from '../lib/storage';

const ESC = 0x1b;
const PRINT_HISTORY_KEY = 'print_history';
const MAX_HISTORY = 50;
const MAX_RETRIES = 3;

interface PrintHistoryEntry {
  id: string;
  type: string;
  timestamp: number;
  success: boolean;
  printerName: string | null;
  content: string;
}

class BluetoothPrinterService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private lastDeviceId: string | null = null;

  private PRINTER_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
  private PRINTER_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted'
      );
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === 'granted';
  }

  async scanPrinters(): Promise<Array<{ id: string; name: string | null }>> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) throw new Error('蓝牙权限未授予');

    return new Promise((resolve) => {
      const devices: Map<string, { id: string; name: string | null }> = new Map();

      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          this.manager.stopDeviceScan();
          resolve([]);
          return;
        }
        if (device?.name) {
          devices.set(device.id, { id: device.id, name: device.name });
        }
      });

      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(Array.from(devices.values()));
      }, 5000);
    });
  }

  async connect(deviceId: string): Promise<boolean> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;
      this.lastDeviceId = deviceId;
      return true;
    } catch {
      this.connectedDevice = null;
      return false;
    }
  }

  /** Reconnect to the last used printer */
  async reconnect(): Promise<boolean> {
    if (!this.lastDeviceId) return false;
    return this.connect(this.lastDeviceId);
  }

  /** Check if connected, attempt reconnect if not */
  private async ensureConnected(): Promise<boolean> {
    if (this.connectedDevice) {
      try {
        const isConnected = await this.manager.isDeviceConnected(this.connectedDevice.id);
        if (isConnected) return true;
      } catch {
        // Not connected, try reconnect
      }
    }

    if (this.lastDeviceId) {
      return await this.reconnect();
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch {
        // Ignore disconnect errors
      }
      this.connectedDevice = null;
    }
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedPrinterName(): string | null {
    return this.connectedDevice?.name ?? null;
  }

  private async writeToPrinter(commands: number[]): Promise<void> {
    if (!this.connectedDevice) throw new Error('未连接打印机');

    const base64 = this.arrayToBase64(commands);
    const services = await this.connectedDevice.services();
    const service = services.find(
      (s) => s.uuid.toLowerCase() === this.PRINTER_SERVICE_UUID,
    );
    if (!service) throw new Error('找不到打印服务');

    const characteristics = await service.characteristics();
    const char = characteristics.find(
      (c) => c.uuid.toLowerCase() === this.PRINTER_CHAR_UUID,
    );
    if (!char) throw new Error('找不到打印特征');

    await char.writeWithResponse(base64);
  }

  /** Print with automatic retry on disconnection */
  private async printWithRetry(commands: number[]): Promise<boolean> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const reconnected = await this.ensureConnected();
          if (!reconnected) continue;
        }
        await this.writeToPrinter(commands);
        return true;
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          throw err;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    return false;
  }

  async printText(text: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    commands.push(ESC, 0x40);
    commands.push(ESC, 0x74, 0x01);

    const textBytes = encoder.encode(text);
    for (let i = 0; i < textBytes.length; i++) {
      commands.push(textBytes[i]!);
    }
    commands.push(0x0a, 0x0a, 0x0a);

    return this.printWithRetry(commands);
  }

  async printInboundReceipt(data: {
    sn: string;
    skuName: string;
    unitCost: string;
    storeName: string;
    operatorName: string;
    date: string;
  }): Promise<boolean> {
    const receipt = [
      '===== 入库单 =====',
      '',
      `门店: ${data.storeName}`,
      `时间: ${data.date}`,
      `操作员: ${data.operatorName}`,
      '',
      `SN: ${data.sn}`,
      `型号: ${data.skuName}`,
      `成本: ¥${data.unitCost}`,
      '',
      '==================',
      '安徽嫩叶科技有限公司',
    ].join('\n');

    const success = await this.printText(receipt);
    this.addHistory('inbound', success, receipt);
    return success;
  }

  async printOutboundReceipt(data: {
    sn: string;
    skuName: string;
    salePrice: string;
    storeName: string;
    operatorName: string;
    date: string;
    paymentMethod: string;
  }): Promise<boolean> {
    const receipt = [
      '===== 出库单 =====',
      '',
      `门店: ${data.storeName}`,
      `时间: ${data.date}`,
      `操作员: ${data.operatorName}`,
      '',
      `SN: ${data.sn}`,
      `型号: ${data.skuName}`,
      `售价: ¥${data.salePrice}`,
      `支付: ${data.paymentMethod}`,
      '',
      '==================',
      '安徽嫩叶科技有限公司',
    ].join('\n');

    const success = await this.printText(receipt);
    this.addHistory('outbound', success, receipt);
    return success;
  }

  async printRepairReceipt(data: {
    repairId: string;
    sn: string;
    description: string;
    estimatedCost: string;
    storeName: string;
    date: string;
  }): Promise<boolean> {
    const receipt = [
      '===== 维修单 =====',
      '',
      `门店: ${data.storeName}`,
      `时间: ${data.date}`,
      `工单号: ${data.repairId}`,
      '',
      `SN: ${data.sn}`,
      `故障: ${data.description}`,
      `估价: ¥${data.estimatedCost}`,
      '',
      '==================',
      '安徽嫩叶科技有限公司',
    ].join('\n');

    const success = await this.printText(receipt);
    this.addHistory('repair', success, receipt);
    return success;
  }

  async printDailySettlement(data: {
    storeName: string;
    date: string;
    totalSales: string;
    totalPurchases: string;
    deviceCount: number;
    repairCount: number;
  }): Promise<boolean> {
    const receipt = [
      '===== 日结单 =====',
      '',
      `门店: ${data.storeName}`,
      `日期: ${data.date}`,
      '',
      `销售额: ${data.totalSales}`,
      `采购额: ${data.totalPurchases}`,
      `入库: ${data.deviceCount}台`,
      `出库: ${data.repairCount}台`,
      '',
      '==================',
      '安徽嫩叶科技有限公司',
    ].join('\n');

    const success = await this.printText(receipt);
    this.addHistory('settlement', success, receipt);
    return success;
  }

  /** Get print history */
  getHistory(): PrintHistoryEntry[] {
    const raw = mmkv.getString(PRINT_HISTORY_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PrintHistoryEntry[];
    } catch {
      return [];
    }
  }

  /** Clear print history */
  clearHistory(): void {
    mmkv.remove(PRINT_HISTORY_KEY);
  }

  private addHistory(type: string, success: boolean, content: string): void {
    const history = this.getHistory();
    history.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      timestamp: Date.now(),
      success,
      printerName: this.getConnectedPrinterName(),
      content: content.slice(0, 200),
    });
    const trimmed = history.slice(0, MAX_HISTORY);
    mmkv.set(PRINT_HISTORY_KEY, JSON.stringify(trimmed));
  }

  destroy(): void {
    this.manager.destroy();
  }

  private arrayToBase64(arr: number[]): string {
    const binary = arr.map((n) => String.fromCharCode(n)).join('');
    return btoa(binary);
  }
}

export const printerService = new BluetoothPrinterService();
