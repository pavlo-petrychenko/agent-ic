import type { HealthStatus } from './health.constants';

export interface HealthReport {
  readonly status: HealthStatus;
}
