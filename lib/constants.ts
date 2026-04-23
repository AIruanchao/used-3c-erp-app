/** Condition options (18-level industry standard) */
export const CONDITION_OPTIONS = [
  { value: '99新', group: '高成色' },
  { value: '98新', group: '高成色' },
  { value: '97新', group: '高成色' },
  { value: '96新', group: '高成色' },
  { value: '95新', group: '高成色' },
  { value: '9成新', group: '良好' },
  { value: '8成新', group: '良好' },
  { value: '充新', group: '良好' },
  { value: '靓机', group: '良好' },
  { value: '小花靓', group: '瑕疵' },
  { value: '小花', group: '瑕疵' },
  { value: '大花', group: '瑕疵' },
  { value: '外爆', group: '破损' },
  { value: '内爆', group: '破损' },
  { value: '内外爆', group: '破损' },
  { value: '后盖爆', group: '破损' },
  { value: '7新', group: '低成色' },
  { value: '7新以下', group: '低成色' },
] as const;

/** Channel (version) options */
export const CHANNEL_OPTIONS = [
  '国行',
  '国行展示机',
  '资源机',
  '国行官修机',
  '美版有锁',
  '美版无锁',
  '港版',
  '日版无锁',
  '韩版无锁',
  '非国行有锁',
  '其他',
] as const;

/** Settlement methods */
export const SETTLEMENT_METHODS = [
  { value: 'CASH', label: '现金' },
  { value: 'WECHAT', label: '微信' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'BANK_TRANSFER', label: '银行转账' },
  { value: 'OTHER', label: '其他' },
] as const;

/** Source channels */
export const SOURCE_CHANNELS = [
  '零散供应商',
  '批量采购',
  '以旧换新',
  '平台回收',
  '其他',
] as const;

/** Aging alert thresholds (days) */
export const AGING_ALERT_DAYS: Record<string, number> = {
  '手机': 30,
  '平板电脑': 45,
  '笔记本电脑': 60,
  default: 60,
};

/** Disposition options */
export const DISPOSITION_OPTIONS = [
  { value: 'PENDING_CHECK', label: '待检测' },
  { value: 'RETAIL_READY', label: '可零售' },
  { value: 'PEER_SALE', label: '出同行' },
  { value: 'NEEDS_REFURBISH', label: '需整备' },
] as const;

/** Max photos */
export const MAX_PHOTOS = 13;

/** Company name */
export const COMPANY_NAME = '安徽嫩叶科技有限公司';

/** Inventory status labels */
export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: '在库',
  SOLD: '已售',
  RETURNED_OUT: '已退供货商',
};

/** Payment status labels */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: '未付款',
  PARTIAL: '部分付款',
  PAID: '已付款',
  OVERPAID: '多付',
};

/** Repair status labels - matching backend Prisma enum */
export const REPAIR_STATUS_LABELS: Record<string, string> = {
  REGISTERED: '已登记',
  DIAGNOSED: '已检测',
  QUOTED: '已报价',
  ACCEPTED: '已接受报价',
  REJECTED: '已拒绝报价',
  IN_REPAIR: '维修中',
  COMPLETED: '维修完成',
  WAITING_PICKUP: '待取件',
  DELIVERING: '配送中',
  CLOSED: '已关闭',
  CANCELLED: '已取消',
};

/** Ledger type labels */
export const LEDGER_TYPE_LABELS: Record<string, string> = {
  PURCHASE_COST: '采购成本',
  OTHER_COST: '其他成本',
  SALE_INCOME: '销售收入',
  REPAIR_INCOME: '维修收入',
  REFUND: '退款',
  EXPENSE: '费用支出',
  TRANSFER: '转账',
  OTHER: '其他',
};

/** Payment methods for payment */
export const PAYMENT_METHODS = [
  { value: 'WECHAT', label: '微信支付' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'CASH', label: '现金' },
  { value: 'BANK_TRANSFER', label: '银行转账' },
  { value: 'OTHER', label: '其他' },
] as const;

/** Page size for pagination */
export const PAGE_SIZE = 20;
