import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HealthStatus } from '@/platform/observability/health/health.constants';
import { HealthService } from '@/platform/observability/health/health.service';

describe('HealthService', () => {
  it('reports live and ready while the application runs', () => {
    const health = new HealthService();

    expect(health.live()).toEqual({ status: HealthStatus.Ok });
    expect(health.ready()).toEqual({ status: HealthStatus.Ok });
  });

  it('stops reporting ready once shutdown begins', () => {
    const health = new HealthService();

    health.beforeApplicationShutdown();

    expect(() => health.ready()).toThrow(ServiceUnavailableException);
  });

  it('keeps reporting live while shutting down', () => {
    const health = new HealthService();

    health.beforeApplicationShutdown();

    expect(health.live()).toEqual({ status: HealthStatus.Ok });
  });
});
