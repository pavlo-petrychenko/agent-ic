import type { INestApplication } from '@nestjs/common';

import { ApplicationFactory } from '@/entrypoints/application.factory';
import { CliOption, Role } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ActorKind, Locale } from '@/platform/context/context.constants';
import { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { TracingService } from '@/platform/observability/tracing/tracing.service';
import { QueueName } from '@/platform/queues/queue.constants';
import { createIntegrationTestEnv } from '@/platform/testing/integration-env.fixture';
import { TestRedisDatabase } from '@/platform/testing/test-infrastructure.constants';
import { cliArgument, createArgv } from '@/platform/testing/test-env.fixture';

import { PROBE_TRACE_ID, PROBE_USER_ID, PROBE_WORKSPACE_ID } from './async-jobs.constants';
import { ProbeWorkerModule } from './async-jobs.modules';

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
