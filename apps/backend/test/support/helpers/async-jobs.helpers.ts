import type { INestApplication } from '@nestjs/common';
import { ApplicationFactory } from '@/entrypoints/application.factory';
import { CliOption } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ActorKind, Locale } from '@/platform/context/context.constants';
import { UseCaseCtx } from '@/platform/context/use-case-ctx';
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
import { cliArgument, createArgv } from '@test/support/fixtures/test-env.fixture';
import { ProbeWorkerModule } from '@test/support/modules/probe-worker.module';

export const createProbeWorker = async (): Promise<INestApplication> => {
  const config = new ConfigLoader(createIntegrationTestEnv(TestRedisDatabase.Jobs)).load(
    createArgv(
      cliArgument(CliOption.Role, Role.Worker),
      cliArgument(CliOption.Queues, QueueName.Notify),
    ),
  );
  const app = await new ApplicationFactory(config, new TracingService(config.telemetry), {
    module: ProbeWorkerModule,
    globalPrefix: null,
  }).create();
  return app.init();
};

export const userCtx = (): UseCaseCtx =>
  new UseCaseCtx({
    actor: { kind: ActorKind.User, userId: PROBE_USER_ID },
    initiatedBy: null,
    workspaceId: PROBE_WORKSPACE_ID,
    traceId: PROBE_TRACE_ID,
    locale: Locale.En,
  });
