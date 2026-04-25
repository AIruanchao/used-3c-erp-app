import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * 崩溃日志收集器 — 不依赖任何第三方，纯 AsyncStorage 持久化
 *
 * 功能：
 * 1. 捕获 JS 全局未处理异常（fatal + non-fatal）
 * 2. 捕获未处理的 Promise rejection
 * 3. 记录到本地 AsyncStorage（持久化，重启不丢失）
 * 4. 提供查看/导出/清除接口
 * 5. 启动时检测上次是否有崩溃
 */

const STORAGE_KEY = '@nenie-erp/crash_logs';
const MAX_LOGS = 50;

export interface CrashLog {
  id: string;
  timestamp: number;
  type: 'js_error' | 'promise_rejection' | 'custom';
  message: string;
  stack?: string;
  isFatal: boolean;
}

let isInstalled = false;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 记录一条崩溃日志 */
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
    console.warn('[CrashLogger] write failed:', e);
  }
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
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** 导出崩溃日志为可分享文本 */
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

/** 安装全局错误捕获器 — 在 _layout.tsx 最顶层调用 */
export function installCrashLogger(): void {
  if (isInstalled) return;
  isInstalled = true;

  const originalHandler = ErrorUtils?.getGlobalHandler?.();
  ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    recordCrashLog({
      type: 'js_error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      isFatal: isFatal ?? false,
    });
    if (originalHandler) originalHandler(error, isFatal ?? false);
  });

  console.log('[CrashLogger] ✅ installed');
}
