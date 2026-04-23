export type InventoryStatus = 'IN_STOCK' | 'SOLD' | 'RETURNED_OUT';
export type DeviceCondition = '99新' | '98新' | '97新' | '96新' | '95新' | '9成新' | '8成新' | '充新' | '靓机' | '小花靓' | '小花' | '大花' | '外爆' | '内爆' | '内外爆' | '后盖爆' | '7新' | '7新以下';
export type LockStatus = 'NONE' | 'ICLOUD' | 'ACTIVATION' | 'CARRIER' | 'MDM' | 'UNKNOWN';
export type SkuCategory = 'USED_DEVICE' | 'NEW_DEVICE' | 'COMPUTER' | 'ACCESSORY' | 'PART';

export interface Device {
  id: string;
  sn: string;
  internalSn: string | null;
  skuId: string;
  storeId: string;
  organizationId: string;
  inventoryStatus: InventoryStatus;
  batteryHealthPercent: number | null;
  inboundAt: string | null;
  warrantyDays: number | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyType: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  Sku?: SkuItem;
  DevicePricing?: DevicePricing;
  DeviceSpec?: DeviceSpec;
  Store?: StoreBasic;
}

export interface DevicePricing {
  id: string;
  deviceId: string;
  unitCost: string;
  peerPrice: string | null;
  retailPrice: string | null;
  otherCost: string;
  settlementStatus: string;
  settlementMethod: string | null;
}

export interface DeviceSpec {
  id: string;
  deviceId: string;
  condition: string | null;
  channel: string | null;
  systemVersion: string | null;
  lockStatus: string;
  dataWiped: boolean | null;
  idRemoved: boolean | null;
}

export interface SkuItem {
  id: string;
  code: string;
  name: string;
  category: SkuCategory;
  barcode: string | null;
  trackBySn: boolean;
  condition: string | null;
  Model?: ModelItem;
}

export interface ModelItem {
  id: string;
  name: string;
  Brand?: BrandItem;
  ProductCategory?: ProductCategoryItem;
}

export interface BrandItem {
  id: string;
  name: string;
  brandCode: string | null;
}

export interface ProductCategoryItem {
  id: string;
  name: string;
}

export interface StoreBasic {
  id: string;
  name: string;
  code: string;
}
