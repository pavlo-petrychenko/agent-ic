import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@/platform/config/services/config.service';
import { defineModule, inEveryRole } from '@/platform/module-roles/helpers/module-roles.helpers';
import { HealthController } from '@/platform/observability/controllers/health.controller';
import { MetricsController } from '@/platform/observability/controllers/metrics.controller';
import { createLoggerParams } from '@/platform/observability/helpers/logger.helpers';
import { HealthService } from '@/platform/observability/services/health.service';
import { HttpMetricsService } from '@/platform/observability/services/http-metrics.service';
import { LogContextService } from '@/platform/observability/services/log-context.service';
import { MetricsService } from '@/platform/observability/services/metrics.service';

export class ObservabilityModule extends defineModule({
  global: true,
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService, LogContextService],
      useFactory: (config: ConfigService, logContext: LogContextService) =>
        createLoggerParams(config.config, logContext),
    }),
  ],
  providers: [HealthService, HttpMetricsService, LogContextService, MetricsService],
  exports: [HealthService, HttpMetricsService, LogContextService, MetricsService],
  roleControllers: inEveryRole([HealthController, MetricsController]),
}) {}
