export type LedgerType =
  | 'PURCHASE_COST'
  | 'OTHER_COST'
  | 'SALE_INCOME'
  | 'REPAIR_INCOME'
  | 'REFUND'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'OTHER';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
export type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';

export interface LedgerEntry {
  id: string;
  storeId: string;
  organizationId: string;
  type: LedgerType;
  amount: string;
  deviceId: string | null;
  relatedOrderId: string | null;
  relatedOrderType: string | null;
  itemCategory: string | null;
  description: string;
  userId: string;
  createdAt: string;
}

export interface PayableItem {
  id: string;
  supplierId: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  dueDate: string | null;
  Supplier?: {
    id: string;
    name: string;
  };
}

export interface ReceivableItem {
  id: string;
  customerId: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  dueDate: string | null;
  Customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  tier?: string;
  memberLevel?: string;
  memberPoints?: number;
  balance?: number;
  lifetimeValue: number | string;
  lastInteractionAt?: string | null;
  createdAt: string;
}

export interface SupplierItem {
  id: string;
  name: string;
  phone?: string;
  contactName?: string | null;
}
