import { describe, expect, it } from 'vitest';
import { InactivityRepeatKind, InactivityUnit } from '@flow/nodes/constants/trigger.constants';
import {
  durationMinutes,
  fireOffsetsMinutes,
  silenceMinutes,
} from '@flow/nodes/helpers/inactivity.helpers';
import { inactivityTrigger } from '@test/support/fixtures/flow-builder.fixture';

describe('durationMinutes', () => {
  it('converts minutes, hours and days to minutes', () => {
    expect(durationMinutes({ amount: 7, unit: InactivityUnit.Minutes })).toBe(7);
    expect(durationMinutes({ amount: 2, unit: InactivityUnit.Hours })).toBe(120);
    expect(durationMinutes({ amount: 3, unit: InactivityUnit.Days })).toBe(4320);
  });
});

describe('silenceMinutes', () => {
  it('gives the silence of the trigger in minutes', () => {
    expect(silenceMinutes(inactivityTrigger('quiet'))).toBe(120);
  });
});

describe('fireOffsetsMinutes', () => {
  it('fires once at the silence', () => {
    expect(fireOffsetsMinutes(inactivityTrigger('quiet'))).toEqual([120]);
  });

  it('adds one step per repeat up to the maximum', () => {
    const trigger = inactivityTrigger('quiet', {
      kind: InactivityRepeatKind.Every,
      every: { amount: 1, unit: InactivityUnit.Days },
      maxTimes: 3,
    });
    expect(fireOffsetsMinutes(trigger)).toEqual([120, 1560, 3000]);
  });
});
