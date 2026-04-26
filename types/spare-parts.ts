export interface SparePart {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  unit: string;
  stockQty: number;
  warningQty: number;
  avgCost: string | number;
  lastPurchaseCost: string | number | null;
  shelfLocation: string | null;
}
