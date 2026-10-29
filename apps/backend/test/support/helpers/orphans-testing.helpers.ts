import { randomUUID } from 'node:crypto';
import { Locale } from '@agent-ic/contracts';
import { eq, inArray, sql } from 'drizzle-orm';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import {
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { prompts } from '@/modules/prompts/db/prompts.table';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { runs } from '@/modules/runs/db/runs.table';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import { AGENTS_TEST_START } from '@test/support/constants/agents-testing.constants';
import { TEST_END_USER_EXTERNAL_ID } from '@test/support/constants/conversations-testing.constants';
import { ORPHAN_TEXT } from '@test/support/constants/migration-testing.constants';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NAME,
  TEST_WORKSPACE_OWNER_NAME,
  TEST_WORKSPACE_OWNER_PASSWORD_HASH,
} from '@test/support/constants/workspace-testing.constants';
import { emptyFlow, newAgent } from '@test/support/fixtures/agents.fixture';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import { rowTimestamps } from '@test/support/helpers/row-timestamps.helpers';
import type { SeededOrphans } from '@test/support/typedefs/migration-testing.typedefs';

const insertWorkspace = async (db: AppDatabase, userId: string): Promise<string> => {
  const workspaceId = randomUUID();
  await db.insert(workspaces).values({
    id: workspaceId,
    workspaceId,
    name: TEST_WORKSPACE_NAME,
    timeZone: TEST_TIME_ZONE,
    createdByUserId: userId,
    createdAt: AGENTS_TEST_START,
    updatedAt: AGENTS_TEST_START,
  });
  return workspaceId;
};

const conversationRow = (id: string, workspaceId: string, agentId: string) => ({
  id,
  workspaceId,
  agentId,
  mode: ConversationMode.Live,
  channelKind: ChannelKind.Simulated,
  endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  state: ConversationState.Handled,
  lastMessageAt: AGENTS_TEST_START,
  createdAt: AGENTS_TEST_START,
});

const insertConversations = async (
  db: AppDatabase,
  rows: readonly (ReturnType<typeof conversationRow> & {
    readonly activeRunId: string | null;
    readonly handledBy: string | null;
  })[],
): Promise<void> => {
  for (const row of rows) {
    await db.execute(sql`
      insert into conversations.conversations
        (id, workspace_id, agent_id, mode, channel_kind, end_user_external_id, state,
         handled_by, active_run_id, last_message_at, created_at)
      values
        (${row.id}, ${row.workspaceId}, ${row.agentId}, ${row.mode}, ${row.channelKind},
         ${row.endUserExternalId}, ${row.state}, ${row.handledBy}, ${row.activeRunId},
         ${row.lastMessageAt}, ${row.createdAt})
    `);
  }
};

export const seedWorkspaceWithAgent = async (
  db: AppDatabase,
): Promise<{ readonly workspaceId: string; readonly agentId: string }> => {
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: uniqueEmail(),
    name: TEST_WORKSPACE_OWNER_NAME,
    passwordHash: TEST_WORKSPACE_OWNER_PASSWORD_HASH,
    locale: Locale.En,
    createdAt: AGENTS_TEST_START,
    updatedAt: AGENTS_TEST_START,
  });
  const workspaceId = await insertWorkspace(db, userId);
  const agentId = randomUUID();
  await db
    .insert(agents)
    .values({ ...newAgent(agentId, workspaceId), ...rowTimestamps(AGENTS_TEST_START) });
  return { workspaceId, agentId };
};

