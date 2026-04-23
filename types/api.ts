/** Common API response types */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  错误?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface QuickInboundRequest {
  storeId: string;
  organizationId: string;
  skuId: string;
  sn: string;
  unitCost: number;
  peerPrice?: number | null;
  retailPrice?: number | null;
  otherCost?: number;
  channel?: string | null;
  condition?: string | null;
  systemVersion?: string | null;
  batteryHealth?: number | null;
  lockStatus?: string;
  inspectionTool?: string;
  inspectionData?: Record<string, unknown>;
  checkItems?: Record<string, unknown>;
  sourceType?: string | null;
  sourceCustomerId?: string | null;
  payOnSite?: {
    paymentMethod: string;
    cashAccountId: string;
  } | null;
}

export interface QuickInboundResponse {
  success: string;
  deviceId: string;
  goodsInboundOrderId: string;
  paymentId: string | null;
}

export interface SkuInfoResponse {
  skuId: string | null;
  category: string | null;
}

export interface ImeiCheckResponse {
  sn: string;
  blocked: boolean;
  blacklistReason: string | null;
  existingDeviceId: string | null;
  inThisStore: boolean;
  inOtherStore: boolean;
  otherStoreName: string | null;
  inventoryStatus: string | null;
}

export interface CashierRequest {
  storeId: string;
  organizationId: string;
  deviceId: string;
  salePrice: number;
  unitCost?: number;
  customerId?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  Payment: Array<{
    method: string;
    amount: number;
    cashAccountId?: string;
  }>;
  couponId?: string | null;
  discountAmount?: number;
}

export interface CashierResponse {
  success: string;
  saleOrderId: string;
  paymentId: string;
  totalPaid: number;
  profit: number;
}

export interface StoreItem {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  Organization: {
    id: string;
    name: string;
  };
}

export interface StoreMemberItem {
  id: string;
  userId: string;
  storeId: string;
  role: string;
  Store: StoreItem;
}

export interface RepairCreateRequest {
  storeId: string;
  organizationId: string;
  deviceId?: string | null;
  sn?: string | null;
  customerId?: string | null;
  description: string;
  estimatedCost?: number | null;
}

export interface RepairItem {
  id: string;
  status: string;
  description: string;
  sn: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  createdAt: string;
  updatedAt: string;
  Device?: {
    id: string;
    sn: string;
    Sku?: {
      id: string;
      name: string;
    };
  };
  Customer?: {
    id: string;
    name: string;
    phone: string;
  };
}
