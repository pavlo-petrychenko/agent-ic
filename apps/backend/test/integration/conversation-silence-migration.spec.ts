import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import {
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { runMigrations } from '@/platform/database/helpers/migration.helpers';
import type { SqlExecutor } from '@/platform/database/typedefs/database.typedefs';
import {
  LAST_TAG_BEFORE_CONVERSATION_SILENCE,
  SILENCE_DATABASE,
} from '@test/support/constants/migration-testing.constants';
import { TEST_INFRASTRUCTURE_KEY } from '@test/support/constants/test-infrastructure.constants';
import { openScratchDatabase } from '@test/support/helpers/database-testing.helpers';
import {
  createOwnedDatabase,
  databaseUrlFor,
  dropDatabase,
  migrateThrough,
} from '@test/support/helpers/migration-testing.helpers';
import { seedWorkspaceWithAgent } from '@test/support/helpers/orphans-testing.helpers';
import { testDatabaseListeners } from '@test/support/helpers/test-infrastructure.helpers';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

const FIRST_AT = new Date('2026-10-01T10:00:00Z');
const SECOND_AT = new Date('2026-10-01T11:00:00Z');
const LAST_AT = new Date('2026-10-01T12:00:00Z');
const END_USER = 'end-user';

describe('the conversation silence migration', () => {
  const infrastructure = inject(TEST_INFRASTRUCTURE_KEY);
  const ownerUrl = databaseUrlFor(infrastructure.ownerUrl, SILENCE_DATABASE);
  let workspaceId = '';
  let agentId = '';
  const answered = randomUUID();
  const waiting = randomUUID();
  const operated = randomUUID();
  const untouched = randomUUID();
  let superuser: ScratchDatabase;

  const insertConversation = (tx: SqlExecutor, id: string, state: ConversationState) =>
    tx.execute(sql`
      insert into conversations.conversations
        (id, workspace_id, agent_id, mode, channel_kind, end_user_external_id, state,
         last_message_at, created_at)
      values
        (${id}, ${workspaceId}, ${agentId}, ${ConversationMode.Live}, ${ChannelKind.Simulated},
         ${END_USER}, ${state}, ${LAST_AT}, ${FIRST_AT})
    `);

  const insertMessage = (
    tx: SqlExecutor,
    conversationId: string,
    author: MessageAuthor,
    createdAt: Date,
  ) =>
    tx.execute(sql`
      insert into conversations.messages
        (id, workspace_id, conversation_id, author, text, quick_replies, created_at)
      values
        (${randomUUID()}, ${workspaceId}, ${conversationId}, ${author}, 'text', '{}', ${createdAt})
    `);

  const seed = async () => {
    const parents = await seedWorkspaceWithAgent(superuser.db);
    workspaceId = parents.workspaceId;
    agentId = parents.agentId;
    await superuser.db.transaction(async (tx) => {
      await insertConversation(tx, answered, ConversationState.AgentActive);
      await insertMessage(tx, answered, MessageAuthor.Customer, FIRST_AT);
      await insertMessage(tx, answered, MessageAuthor.Customer, SECOND_AT);
      await insertMessage(tx, answered, MessageAuthor.Agent, LAST_AT);
      await insertConversation(tx, waiting, ConversationState.Waiting);
      await insertConversation(tx, operated, ConversationState.AgentActive);
      await insertMessage(tx, operated, MessageAuthor.Operator, SECOND_AT);
      await insertConversation(tx, untouched, ConversationState.AgentActive);
    });
  };

  const readColumns = async () => {
    const result = await superuser.db.execute<{
      id: string;
      customer: string | null;
      escalated: string | null;
    }>(sql`
      select id, last_customer_message_at as customer, last_escalated_at as escalated
      from conversations.conversations
    `);
    const asDate = (value: string | null) => (value === null ? null : new Date(value));
    return new Map(
      result.rows.map((row) => [
        row.id,
        { customer: asDate(row.customer), escalated: asDate(row.escalated) },
      ]),
    );
  };

  beforeAll(async () => {
    await createOwnedDatabase(infrastructure.superuserUrl, SILENCE_DATABASE);
    await migrateThrough(ownerUrl, LAST_TAG_BEFORE_CONVERSATION_SILENCE);
    superuser = openScratchDatabase(databaseUrlFor(infrastructure.superuserUrl, SILENCE_DATABASE));
    await seed();
  });

  afterAll(async () => {
    await superuser.close();
    await dropDatabase(infrastructure.superuserUrl, SILENCE_DATABASE);
  });

  it('fills the last customer message and marks conversations that already reached a person', async () => {
    await runMigrations(ownerUrl, testDatabaseListeners());

    const columns = await readColumns();
    expect(columns.get(answered)).toMatchObject({ customer: SECOND_AT, escalated: null });
    expect(columns.get(waiting)).toMatchObject({ customer: null, escalated: LAST_AT });
    expect(columns.get(operated)).toMatchObject({ customer: null, escalated: LAST_AT });
    expect(columns.get(untouched)).toMatchObject({ customer: null, escalated: null });
  });
});
