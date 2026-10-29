import { describe, expect, it } from 'vitest';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';
import {
  durationParts,
  largestFittingUnit,
  toBaseUnits,
  unitsFrom,
} from '@/shared/forms/helpers/duration.helpers';

describe('unitsFrom', () => {
  it('offers the base unit and the larger ones only', () => {
    expect(unitsFrom(DurationUnit.Minute)).toEqual([
      DurationUnit.Minute,
      DurationUnit.Hour,
      DurationUnit.Day,
    ]);
    expect(unitsFrom(DurationUnit.Hour)).toEqual([DurationUnit.Hour, DurationUnit.Day]);
  });
});

describe('toBaseUnits', () => {
  it('converts an amount in a larger unit to the base unit', () => {
    expect(toBaseUnits(2, DurationUnit.Hour, DurationUnit.Minute)).toBe(120);
    expect(toBaseUnits(3, DurationUnit.Day, DurationUnit.Hour)).toBe(72);
    expect(toBaseUnits(5, DurationUnit.Hour, DurationUnit.Hour)).toBe(5);
  });
});

describe('largestFittingUnit', () => {
  it('picks the largest unit that divides the value', () => {
    const units = unitsFrom(DurationUnit.Minute);

    expect(largestFittingUnit(120, DurationUnit.Minute, units)).toBe(DurationUnit.Hour);
    expect(largestFittingUnit(2880, DurationUnit.Minute, units)).toBe(DurationUnit.Day);
    expect(largestFittingUnit(90, DurationUnit.Minute, units)).toBe(DurationUnit.Minute);
  });
});

describe('durationParts', () => {
  const units = unitsFrom(DurationUnit.Hour);

  it('keeps the preferred unit while it divides the value', () => {
    expect(durationParts(24, DurationUnit.Hour, DurationUnit.Hour, units)).toEqual({
      amount: 24,
      unit: DurationUnit.Hour,
    });
    expect(durationParts(48, DurationUnit.Hour, DurationUnit.Day, units)).toEqual({
      amount: 2,
      unit: DurationUnit.Day,
    });
  });

  it('starts from the largest fitting unit when nothing is preferred', () => {
    expect(durationParts(48, DurationUnit.Hour, null, units)).toEqual({
      amount: 2,
      unit: DurationUnit.Day,
    });
  });

  it('falls back to a unit that divides the value', () => {
    expect(durationParts(30, DurationUnit.Hour, DurationUnit.Day, units)).toEqual({
      amount: 30,
      unit: DurationUnit.Hour,
    });
  });
});
