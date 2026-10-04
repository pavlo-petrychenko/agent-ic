import type { UptimeUnit } from '@/features/status/constants/uptime.constants';

export interface UptimeUnitValue {
  readonly unit: UptimeUnit;
  readonly count: number;
}
