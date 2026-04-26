/**
 * 与 used-3c-erp-mvp `src/lib/payment-method-labels.ts` 行为一致。
 * 内置名用于未拉取到组织 `OrganizationPaymentChannel` 时的兜底；第三参为服务端下发的 code→label 时优先生效。
 */
export const CASHIER_PAYMENT_METHOD_OPTIONS = [
  { key: 'WECHAT' as const, label: '微信' },
  { key: 'ALIPAY' as const, label: '支付宝' },
  { key: 'CASH' as const, label: '现金' },
  { key: 'BANK_TRANSFER' as const, label: '转账' },
  { key: 'HUAXIA_QR_POS' as const, label: '华夏码/POS' },
  { key: 'CCB_QR_POS' as const, label: '建行码/POS' },
  { key: 'NENGYE_KEJI_CORP' as const, label: '嫩叶科技公户' },
  { key: 'NENGYE_XINXI_CORP' as const, label: '嫩叶信息公户' },
  { key: 'KAJIHUI_CORP' as const, label: '咖机汇公户' },
] as const;

const BUILTIN_LABEL: Record<string, string> = (() => {
  const o: Record<string, string> = { OTHER: '其他' };
  for (const row of CASHIER_PAYMENT_METHOD_OPTIONS) {
    o[row.key] = row.label;
  }
  return o;
})();

export type CashierPaymentSelectOption = { value: string; label: string };

export const CASHIER_PAYMENT_SELECT_OPTIONS: CashierPaymentSelectOption[] =
  CASHIER_PAYMENT_METHOD_OPTIONS.map((o) => ({ value: o.key, label: o.label }));

export const CASHIER_PAYMENT_DROPDOWN_OPTIONS: CashierPaymentSelectOption[] = [
  ...CASHIER_PAYMENT_SELECT_OPTIONS,
  { value: 'OTHER', label: '其他' },
];

/**
 * 收银/出库/预订单中 PaymentItem、depositMethod 的展示名。
 * 传入从 `fetchOrgPaymentLabelMap` / 接口 `methodLabel` 得到的 map 时与 Web、打印一致。
 */
export function getPaymentMethodLabel(
  method: string,
  note?: string | null,
  orgLabelByCode?: Record<string, string> | null,
): string {
  const n = note?.trim() ?? '';
  if (n.startsWith('cashAccount:')) {
    if (orgLabelByCode && orgLabelByCode[method]) return orgLabelByCode[method];
    if (BUILTIN_LABEL[method]) return BUILTIN_LABEL[method];
    return String(method);
  }
  if (orgLabelByCode && orgLabelByCode[method]) return orgLabelByCode[method];
  if (method === 'OTHER') return BUILTIN_LABEL['OTHER'] ?? '其他';
  if (BUILTIN_LABEL[method]) return BUILTIN_LABEL[method];
  return String(method);
}

export function paymentDisplayGroupKey(method: string): string {
  if (method === 'OTHER') return 'OTHER';
  return String(method);
}
