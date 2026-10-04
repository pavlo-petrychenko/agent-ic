import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { BeforeApplicationShutdown } from '@nestjs/common';
import { HealthStatus } from '@/platform/observability/health/health.constants';
import type { HealthReport } from '@/platform/observability/health/health.typedefs';

@Injectable()
export class HealthService implements BeforeApplicationShutdown {
  private shuttingDown = false;

  live(): HealthReport {
    return { status: HealthStatus.Ok };
  }

  ready(): HealthReport {
    if (this.shuttingDown) {
      const report: HealthReport = { status: HealthStatus.ShuttingDown };
      throw new ServiceUnavailableException(report);
    }
    return { status: HealthStatus.Ok };
  }

  beforeApplicationShutdown(): void {
    this.shuttingDown = true;
  }
}
