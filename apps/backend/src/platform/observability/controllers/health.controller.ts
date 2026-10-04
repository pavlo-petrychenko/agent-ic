import { Controller, Get } from '@nestjs/common';
import { HealthRoute } from '@/platform/observability/constants/health.constants';
import { HealthService } from '@/platform/observability/services/health.service';
import type { HealthReport } from '@/platform/observability/typedefs/health.typedefs';

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
