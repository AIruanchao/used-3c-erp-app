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
