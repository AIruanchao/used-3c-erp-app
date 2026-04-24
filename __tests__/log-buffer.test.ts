import { RingLogBuffer } from '../lib/log-buffer';

describe('RingLogBuffer', () => {
  it('keeps chronological order when wrapped', () => {
    const b = new RingLogBuffer(3);
    b.push('info', 'a');
    b.push('info', 'b');
    b.push('info', 'c');
    b.push('info', 'd');
    const snap = b.snapshotChronological();
    expect(snap.map((r) => r.message)).toEqual(['b', 'c', 'd']);
  });
});
