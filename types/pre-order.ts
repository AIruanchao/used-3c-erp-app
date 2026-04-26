export interface PreOrderLine {
  id?: string;
  modelId: string | null;
  modelName: string;
  color: string | null;
  storage: string | null;
  quantity: number;
  alternativeModelName: string | null;
  unitPrice: string | number | null;
}

export type PreOrderStatus = 'PENDING' | 'SOURCING' | 'COMMUNICATED' | 'CONFIRMED' | 'CANCELLED';

export interface PreOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string | null;
  status: PreOrderStatus;
  depositAmount: string | number | null;
  depositPaid: boolean;
  depositMethod: string | null;
  quoteType: string | null;
  quoteAmount: string | number | null;
  taxRate: string | number | null;
  note: string | null;
  lines: PreOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PreOrderCommLine {
  id: string;
  content: string;
  type?: string;
  createdAt: string;
}

export interface PreOrderDetail extends PreOrder {
  /** 详情接口可能随列表返回，也可能单独挂在详情上 */
  communications?: PreOrderCommLine[];
}
