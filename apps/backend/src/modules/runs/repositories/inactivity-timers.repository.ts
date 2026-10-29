import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { inactivityTimers } from '@/modules/runs/db/inactivity-timers.table';
import type {
  InactivityTimer,
  NewInactivityTimer,
} from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class InactivityTimersRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async arm(timer: NewInactivityTimer): Promise<InactivityTimer> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(inactivityTimers)
        .values({ ...timer, createdAt: now, updatedAt: now })
        .onConflictDoUpdate({
          target: [inactivityTimers.workspaceId, inactivityTimers.conversationId],
          set: {
            versionId: timer.versionId,
            nodeId: timer.nodeId,
            anchorAt: timer.anchorAt,
            attempt: timer.attempt,
            dueAt: timer.dueAt,
            leaseUntil: null,
            updatedAt: now,
          },
        })
        .returning(),
    );
  }

  async findById(workspaceId: string, id: string): Promise<InactivityTimer | null> {
    const [timer] = await this.txHost.tx
      .select()
      .from(inactivityTimers)
      .where(and(eq(inactivityTimers.workspaceId, workspaceId), eq(inactivityTimers.id, id)));
    return timer ?? null;
  }

  async findByConversation(
    workspaceId: string,
    conversationId: string,
  ): Promise<InactivityTimer | null> {
    const [timer] = await this.txHost.tx
      .select()
      .from(inactivityTimers)
      .where(
        and(
          eq(inactivityTimers.workspaceId, workspaceId),
          eq(inactivityTimers.conversationId, conversationId),
        ),
      );
    return timer ?? null;
  }

  async disarm(workspaceId: string, conversationId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(inactivityTimers)
      .where(
        and(
          eq(inactivityTimers.workspaceId, workspaceId),
          eq(inactivityTimers.conversationId, conversationId),
        ),
      )
      .returning({ id: inactivityTimers.id });
    return deleted.length > 0;
  }
}
