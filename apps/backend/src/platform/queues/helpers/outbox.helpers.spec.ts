import { describe, expect, it } from 'vitest';
import { outboxJobOptions, remainingDelayMs } from '@/platform/queues/helpers/outbox.helpers';

const NOW = new Date('2026-11-08T12:00:00.000Z');

describe('remainingDelayMs', () => {
  it('returns the time left after the outbox grace period', () => {
    expect(remainingDelayMs(new Date(NOW.getTime() - 60_000), 300_000, NOW)).toBe(240_000);
  });

  it('never returns a negative delay', () => {
    expect(remainingDelayMs(new Date(NOW.getTime() - 300_000), 60_000, NOW)).toBe(0);
  });
});

describe('outboxJobOptions', () => {
  it('adds the remaining delay when one is present', () => {
    expect(outboxJobOptions('message-1', 240_000)).toEqual({
      jobId: 'message-1',
      delay: 240_000,
    });
  });

  it('leaves the delay out when there is none', () => {
    expect(outboxJobOptions('message-1')).toEqual({ jobId: 'message-1' });
  });
});
