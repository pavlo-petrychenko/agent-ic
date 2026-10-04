import type { UptimeUnit } from '@/features/status/logic/uptime.constants';

export interface UptimeUnitValue {
  readonly unit: UptimeUnit;
  readonly count: number;
}
