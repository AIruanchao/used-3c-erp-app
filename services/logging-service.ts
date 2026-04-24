import { AppState, type AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { RingLogBuffer, type LogLevel, type LogRecord } from '../lib/log-buffer';

type DrainConfig = {
  enabled: boolean;
  endpoint: string | null;
  intervalMs: number;
  maxBatch: number;
  appStateFlush: boolean;
};

const buffer = new RingLogBuffer(500);

let started = false;
let shipping = false;
let appState = AppState.currentState;

function getEnvString(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function parseBoolOrDefault(v: string | undefined, defaultValue: boolean): boolean {
  if (!v) return defaultValue;
  const s = v.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return defaultValue;
}

function getDrainConfig(): DrainConfig {
  const endpoint = getEnvString('EXPO_PUBLIC_LOG_DRAIN_URL') ?? null;
  // Default: enable in __DEV__ when endpoint is set; in prod off unless EXPO_PUBLIC_LOG_DRAIN_ENABLE=true
  const defaultEnabled = Boolean(endpoint) && Boolean(__DEV__);
  const enabled = parseBoolOrDefault(
    getEnvString('EXPO_PUBLIC_LOG_DRAIN_ENABLE'),
    defaultEnabled,
  );
  return {
    enabled,
    endpoint,
    intervalMs: Math.max(1000, Number(getEnvString('EXPO_PUBLIC_LOG_DRAIN_INTERVAL_MS') ?? '5000') || 5000),
    maxBatch: Math.max(10, Math.min(200, Number(getEnvString('EXPO_PUBLIC_LOG_DRAIN_MAX_BATCH') ?? '50') || 50)),
    appStateFlush: parseBoolOrDefault(getEnvString('EXPO_PUBLIC_LOG_DRAIN_FLUSH_ON_APPSTATE'), true),
  };
}

function safeStringify(value: unknown): string {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function nowTag(): string {
  return new Date().toISOString();
}

function push(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  // Keep message bounded to avoid runaway memory on huge objects
  const m = message.length > 12_000 ? `${message.slice(0, 12_000)}…(truncated)` : message;
  buffer.push(level, m, extra);
}

function origConsole() {
  const g = global as unknown as { __used3cErpOrigConsole?: unknown };
  if (!g.__used3cErpOrigConsole) {
    g.__used3cErpOrigConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
    };
  }
  return g.__used3cErpOrigConsole as {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.log;
  };
}

function installConsoleIntercepts() {
  const o = origConsole();

  console.log = (...args: unknown[]) => {
    push('info', args.map(safeStringify).join(' '));
    o.log(...args);
  };
  console.info = (...args: unknown[]) => {
    push('info', args.map(safeStringify).join(' '));
    o.info(...args);
  };
  console.warn = (...args: unknown[]) => {
    push('warn', args.map(safeStringify).join(' '));
    o.warn(...args);
  };
  console.error = (...args: unknown[]) => {
    push('error', args.map(safeStringify).join(' '));
    o.error(...args);
  };
  if (console.debug) {
    console.debug = (...args: unknown[]) => {
      push('debug', args.map(safeStringify).join(' '));
      o.debug(...args);
    };
  }
}


/**
 * NOTE: We intentionally do not touch `ErrorUtils` here.
 * `app/_layout.tsx` installs monitoring handlers; re-ordering global handlers is fragile.
 * Console logs + network/API logs are the primary on-device signal for local drain.
 */

function buildPayload(batch: LogRecord[]) {
  const cfg = getDrainConfig();
  return {
    v: 1,
    sentAt: Date.now(),
    app: {
      name: Constants.expoConfig?.name,
      slug: Constants.expoConfig?.slug,
      version: Constants.expoConfig?.version,
      build: (Constants.expoConfig as { android?: { versionCode?: number } } | null | undefined)
        ?.android?.versionCode,
      updateId: (Constants as unknown as { manifest?: { id?: string } })?.manifest?.id,
    },
    env: {
      dev: __DEV__,
      apiBase: process.env['EXPO_PUBLIC_API_BASE'],
    },
    enabled: cfg.enabled,
    endpoint: cfg.endpoint,
    logs: batch,
  };
}

async function postBatch(batch: LogRecord[], endpoint: string) {
  if (shipping) return;
  shipping = true;
  const url = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  const body = buildPayload(batch);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      origConsole().warn(
        `[log-drain] ship failed: ${res.status} ${res.statusText} @ ${nowTag()}`,
      );
    }
  } catch (e) {
    // Never throw; this must never crash the app
    origConsole().warn(`[log-drain] ship error @ ${nowTag()}:`, e);
  } finally {
    shipping = false;
  }
}

let interval: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;

export function startAppLogging() {
  if (started) return;
  started = true;

  installConsoleIntercepts();

  const cfg0 = getDrainConfig();
  origConsole().log(
    `[log-drain] started enabled=${String(cfg0.enabled)} endpoint=${cfg0.endpoint ?? '(none)'} @ ${nowTag()}`,
  );

  const tick = () => {
    const cfg = getDrainConfig();
    if (!cfg.enabled || !cfg.endpoint) return;

    const snap = buffer.snapshotChronological();
    if (snap.length === 0) return;
    const batch = snap.slice(-cfg.maxBatch);
    void postBatch(batch, cfg.endpoint);
  };

  // periodic shipping
  const cfg = getDrainConfig();
  interval = setInterval(tick, cfg.intervalMs);

  if (getDrainConfig().appStateFlush) {
    appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState;
      appState = next;
      if (prev.match(/active/) && next.match(/inactive|background/)) {
        tick();
      }
    });
  }

  const g = global as unknown as {
    __used3cErpLogBuffer?: { snapshot: () => LogRecord[]; shipNow: () => void };
  };
  g.__used3cErpLogBuffer = {
    snapshot: () => buffer.snapshotChronological(),
    shipNow: tick,
  };
}

export function stopAppLogging() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  appStateSub?.remove();
  appStateSub = null;
}
