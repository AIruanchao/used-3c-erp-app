export interface PendingReturns {
  pendingRepairs: number;
  pendingPickupRepairs: number;
}

export interface HandoverItem {
  id: string;
  storeId: string;
  organizationId: string;
  fromUserId: string;
  toUserId: string;
  handoverAt: string;
  pendingOrders: { count: number } | null;
  pendingPickups: { count: number } | null;
  pendingShipments: { count: number } | null;
  pendingReturns: PendingReturns | null;
  cashHandover: number | null;
  keyHandover: boolean;
  safeHandover: boolean;
  specialNotes: string | null;
  fromConfirmed: boolean;
  toConfirmed: boolean;
  /** 后端为 string，如 PENDING */
  status: string;
}

export interface StoreTeamMember {
  storeMemberId: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
}
