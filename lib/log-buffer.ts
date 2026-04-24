export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogRecord = {
  id: string;
  ts: number;
  level: LogLevel;
  message: string;
  extra?: Record<string, unknown>;
};

function genId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export class RingLogBuffer {
  private buf: LogRecord[] = [];
  private cursor = 0;
  private filled = false;

  constructor(private capacity: number) {
    this.buf = new Array<LogRecord>(capacity);
  }

  push(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    const rec: LogRecord = {
      id: genId(),
      ts: Date.now(),
      level,
      message,
      extra,
    };
    this.buf[this.cursor] = rec;
    this.cursor = (this.cursor + 1) % this.capacity;
    if (this.cursor === 0) this.filled = true;
  }

  /**
   * Drain the oldest->newest items currently in the buffer, without mutating the ring.
   * For simplicity: returns a snapshot of up to `capacity` most recent in chronological order.
   */
  snapshotChronological(): LogRecord[] {
    if (!this.filled) {
      return this.buf.slice(0, this.cursor);
    }
    // cursor points to next write position; oldest is at cursor
    return [...this.buf.slice(this.cursor), ...this.buf.slice(0, this.cursor)];
  }
}
