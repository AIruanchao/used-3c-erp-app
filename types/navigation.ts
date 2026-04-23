import type { Route } from 'expo-router';

export type RootStackParamList = {
  '(auth)/login': undefined;
  '(tabs)': undefined;
  'device/[id]': { id: string };
  'finance/index': undefined;
  'finance/ledger': undefined;
  'finance/payable': undefined;
  'finance/receivable': undefined;
  'repair/index': undefined;
  'repair/[id]': { id: string };
  'repair/new': undefined;
  'cashier': undefined;
  'customer/index': undefined;
  'customer/[id]': { id: string };
  'stats': undefined;
  'settings': undefined;
  'inbound/received': undefined;
  'stocktake/index': undefined;
  'settlement/index': undefined;
};
