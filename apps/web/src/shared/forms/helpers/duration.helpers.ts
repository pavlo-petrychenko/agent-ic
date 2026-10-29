import { DURATION_UNIT_ORDER, MINUTES_PER_UNIT } from '@/shared/forms/constants/duration.constants';
import type { DurationUnit } from '@/shared/forms/constants/duration.constants';
import type { DurationParts } from '@/shared/forms/typedefs/duration.typedefs';

const unitSize = (unit: DurationUnit, base: DurationUnit): number =>
  MINUTES_PER_UNIT[unit] / MINUTES_PER_UNIT[base];

export const unitsFrom = (base: DurationUnit): readonly DurationUnit[] =>
  DURATION_UNIT_ORDER.filter((unit) => unitSize(unit, base) >= 1);

export const toBaseUnits = (amount: number, unit: DurationUnit, base: DurationUnit): number =>
  amount * unitSize(unit, base);

export const fitsUnit = (value: number, unit: DurationUnit, base: DurationUnit): boolean =>
  value % unitSize(unit, base) === 0;

export const largestFittingUnit = (
  value: number,
  base: DurationUnit,
  units: readonly DurationUnit[],
): DurationUnit =>
  [...units].reverse().find((unit) => value > 0 && fitsUnit(value, unit, base)) ?? base;

export const durationParts = (
  value: number,
  base: DurationUnit,
  preferred: DurationUnit | null,
  units: readonly DurationUnit[],
): DurationParts => {
  const unit =
    preferred !== null && units.includes(preferred) && fitsUnit(value, preferred, base)
      ? preferred
      : largestFittingUnit(value, base, units);
  return { amount: value / unitSize(unit, base), unit };
};
