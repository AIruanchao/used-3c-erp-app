export interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  source: string | null;
  memberLevel: string | null;
  tier: string | null;
  memberPoints: number;
  balance: string;
  creditUsed: string;
  creditLimit: string | null;
  creditAvailable: string | null;
  lifetimeValue: string;
  profitScore: string | null;
  loyaltyScore: string | null;
  compositeScore: string | null;
  createdAt: string;
}

export interface CustomerInteraction {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface MemberCard {
  id: string;
  cardNo: string;
  price: string;
  createdAt: string;
}

export interface CustomerPointRecord {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface CustomerBalanceRecord {
  id: string;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface ServiceVoucher {
  id: string;
  service: { id: string; name: string; type: string } | null;
  issuedAt: string;
  redeemedAt: string | null;
}

export interface CustomerOpportunity {
  id: string;
  expectedAmount: string;
  actualAmount: string | null;
  status: string;
  updatedAt: string;
}

export interface CustomerDetailResponse {
  Customer: CustomerDetail;
  interactions: CustomerInteraction[];
  memberCards: MemberCard[];
  pointRecords: CustomerPointRecord[];
  balanceRecords: CustomerBalanceRecord[];
  serviceVouchers: ServiceVoucher[];
  opportunities: CustomerOpportunity[];
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string | null;
  tier?: string | null;
  memberLevel?: string | null;
  memberPoints?: number;
  balance?: string | number;
  lifetimeValue?: string | number;
  lastInteractionAt?: string | null;
  createdAt: string;
}
