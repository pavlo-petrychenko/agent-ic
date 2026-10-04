import type { HealthStatus } from '@/platform/observability/health/health.constants';

export interface HealthReport {
  readonly status: HealthStatus;
}
