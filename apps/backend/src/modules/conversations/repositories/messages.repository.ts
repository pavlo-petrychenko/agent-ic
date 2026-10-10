import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, lt, lte, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { messages } from '@/modules/conversations/db/messages.table';
import type {
  Message,
  MessagePosition,
  NewMessage,
} from '@/modules/conversations/typedefs/message.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class MessagesRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insertIfAbsent(message: NewMessage): Promise<Message | null> {
    const [created] = await this.txHost.tx
      .insert(messages)
      .values(message)
      .onConflictDoNothing()
      .returning();
    return created ?? null;
  }

  async findById(workspaceId: string, id: string): Promise<Message | null> {
    const [message] = await this.txHost.tx
      .select()
      .from(messages)
      .where(and(eq(messages.workspaceId, workspaceId), eq(messages.id, id)));
    return message ?? null;
  }

  async findByIdempotencyKey(workspaceId: string, key: string): Promise<Message | null> {
    const [message] = await this.txHost.tx
      .select()
      .from(messages)
      .where(and(eq(messages.workspaceId, workspaceId), eq(messages.idempotencyKey, key)));
    return message ?? null;
  }

  async findByExternalId(
    workspaceId: string,
    conversationId: string,
    externalId: string,
  ): Promise<Message | null> {
    const [message] = await this.txHost.tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.workspaceId, workspaceId),
          eq(messages.conversationId, conversationId),
          eq(messages.externalId, externalId),
        ),
      );
    return message ?? null;
  }

  listThrough(
    workspaceId: string,
    conversationId: string,
    last: MessagePosition,
  ): Promise<Message[]> {
    return this.listWhere(
      workspaceId,
      conversationId,
      or(
        lt(messages.createdAt, last.createdAt),
        and(eq(messages.createdAt, last.createdAt), lte(messages.id, last.id)),
      ),
    );
  }

  private listWhere(
    workspaceId: string,
    conversationId: string,
    condition: SQL | undefined,
  ): Promise<Message[]> {
    return this.txHost.tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.workspaceId, workspaceId),
          eq(messages.conversationId, conversationId),
          condition,
        ),
      )
      .orderBy(asc(messages.createdAt), asc(messages.id));
  }
}
