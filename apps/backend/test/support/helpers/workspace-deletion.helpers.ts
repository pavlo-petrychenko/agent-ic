import type { INestApplicationContext } from '@nestjs/common';
import { count, eq, getTableName } from 'drizzle-orm';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import { users } from '@/modules/identity/db/users.table';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { promptVersions } from '@/modules/prompts/db/prompt-versions.table';
import { prompts } from '@/modules/prompts/db/prompts.table';
import {
  FIRST_STEP_ATTEMPT,
  RunStatus,
  RunStepStatus,
  RunTrigger,
} from '@/modules/runs/constants/run.constants';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import { runs } from '@/modules/runs/db/runs.table';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_PUBLISHED_NUMBER } from '@test/support/constants/runs-testing.constants';
import { WORKSPACE_TABLES } from '@test/support/constants/workspace-testing.constants';
import { newVersion } from '@test/support/fixtures/agents.fixture';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { newRunStep } from '@test/support/fixtures/runs.fixture';
import { ensureAgentRow, ensureRunParents } from '@test/support/helpers/parent-rows.helpers';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

export const seedWorkspaceContent = async (
  app: INestApplicationContext,
  workspace: TestWorkspace,
): Promise<void> => {
  const { db } = app.get(SystemDatabaseService);
  const ids = app.get(IdService);
  const now = app.get(ClockService).now();
  const { workspaceId, ownerId } = workspace;
  const agentId = ids.generate();
  const run: NewRun = {
    id: ids.generate(),
    workspaceId,
    conversationId: ids.generate(),
    agentId,
    versionId: ids.generate(),
    mode: ConversationMode.Live,
    trigger: RunTrigger.Message,
    status: RunStatus.Queued,
    lastCoveredMessageId: ids.generate(),
    createdAt: now,
  };
  await ensureAgentRow(app, workspaceId, agentId);
  await db.insert(agentVersions).values(
    newVersion(run.versionId, workspaceId, agentId, {
      kind: AgentVersionKind.Published,
      number: TEST_PUBLISHED_NUMBER,
      publishedAt: now,
      authorId: ownerId,
    }),
  );
  await db.update(agents).set({ liveVersionId: run.versionId }).where(eq(agents.id, agentId));
  await ensureRunParents(app, run);
  await db.insert(runs).values(run);
  await db.insert(runSteps).values({
    ...newRunStep({ ids }, run),
    status: RunStepStatus.Running,
    attempt: FIRST_STEP_ATTEMPT,
  });
  await db
    .update(conversations)
    .set({ activeRunId: run.id, handledBy: ownerId })
    .where(eq(conversations.id, run.conversationId));
  await db.update(messages).set({ runId: run.id }).where(eq(messages.id, run.lastCoveredMessageId));
  const folderId = ids.generate();
  const promptId = ids.generate();
  await db.insert(promptFolders).values(newFolder(folderId, workspaceId));
  await db
    .insert(prompts)
    .values(newPrompt(promptId, workspaceId, folderId, { createdByUserId: ownerId }));
  await db
    .insert(promptVersions)
    .values(newPromptVersion(ids.generate(), workspaceId, promptId, { authorId: ownerId }));
  await db.update(users).set({ lastWorkspaceId: workspaceId }).where(eq(users.id, ownerId));
};

export const countWorkspaceRows = async (
  app: INestApplicationContext,
  workspaceId: string,
): Promise<Record<string, number>> => {
  const { db } = app.get(SystemDatabaseService);
  const counted = await Promise.all(
    WORKSPACE_TABLES.map(async (table) => {
      const [row] = await db
        .select({ total: count() })
        .from(table)
        .where(eq(table.workspaceId, workspaceId));
      return [getTableName(table), row?.total ?? 0] as const;
    }),
  );
  return Object.fromEntries(counted);
};

export const readLastWorkspaceId = async (
  app: INestApplicationContext,
  userId: string,
): Promise<string | null> => {
  const [user] = await app
    .get(SystemDatabaseService)
    .db.select({ lastWorkspaceId: users.lastWorkspaceId })
    .from(users)
    .where(eq(users.id, userId));
  return user?.lastWorkspaceId ?? null;
};
