import type { HealthStatus } from '@/platform/observability/constants/health.constants';

export interface HealthReport {
  readonly status: HealthStatus;
}
