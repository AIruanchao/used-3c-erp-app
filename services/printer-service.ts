import { BleManager, type Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

const ESC = 0x1b;

class BluetoothPrinterService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;

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
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
    }
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

  async printText(text: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Initialize printer
    commands.push(ESC, 0x40);
    // Set Chinese character set (GBK)
    commands.push(ESC, 0x74, 0x01);

    const textBytes = encoder.encode(text);
    for (let i = 0; i < textBytes.length; i++) {
      commands.push(textBytes[i]!);
    }
    commands.push(0x0a, 0x0a, 0x0a);

    await this.writeToPrinter(commands);
    return true;
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

    return this.printText(receipt);
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

    return this.printText(receipt);
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

    return this.printText(receipt);
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
      `销售额: ¥${data.totalSales}`,
      `采购额: ¥${data.totalPurchases}`,
      `入库: ${data.deviceCount}台`,
      `维修: ${data.repairCount}单`,
      '',
      '==================',
      '安徽嫩叶科技有限公司',
    ].join('\n');

    return this.printText(receipt);
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
