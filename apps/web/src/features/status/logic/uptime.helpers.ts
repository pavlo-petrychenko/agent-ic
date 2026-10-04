import { UPTIME_MAX_UNITS, UPTIME_UNITS_DESCENDING, UptimeUnit } from './uptime.constants';
import type { UptimeUnitValue } from './uptime.typedefs';

export function toUptimeUnits(totalSeconds: number): readonly UptimeUnitValue[] {
  let remaining = Math.max(0, Math.floor(totalSeconds));
  const units: UptimeUnitValue[] = [];
  for (const { unit, seconds } of UPTIME_UNITS_DESCENDING) {
    const count = Math.floor(remaining / seconds);
    remaining -= count * seconds;
    if (count > 0) {
      units.push({ unit, count });
    }
  }
  if (units.length === 0) {
    return [{ unit: UptimeUnit.Second, count: 0 }];
  }
  return units.slice(0, UPTIME_MAX_UNITS);
}
