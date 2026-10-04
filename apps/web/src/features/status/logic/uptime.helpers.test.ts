import { describe, expect, it } from 'vitest';

import { UptimeUnit } from './uptime.constants';
import { toUptimeUnits } from './uptime.helpers';

describe('toUptimeUnits', () => {
  it('keeps the two largest non-zero units', () => {
    expect(toUptimeUnits(93_784)).toEqual([
      { unit: UptimeUnit.Day, count: 1 },
      { unit: UptimeUnit.Hour, count: 2 },
    ]);
  });

  it('skips units that are zero', () => {
    expect(toUptimeUnits(3_605)).toEqual([
      { unit: UptimeUnit.Hour, count: 1 },
      { unit: UptimeUnit.Second, count: 5 },
    ]);
  });

  it('reports zero seconds for a fresh start', () => {
    expect(toUptimeUnits(0)).toEqual([{ unit: UptimeUnit.Second, count: 0 }]);
  });

  it('treats negative and fractional input as whole seconds, never below zero', () => {
    expect(toUptimeUnits(-5)).toEqual([{ unit: UptimeUnit.Second, count: 0 }]);
    expect(toUptimeUnits(59.9)).toEqual([{ unit: UptimeUnit.Second, count: 59 }]);
  });
});
