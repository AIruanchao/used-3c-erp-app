/** 单笔支付明细（组合付款时多行） */
export interface OutboundPaymentItem {
  method: string;
  amount: string | number;
  label: string;
  note?: string | null;
}

/** 同方式/同说明合并后一行 */
export interface OutboundPaymentBreakdownLine {
  method: string;
  label: string;
  amount: string | number;
}

/** 出库列表项（与 GET /api/outbound 对齐；金额字段可能为 string 或 number） */
export interface OutboundItem {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceCount: number;
  totalAmount: string | number;
  totalPaid?: string | number;
  /** 订单总额 - 明细分项合计后的差额（账期/尾款，≥0） */
  receivableAmount?: string | number;
  channel: string | null;
  createdAt: string;
  /** 人类可读：微信 ¥2,500.00、支付宝 ¥500.00… */
  paymentSummary?: string | null;
  /** 与收银 PaymentItem 一一对应 */
  paymentItems?: OutboundPaymentItem[];
  /** 同方式/同 OTHER 说明合并后 */
  paymentBreakdown?: OutboundPaymentBreakdownLine[];

  /** 出库行级设备明细（用于列表卡片增强展示） */
  lines?: Array<{
    sn: string;
    unitCost: number;
    salePrice: number;
    lineType: string;
    skuName: string;
    condition: string;
  }>;
}

/** 与 GET /api/outbound/print/[orderId] 对齐的打印单结构 */
export interface OutboundDetail {
  orderId?: string;
  company?: string;
  title?: string;
  orderNo: string;
  date: string;
  storeName?: string;
  customer: string;
  phone: string;
  channel: string;
  discountRate?: number | null;
  writeOffAmount?: string | number | null;
  discountNote?: string | null;
  lines: Array<{
    index: number;
    sn: string;
    salePrice: string | number;
    lineType: string;
  }>;
  giftLines?: Array<{ name: string; qty: number }>;
  rawTotal: string | number;
  finalTotal: string | number;
  totalPaid: string | number;
  remainAmount: string | number;
  /** 与组织收款通道表一致的展示名；后端 GET /api/outbound/print 已带 */
  payments: Array<{
    method: string;
    amount: string | number;
    note?: string | null;
    methodLabel?: string;
  }>;
}
