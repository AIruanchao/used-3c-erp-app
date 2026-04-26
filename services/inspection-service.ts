import { api } from '../lib/api';

export async function submitInspection(data: {
  deviceId: string;
  inspectionTool: string;
  overallScore?: number | null;
  overallGrade?: string;
  screenCheck?: Record<string, unknown>;
  batteryCheck?: Record<string, unknown>;
  boardCheck?: Record<string, unknown>;
  cameraCheck?: Record<string, unknown>;
  sensorCheck?: Record<string, unknown>;
  networkCheck?: Record<string, unknown>;
  exteriorCheck?: Record<string, unknown>;
  issues?: string[];
  inspectionData?: Record<string, unknown>;
  checkItems?: Record<string, unknown>;
  photos?: unknown;
}) {
  const res = await api.post<{ success: string; id: string }>('/api/device-inspections', data);
  return res.data;
}
