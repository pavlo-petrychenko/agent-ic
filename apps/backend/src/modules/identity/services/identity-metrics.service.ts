import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  IdentityMetricHelp,
  IdentityMetricLabel,
  IdentityMetricName,
} from '@/modules/identity/constants/identity-metrics.constants';
import type { LoginOutcome } from '@/modules/identity/constants/identity-metrics.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class IdentityMetricsService {
  private readonly logins: Counter<IdentityMetricLabel>;

  constructor(metrics: MetricsService) {
    this.logins = new Counter({
      name: IdentityMetricName.Logins,
      help: IdentityMetricHelp.Logins,
      labelNames: [IdentityMetricLabel.Outcome],
      registers: [metrics.registry],
    });
  }

  loginAttempted(outcome: LoginOutcome): void {
    this.logins.inc({ [IdentityMetricLabel.Outcome]: outcome });
  }
}
