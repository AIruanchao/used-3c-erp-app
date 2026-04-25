import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * 崩溃日志收集器 v2 — 自动回传版
 *
 * 核心流程：
 * 1. installCrashLogger() 在启动最早期安装全局错误捕获
 * 2. JS异常/Promise rejection → 自动写入AsyncStorage
 * 3. 下次启动时 autoUploadCrashLogs() 检测未上传的日志 → POST到服务器
 * 4. 即使App立即闪退，下次启动（哪怕再闪退前几毫秒）也会尝试上传
 */

const STORAGE_KEY = '@nenie-erp/crash_logs';
const UPLOADED_KEY = '@nenie-erp/crash_uploaded_ids';
const MAX_LOGS = 100;

// 回传地址 — 用ERP后端的crash-report端点
const CRASH_REPORT_URL = 'https://erp.nenie.vip/api/app-crash-report';

export interface CrashLog {
  id: string;
  timestamp: number;
  type: 'js_error' | 'promise_rejection' | 'startup' | 'custom';
  message: string;
  stack?: string;
  isFatal: boolean;
  deviceId?: string;
}

let isInstalled = false;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 记录一条崩溃日志（同步写AsyncStorage，不await） */
export async function recordCrashLog(log: Omit<CrashLog, 'id' | 'timestamp'>): Promise<void> {
  const entry: CrashLog = {
    id: uid(),
    timestamp: Date.now(),
    ...log,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const logs: CrashLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    // 忽略
  }
}

/** 同步版本 — 用void不阻塞，确保即使马上崩溃也能写入 */
export function recordCrashLogSync(log: Omit<CrashLog, 'id' | 'timestamp'>): void {
  void recordCrashLog(log);
}

/** 读取所有崩溃日志 */
export async function getCrashLogs(): Promise<CrashLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** 清除所有崩溃日志 */
export async function clearCrashLogs(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, UPLOADED_KEY]);
}

/** 导出崩溃日志为文本 */
export async function exportCrashLogs(): Promise<string> {
  const logs = await getCrashLogs();
  if (logs.length === 0) return '暂无崩溃日志';

  const lines = logs.map((log) => {
    const time = new Date(log.timestamp).toLocaleString('zh-CN');
    const fatal = log.isFatal ? '💀 FATAL' : '⚠️';
    let line = `[${time}] ${fatal} (${log.type})\n  ${log.message}`;
    if (log.stack) {
      const stackLines = log.stack.split('\n').slice(0, 5).join('\n  ');
      line += `\n  Stack:\n  ${stackLines}`;
    }
    return line;
  });

  return `=== 咖机汇SVIP 崩溃日志 ===\nPlatform: ${Platform.OS} ${Platform.Version}\nLogs: ${logs.length}条\nGenerated: ${new Date().toLocaleString('zh-CN')}\n\n${lines.join('\n\n')}`;
}

/** 检查上次是否有崩溃（24小时内的fatal） */
export async function checkLastCrash(): Promise<CrashLog | null> {
  const logs = await getCrashLogs();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return logs.find(l => l.isFatal && l.timestamp > oneDayAgo) ?? null;
}

/**
 * 🚀 自动回传崩溃日志到服务器
 * 
 * 在 _layout.tsx 的 storageReady 后立即调用
 * 使用 fetch 而非 axios（避免依赖api.ts的拦截器导致循环）
 * 即使服务器不可达也不影响启动
 */
export async function autoUploadCrashLogs(): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;

  try {
    const logs = await getCrashLogs();
    if (logs.length === 0) return { uploaded: 0, failed: 0 };

    // 获取已上传的ID列表
    const rawUploaded = await AsyncStorage.getItem(UPLOADED_KEY);
    const uploadedIds: string[] = rawUploaded ? JSON.parse(rawUploaded) : [];

    // 筛出未上传的
    const pending = logs.filter(l => !uploadedIds.includes(l.id));
    if (pending.length === 0) return { uploaded: 0, failed: 0 };

    // 批量上传（一次HTTP请求）
    const payload = {
      app: 'used-3c-erp-app',
      platform: Platform.OS,
      platformVersion: String(Platform.Version),
      logs: pending,
    };

    const response = await fetch(CRASH_REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // 标记已上传
      const newUploadedIds = [...uploadedIds, ...pending.map(l => l.id)];
      await AsyncStorage.setItem(UPLOADED_KEY, JSON.stringify(newUploadedIds.slice(-MAX_LOGS)));
      uploaded = pending.length;
    } else {
      failed = pending.length;
    }
  } catch (e) {
    // 网络不可达、服务器宕机等 — 不影响App启动
    failed = -1;
  }

  return { uploaded, failed };
}

/**
 * 安装全局错误捕获器 — 必须在App启动最早期调用
 */
export function installCrashLogger(): void {
  if (isInstalled) return;
  isInstalled = true;

  // 1. 捕获全局 JS 异常
  const originalHandler = ErrorUtils?.getGlobalHandler?.();
  ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    // 同步记录，不await — 确保即使马上崩溃也尝试写入
    recordCrashLogSync({
      type: 'js_error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      isFatal: isFatal ?? false,
    });

    if (originalHandler) originalHandler(error, isFatal ?? false);
  });

  // 2. 标记本次启动 — 如果启动后没有新的crash说明上次已恢复
  // （用于区分"上次闪退"和"本次正常"）
}
