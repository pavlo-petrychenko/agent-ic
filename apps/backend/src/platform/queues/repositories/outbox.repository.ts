import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { asc, count, eq, inArray, lte, min } from 'drizzle-orm';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { NO_OUTBOX_MESSAGES } from '@/platform/queues/constants/outbox.constants';
import { outboxMessages } from '@/platform/queues/db/outbox-message.table';
import type {
  NewOutboxMessage,
  OutboxBacklog,
  OutboxSend,
} from '@/platform/queues/typedefs/outbox.typedefs';

@Injectable()
export class OutboxRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly systemDb: SystemDatabaseService,
    private readonly clock: ClockService,
  ) {}

  async insert(message: NewOutboxMessage): Promise<void> {
    await this.txHost.tx
      .insert(outboxMessages)
      .values({ ...message, createdAt: this.clock.now() })
      .onConflictDoNothing();
  }

  async delete(id: string): Promise<void> {
    await this.systemDb.db.delete(outboxMessages).where(eq(outboxMessages.id, id));
  }

  async backlog(): Promise<OutboxBacklog> {
    const [row] = await this.systemDb.db
      .select({ pending: count(), oldestCreatedAt: min(outboxMessages.createdAt) })
      .from(outboxMessages);
    return {
      pending: row?.pending ?? NO_OUTBOX_MESSAGES,
      oldestCreatedAt: row?.oldestCreatedAt ?? null,
    };
  }

  takeDue(cutoff: Date, limit: number, send: OutboxSend): Promise<number> {
    return this.systemDb.db.transaction(async (tx) => {
      const due = await tx
        .select()
        .from(outboxMessages)
        .where(lte(outboxMessages.createdAt, cutoff))
        .orderBy(asc(outboxMessages.createdAt))
        .limit(limit)
        .for('update', { skipLocked: true });
      for (const message of due) {
        await send(message);
      }
      if (due.length > 0) {
        await tx.delete(outboxMessages).where(
          inArray(
            outboxMessages.id,
            due.map((message) => message.id),
          ),
        );
      }
      return due.length;
    });
  }
}
