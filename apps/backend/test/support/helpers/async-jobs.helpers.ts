import { Locale } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app/app.module';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { configureApplication } from '@/app/helpers/application.helpers';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import {
  PROBE_TRACE_ID,
  PROBE_USER_ID,
  PROBE_WORKSPACE_ID,
} from '@test/support/constants/async-jobs.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { ProbeJobsModule } from '@test/support/modules/probe-jobs.module';
import type { ProviderOverride } from '@test/support/typedefs/test-infrastructure.typedefs';

export const createProbeWorker = async (
  redisPrefix: TestRedisPrefix = TestRedisPrefix.Jobs,
  overrides: readonly ProviderOverride[] = [],
): Promise<INestApplication> => {
  const config = createIntegrationConfig(
    { role: Role.Worker, queues: [QueueName.Notify] },
    redisPrefix,
  );
  const tracing = new TracingService(config.telemetry);
  const builder = Test.createTestingModule({
    imports: [AppModule.forRole(config, tracing, [...APP_MODULES, ProbeJobsModule])],
  });
  for (const { token, value } of overrides) {
    builder.overrideProvider(token).useValue(value);
  }
  const moduleRef = await builder.compile();
  const app = configureApplication(
    config,
    moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true }),
  );
  return app.init();
};

export const userCtx = (): UseCaseCtx => ({
  actor: { kind: ActorKind.User, userId: PROBE_USER_ID },
  initiatedBy: null,
  workspaceId: PROBE_WORKSPACE_ID,
  workspaceRole: null,
  traceId: PROBE_TRACE_ID,
  locale: Locale.En,
  clientIp: null,
});
