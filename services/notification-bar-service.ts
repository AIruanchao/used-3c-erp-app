import { api } from '../lib/api';

export interface AuditLogRow {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: string | null;
  createdAt: string;
}

/** 任务卡：仅 organizationId 查询，不含 storeId */
export async function getAuditLogs(params: {
  organizationId: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const res = await api.get<{ items: AuditLogRow[]; total: number }>('/api/audit-logs', { params });
  return res.data;
}

export interface AlertLogRow {
  id: string;
  organizationId: string;
  alertType: string;
  severity: string;
  message: string;
  triggeredAt: string;
  isRead: boolean;
}

export async function getAlertLogs(params: {
  organizationId: string;
  isRead?: boolean;
  severity?: string;
}) {
  const res = await api.get<{ items: AlertLogRow[] }>('/api/alert-logs', { params });
  return res.data;
}

export async function markAlertsRead(params: { organizationId: string; ids: string[] }) {
  const res = await api.patch<{ ok: boolean }>('/api/alert-logs', params);
  return res.data;
}

export interface CustomerNotificationRow {
  id: string;
  title: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export async function getCustomerNotifications(params: { organizationId: string; limit?: number }) {
  const res = await api.get<{ items: CustomerNotificationRow[] }>('/api/customer-notifications', { params });
  return res.data;
}
