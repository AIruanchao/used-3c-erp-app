export interface InboundFormData {
  sn: string;
  skuId: string;
  storeId: string;
  organizationId: string;
  unitCost: string;
  peerPrice?: string;
  retailPrice?: string;
  condition?: string;
  channel?: string;
  supplierId?: string;
  remark?: string;
}

export interface ImeiCheckResult {
  valid: boolean;
  blocked: boolean;
  blacklistReason: string | null;
  existingDeviceId: string | null;
  inThisStore: boolean;
  inOtherStore: boolean;
  otherStoreName: string | null;
  inventoryStatus: string | null;
  message: string;
}

export interface SkuInfoResult {
  skuId: string | null;
  category: string | null;
}
