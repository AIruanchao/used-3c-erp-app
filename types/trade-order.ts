export interface TradeInItemDto {
  id: string;
  tradeOrderId: string;
  deviceId?: string | null;
  sn?: string | null;
  skuId?: string | null;
  appraisedValue: number;
  condition?: string | null;
  note?: string | null;
  inspectionResult?: Record<string, boolean> | null;
  marketRefPrice?: number | null;
  tradeOfferPrice?: number | null;
  photos?: string[];
}

export interface TradeOrderDto {
  id: string;
  storeId: string;
  organizationId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  priceDifference: number;
  paymentMethod?: string | null;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
  TradeInItem?: TradeInItemDto[];
}
