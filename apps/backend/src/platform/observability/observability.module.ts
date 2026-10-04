import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@/platform/config/services/config.service';
import { defineModule, inEveryRole } from '@/platform/module-roles/helpers/module-roles.helpers';
import { HealthController } from '@/platform/observability/controllers/health.controller';
import { MetricsController } from '@/platform/observability/controllers/metrics.controller';
import { createLoggerParams } from '@/platform/observability/helpers/logger.helpers';
import { HealthService } from '@/platform/observability/services/health.service';
import { MetricsService } from '@/platform/observability/services/metrics.service';

export class ObservabilityModule extends defineModule({
  global: true,
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createLoggerParams(config.config),
    }),
  ],
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
  roleControllers: inEveryRole([HealthController, MetricsController]),
}) {}
