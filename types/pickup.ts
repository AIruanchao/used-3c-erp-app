export type PickupStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

export interface PickupOrder {
  id: string;
  customerName: string;
  customerPhone: string | null;
  pickupAddress: string;
  appointmentTime: string;
  estimatedDevices: number | null;
  estimatedValue: string | number | null;
  actualDevices: number;
  actualValue: string | number;
  status: PickupStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
