import { Locale } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app/app.module';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { createApplication } from '@/app/helpers/application.helpers';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
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
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import { ProbeJobsModule } from '@test/support/modules/probe-jobs.module';

export const createProbeWorker = async (
  redisDatabase: TestRedisDatabase = TestRedisDatabase.Jobs,
): Promise<INestApplication> => {
  const config = loadAppConfig(
    { role: Role.Worker, queues: [QueueName.Notify] },
    createIntegrationTestEnv(redisDatabase),
  );
  const tracing = new TracingService(config.telemetry);
  const app = await createApplication(
    config,
    AppModule.forRole(config, tracing, [...APP_MODULES, ProbeJobsModule]),
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
