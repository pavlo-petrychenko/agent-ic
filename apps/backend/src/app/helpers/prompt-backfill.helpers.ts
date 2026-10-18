import type { INestApplicationContext } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { BackfillLogMessage } from '@/app/constants/backfill.constants';
import type { PromptBackfillResult } from '@/app/typedefs/backfill.typedefs';
import { WorkspaceDirectoryRepository } from '@/modules/identity';
import { PromptBackfillService } from '@/modules/prompts';

export const backfillInlinePrompts = async (
  app: INestApplicationContext,
): Promise<PromptBackfillResult> => {
  const logger = app.get(Logger);
  const workspaceIds = await app.get(WorkspaceDirectoryRepository).listIds();
  const backfill = app.get(PromptBackfillService);
  let versions = 0;
  let prompts = 0;
  for (const workspaceId of workspaceIds) {
    const counts = await backfill.backfillWorkspace(workspaceId);
    if (counts.versions === 0) {
      continue;
    }
    versions += counts.versions;
    prompts += counts.prompts;
    logger.log({
      msg: BackfillLogMessage.WorkspaceMigrated,
      workspaceId,
      versions: counts.versions,
      prompts: counts.prompts,
    });
  }
  const result: PromptBackfillResult = { workspaces: workspaceIds.length, versions, prompts };
  logger.log({ msg: BackfillLogMessage.Complete, ...result });
  return result;
};
