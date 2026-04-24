import { mmkv } from '../lib/storage';

const PRINT_HISTORY_KEY = 'print_history';
const MAX_HISTORY = 50;

interface PrintHistoryEntry {
  id: string;
  type: string;
  timestamp: number;
  success: boolean;
  printerName: string | null;
  content: string;
}

/**
 * Printer service stub.
 *
 * BLE printer support requires react-native-ble-plx which is incompatible
 * with Expo SDK 54 (crash on startup). This stub keeps the interface stable
 * so all callers compile; printing will return false until a compatible BLE
 * solution is integrated later.
 */
class BluetoothPrinterService {
  private _connected = false;
  private _printerName: string | null = null;

  async requestPermissions(): Promise<boolean> {
    return false;
  }

  async scanPrinters(): Promise<Array<{ id: string; name: string | null }>> {
    return [];
  }

  async connect(_deviceId: string): Promise<boolean> {
    return false;
  }

  async reconnect(): Promise<boolean> {
    return false;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this._printerName = null;
  }

  isConnected(): boolean {
    return this._connected;
  }

  getConnectedPrinterName(): string | null {
    return this._printerName;
  }

  async printText(_text: string): Promise<boolean> {
    return false;
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

    this.addHistory('inbound', false, receipt);
    return false;
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

    this.addHistory('outbound', false, receipt);
    return false;
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

    this.addHistory('repair', false, receipt);
    return false;
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

    this.addHistory('settlement', false, receipt);
    return false;
  }

  getHistory(): PrintHistoryEntry[] {
    const raw = mmkv.getString(PRINT_HISTORY_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PrintHistoryEntry[];
    } catch {
      return [];
    }
  }

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
      printerName: this._printerName,
      content: content.slice(0, 200),
    });
    const trimmed = history.slice(0, MAX_HISTORY);
    mmkv.set(PRINT_HISTORY_KEY, JSON.stringify(trimmed));
  }

  destroy(): void {
    // no-op
  }
}

export const printerService = new BluetoothPrinterService();