export const seedOrphans = async (db: AppDatabase): Promise<SeededOrphans> => {
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: uniqueEmail(),
    name: TEST_WORKSPACE_OWNER_NAME,
    passwordHash: TEST_WORKSPACE_OWNER_PASSWORD_HASH,
    locale: Locale.En,
    lastWorkspaceId: randomUUID(),
    pendingInviteLinkId: randomUUID(),
    createdAt: AGENTS_TEST_START,
    updatedAt: AGENTS_TEST_START,
  });
  const workspaceId = await insertWorkspace(db, userId);
  const otherWorkspaceId = await insertWorkspace(db, userId);
  const missingWorkspaceId = randomUUID();
  const seeded: SeededOrphans = {
    userId,
    workspaceId,
    keptAgentId: randomUUID(),
    keptConversationId: randomUUID(),
    deletedAgentId: randomUUID(),
    deletedVersionId: randomUUID(),
    deletedConversationId: randomUUID(),
    deletedMessageId: randomUUID(),
    deletedRunId: randomUUID(),
    deletedFolderId: randomUUID(),
    deletedPromptId: randomUUID(),
  };
  await db.insert(agents).values([
    {
      ...newAgent(seeded.keptAgentId, workspaceId, { liveVersionId: randomUUID() }),
      ...rowTimestamps(AGENTS_TEST_START),
    },
    { ...newAgent(seeded.deletedAgentId, missingWorkspaceId), ...rowTimestamps(AGENTS_TEST_START) },
  ]);
  await db.insert(agentVersions).values({
    id: seeded.deletedVersionId,
    workspaceId: missingWorkspaceId,
    agentId: seeded.deletedAgentId,
    kind: AgentVersionKind.Draft,
    flow: emptyFlow(),
    createdAt: AGENTS_TEST_START,
    updatedAt: AGENTS_TEST_START,
  });
  await insertConversations(db, [
    {
      ...conversationRow(seeded.keptConversationId, workspaceId, seeded.keptAgentId),
      activeRunId: randomUUID(),
      handledBy: randomUUID(),
    },
    {
      ...conversationRow(seeded.deletedConversationId, workspaceId, randomUUID()),
      activeRunId: null,
      handledBy: null,
    },
  ]);
  await db.insert(messages).values({
    id: seeded.deletedMessageId,
    workspaceId,
    conversationId: seeded.deletedConversationId,
    author: MessageAuthor.Customer,
    text: ORPHAN_TEXT,
    quickReplies: [],
    createdAt: AGENTS_TEST_START,
  });
  await db.insert(runs).values({
    id: seeded.deletedRunId,
    workspaceId,
    conversationId: seeded.keptConversationId,
    agentId: seeded.keptAgentId,
    versionId: randomUUID(),
    mode: ConversationMode.Live,
    trigger: RunTrigger.Message,
    status: RunStatus.Queued,
    lastCoveredMessageId: randomUUID(),
    createdAt: AGENTS_TEST_START,
  });
  const otherFolderId = randomUUID();
  await db.insert(promptFolders).values([
    {
      ...newFolder(seeded.deletedFolderId, missingWorkspaceId),
      ...rowTimestamps(AGENTS_TEST_START),
    },
    { ...newFolder(otherFolderId, otherWorkspaceId), ...rowTimestamps(AGENTS_TEST_START) },
  ]);
  await db.insert(prompts).values({
    ...newPrompt(seeded.deletedPromptId, workspaceId, otherFolderId),
    ...rowTimestamps(AGENTS_TEST_START),
  });
  return seeded;
};

export const readOrphanSurvivors = async (db: AppDatabase, seeded: SeededOrphans) => {
  const [user] = await db
    .select({
      lastWorkspaceId: users.lastWorkspaceId,
      pendingInviteLinkId: users.pendingInviteLinkId,
    })
    .from(users)
    .where(eq(users.id, seeded.userId));
  const keptAgents = await db
    .select({ id: agents.id, liveVersionId: agents.liveVersionId })
    .from(agents)
    .where(inArray(agents.id, [seeded.keptAgentId, seeded.deletedAgentId]));
  const keptConversations = await db
    .select({
      id: conversations.id,
      activeRunId: conversations.activeRunId,
      handledBy: conversations.handledBy,
    })
    .from(conversations)
    .where(inArray(conversations.id, [seeded.keptConversationId, seeded.deletedConversationId]));
  const left = {
    versions: await db
      .select({ id: agentVersions.id })
      .from(agentVersions)
      .where(eq(agentVersions.id, seeded.deletedVersionId)),
    messages: await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.id, seeded.deletedMessageId)),
    runs: await db.select({ id: runs.id }).from(runs).where(eq(runs.id, seeded.deletedRunId)),
    folders: await db
      .select({ id: promptFolders.id })
      .from(promptFolders)
      .where(eq(promptFolders.id, seeded.deletedFolderId)),
    prompts: await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.id, seeded.deletedPromptId)),
  };
  return { user, agents: keptAgents, conversations: keptConversations, left };
};
