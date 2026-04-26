export interface HandoverItem {
  id: string;
  fromUserId: string;
  toUserId: string;
  handoverAt: string;
  pendingOrders: { count: number } | null;
  pendingPickups: { count: number } | null;
  pendingShipments: { count: number } | null;
  cashHandover: number | null;
  keyHandover: boolean;
  safeHandover: boolean;
  specialNotes: string | null;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
}

export interface StoreTeamMember {
  storeMemberId: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
}
