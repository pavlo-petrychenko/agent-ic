import { Controller, Get } from '@nestjs/common';
import { HealthRoute } from '@/platform/observability/health/health.constants';
import { HealthService } from '@/platform/observability/health/health.service';
import type { HealthReport } from '@/platform/observability/health/health.typedefs';

@Controller(HealthRoute.Base)
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get(HealthRoute.Live)
  live(): HealthReport {
    return this.health.live();
  }

  @Get(HealthRoute.Ready)
  ready(): HealthReport {
    return this.health.ready();
  }
}
