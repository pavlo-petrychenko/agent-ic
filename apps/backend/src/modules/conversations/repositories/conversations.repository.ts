import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { conversations } from '@/modules/conversations/db/conversations.table';
import type {
  Conversation,
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
}
