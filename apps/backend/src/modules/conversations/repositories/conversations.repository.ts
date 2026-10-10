import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { endUserLockKey } from '@/modules/conversations/helpers/incoming-message.helpers';
import type {
  Conversation,
  EndUserConversationKey,
  NewConversation,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(conversation: NewConversation): Promise<void> {
    await this.txHost.tx.insert(conversations).values(conversation);
  }

  async findById(workspaceId: string, id: string): Promise<Conversation | null> {
    const [conversation] = await this.txHost.tx
      .select()
      .from(conversations)
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)));
    return conversation ?? null;
  }

  async findOpenForUpdate(key: EndUserConversationKey): Promise<Conversation | null> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${endUserLockKey(key)}))`,
    );
    const [conversation] = await this.txHost.tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, key.workspaceId),
          eq(conversations.agentId, key.agentId),
          eq(conversations.channelKind, key.channelKind),
          eq(conversations.endUserExternalId, key.endUserExternalId),
          eq(conversations.mode, key.mode),
          ne(conversations.state, ConversationState.Closed),
        ),
      )
      .orderBy(desc(conversations.createdAt))
      .limit(1)
      .for('update');
    return conversation ?? null;
  }

  async claimAwayMessage(
    workspaceId: string,
    id: string,
    pausedAt: Date,
    sentAt: Date,
  ): Promise<boolean> {
    const claimed = await this.txHost.tx
      .update(conversations)
      .set({ awaySentAt: sentAt })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          or(isNull(conversations.awaySentAt), lt(conversations.awaySentAt, pausedAt)),
        ),
      )
      .returning({ id: conversations.id });
    return claimed.length > 0;
  }

  async claim(workspaceId: string, id: string, runId: string): Promise<boolean> {
    const claimed = await this.txHost.tx
      .update(conversations)
      .set({ activeRunId: runId })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          isNull(conversations.activeRunId),
        ),
      )
      .returning({ id: conversations.id });
    return claimed.length > 0;
  }

  async release(workspaceId: string, id: string, runId: string): Promise<boolean> {
    const released = await this.txHost.tx
      .update(conversations)
      .set({ activeRunId: null })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          eq(conversations.activeRunId, runId),
        ),
      )
      .returning({ id: conversations.id });
    return released.length > 0;
  }

  async markWaiting(workspaceId: string, id: string): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Waiting })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          eq(conversations.state, ConversationState.AgentActive),
        ),
      )
      .returning({ id: conversations.id });
    return updated.length > 0;
  }

  async close(workspaceId: string, id: string, closedAt: Date): Promise<void> {
    await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Closed, closedAt })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          ne(conversations.state, ConversationState.Closed),
        ),
      );
  }

  async touch(workspaceId: string, id: string, lastMessageAt: Date): Promise<void> {
    await this.txHost.tx
      .update(conversations)
      .set({ lastMessageAt })
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)));
  }
}
