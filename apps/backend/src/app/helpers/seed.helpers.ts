import type { INestApplicationContext } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SeedLogMessage } from '@/app/constants/seed.constants';
import type { SeedResult } from '@/app/typedefs/seed.typedefs';
import { SampleAgentService } from '@/modules/agents';
import { SampleWorkspaceService } from '@/modules/identity';

export const seedSampleData = async (app: INestApplicationContext): Promise<SeedResult> => {
  const logger = app.get(Logger);
  const { userId, workspaceId } = await app.get(SampleWorkspaceService).ensure();
  logger.log({ msg: SeedLogMessage.SampleWorkspaceReady, userId, workspaceId });
  const agentCreated = await app.get(SampleAgentService).ensure(workspaceId, userId);
  logger.log({
    msg: agentCreated ? SeedLogMessage.SampleAgentCreated : SeedLogMessage.SampleAgentExists,
    workspaceId,
  });
  const examples = await app.get(SampleWorkspaceService).ensureFlowExamples(userId);
  logger.log({ msg: SeedLogMessage.FlowExamplesWorkspaceReady, workspaceId: examples.workspaceId });
  const examplesCreated = await app
    .get(SampleAgentService)
    .ensureFlowExamples(examples.workspaceId, userId);
  logger.log({
    msg: examplesCreated ? SeedLogMessage.FlowExamplesCreated : SeedLogMessage.FlowExamplesExist,
    workspaceId: examples.workspaceId,
  });
  return {
    userId,
    workspaceId,
    agentCreated,
    examplesWorkspaceId: examples.workspaceId,
    examplesCreated,
  };
};
