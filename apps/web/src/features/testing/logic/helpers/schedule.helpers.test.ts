import { describe, expect, it } from 'vitest';
import {
  scheduleNameOf,
  scheduleTriggers,
} from '@/features/testing/logic/helpers/schedule.helpers';
import type { ScheduleTrigger } from '@/features/testing/typedefs/schedule.typedefs';

const nightly: ScheduleTrigger = {
  id: 'node_nightly',
  name: 'Nightly',
  silentForHours: 24,
  notEscalated: true,
};
const weekly: ScheduleTrigger = { ...nightly, id: 'node_weekly', name: 'Weekly' };

describe('scheduleTriggers', () => {
  it('has no schedule triggers without a flow', () => {
    expect(scheduleTriggers(null)).toEqual([]);
  });
});

describe('scheduleNameOf', () => {
  it('names a scheduled turn by the trigger it was run from', () => {
    expect(
      scheduleNameOf([nightly, weekly], [{ runId: 'r1', nodeId: weekly.id, checks: [] }], 'r1'),
    ).toBe('Weekly');
  });

  it('falls back to the only schedule of the flow, else to no name', () => {
    expect(scheduleNameOf([nightly], [], 'r1')).toBe('Nightly');
    expect(scheduleNameOf([nightly, weekly], [], 'r1')).toBeNull();
  });
});
