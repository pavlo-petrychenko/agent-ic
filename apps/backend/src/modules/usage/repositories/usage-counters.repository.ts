import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { NO_USAGE, UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { usageCounters } from '@/modules/usage/db/usage-counters.table';
import type { UsageCounter, UsageCounterKey } from '@/modules/usage/typedefs/usage.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class UsageCountersRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async addCredits(key: UsageCounterKey, credits: number): Promise<UsageCounter | null> {
    const [counter] = await this.txHost.tx
      .insert(usageCounters)
      .values(this.newCounter(key, { credits }))
      .onConflictDoUpdate({
        target: [usageCounters.workspaceId, usageCounters.period],
        set: {
          credits: sql`${usageCounters.credits} + excluded.credits`,
          updatedAt: key.at,
        },
      })
      .returning();
    return counter ?? null;
  }

  async addConversation(key: UsageCounterKey): Promise<UsageCounter | null> {
    const [counter] = await this.txHost.tx
      .insert(usageCounters)
      .values(this.newCounter(key, { conversations: 1 }))
      .onConflictDoUpdate({
        target: [usageCounters.workspaceId, usageCounters.period],
        set: {
          conversations: sql`${usageCounters.conversations} + excluded.conversations`,
          updatedAt: key.at,
        },
      })
      .returning();
    return counter ?? null;
  }

  async find(workspaceId: string, period: string): Promise<UsageCounter | null> {
    const [counter] = await this.txHost.tx
      .select()
      .from(usageCounters)
      .where(and(eq(usageCounters.workspaceId, workspaceId), eq(usageCounters.period, period)));
    return counter ?? null;
  }

  async markWarned(
    counter: UsageCounter,
    threshold: UsageThreshold,
    at: Date,
  ): Promise<UsageCounter | null> {
    const column =
      threshold === UsageThreshold.Warn ? usageCounters.warned80At : usageCounters.warned100At;
    const [marked] = await this.txHost.tx
      .update(usageCounters)
      .set(threshold === UsageThreshold.Warn ? { warned80At: at } : { warned100At: at })
      .where(
        and(
          eq(usageCounters.workspaceId, counter.workspaceId),
          eq(usageCounters.id, counter.id),
          isNull(column),
        ),
      )
      .returning();
    return marked ?? null;
  }

  async deleteByWorkspace(workspaceId: string): Promise<void> {
    await this.txHost.tx.delete(usageCounters).where(eq(usageCounters.workspaceId, workspaceId));
  }

  private newCounter(
    key: UsageCounterKey,
    amounts: Partial<Pick<UsageCounter, 'credits' | 'conversations'>>,
  ): typeof usageCounters.$inferInsert {
    return {
      id: key.id,
      workspaceId: key.workspaceId,
      period: key.period,
      credits: amounts.credits ?? NO_USAGE,
      conversations: amounts.conversations ?? NO_USAGE,
      createdAt: key.at,
      updatedAt: key.at,
    };
  }
}
