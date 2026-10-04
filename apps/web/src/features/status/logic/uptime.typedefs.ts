import type { UptimeUnit } from './uptime.constants';

export interface UptimeUnitValue {
  readonly unit: UptimeUnit;
  readonly count: number;
}
