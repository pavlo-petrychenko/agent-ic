import { Locale } from '@agent-ic/contracts';
import type { INestApplicationContext } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { runs } from '@/modules/runs/db/runs.table';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_END_USER_EXTERNAL_ID,
  TEST_MESSAGE_TEXT,
} from '@test/support/constants/conversations-testing.constants';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NAME,
  TEST_WORKSPACE_OWNER_NAME,
  TEST_WORKSPACE_OWNER_PASSWORD_HASH,
} from '@test/support/constants/workspace-testing.constants';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';

type RunParents = Pick<
  NewRun,
  'workspaceId' | 'agentId' | 'versionId' | 'conversationId' | 'lastCoveredMessageId' | 'mode'
>;

export const ensureUserRow = async (
  app: INestApplicationContext,
  userId: string,
): Promise<void> => {
  const now = app.get(ClockService).now();
  await app
    .get(SystemDatabaseService)
    .db.insert(users)
    .values({
      id: userId,
      email: uniqueEmail(),
      name: TEST_WORKSPACE_OWNER_NAME,
      passwordHash: TEST_WORKSPACE_OWNER_PASSWORD_HASH,
      locale: Locale.En,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
};

export const ensureWorkspaceRow = async (
  app: INestApplicationContext,
  workspaceId: string,
): Promise<void> => {
  const { db } = app.get(SystemDatabaseService);
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));
  if (existing !== undefined) {
    return;
  }
  const ownerId = app.get(IdService).generate();
  const now = app.get(ClockService).now();
  await ensureUserRow(app, ownerId);
  await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      workspaceId,
      name: TEST_WORKSPACE_NAME,
      timeZone: TEST_TIME_ZONE,
      createdByUserId: ownerId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
};

export const ensureAgentRow = async (
  app: INestApplicationContext,
  workspaceId: string,
  agentId: string,
): Promise<void> => {
  await ensureWorkspaceRow(app, workspaceId);
  await app
    .get(SystemDatabaseService)
    .db.insert(agents)
    .values(newAgent(agentId, workspaceId))
    .onConflictDoNothing();
};

export const ensureRunParents = async (
  app: INestApplicationContext,
  run: RunParents,
): Promise<void> => {
  const { workspaceId, agentId } = run;
  await ensureAgentRow(app, workspaceId, agentId);
  const { db } = app.get(SystemDatabaseService);
  const now = app.get(ClockService).now();
  await db
    .insert(agentVersions)
    .values(newVersion(run.versionId, workspaceId, agentId, { kind: AgentVersionKind.Snapshot }))
    .onConflictDoNothing();
  await db
    .insert(conversations)
    .values({
      id: run.conversationId,
      workspaceId,
      agentId,
      mode: run.mode,
      channelKind: ChannelKind.Simulated,
      endUserExternalId: TEST_END_USER_EXTERNAL_ID,
      state: ConversationState.AgentActive,
      lastMessageAt: now,
      createdAt: now,
    })
    .onConflictDoNothing();
  await db
    .insert(messages)
    .values({
      id: run.lastCoveredMessageId,
      workspaceId,
      conversationId: run.conversationId,
      author: MessageAuthor.Customer,
      text: TEST_MESSAGE_TEXT,
      quickReplies: [],
      createdAt: now,
    })
    .onConflictDoNothing();
};

export const seedRunRow = async (
  app: INestApplicationContext,
  conversation: Pick<NewConversation, 'id' | 'workspaceId' | 'agentId' | 'mode'>,
): Promise<string> => {
  const ids = app.get(IdService);
  const run: NewRun = {
    id: ids.generate(),
    workspaceId: conversation.workspaceId,
    conversationId: conversation.id,
    agentId: conversation.agentId,
    versionId: ids.generate(),
    mode: conversation.mode,
    trigger: RunTrigger.Message,
    status: RunStatus.Queued,
    lastCoveredMessageId: ids.generate(),
    createdAt: app.get(ClockService).now(),
  };
  await ensureRunParents(app, run);
  await app.get(SystemDatabaseService).db.insert(runs).values(run);
  return run.id;
};
