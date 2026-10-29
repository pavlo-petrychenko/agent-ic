import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { scheduleTicks } from '@/modules/runs/db/schedule-ticks.table';
import type {
  NewScheduleTick,
  ScheduleTickMatches,
} from '@/modules/runs/typedefs/schedule-tick.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ScheduleTicksRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async claim(tick: NewScheduleTick): Promise<boolean> {
    const now = this.clock.now();
    const claimed = await this.txHost.tx
      .insert(scheduleTicks)
      .values({ ...tick, createdAt: now, updatedAt: now })
      .onConflictDoNothing()
      .returning({ id: scheduleTicks.id });
    return claimed.length > 0;
  }

  async recordMatches(
    workspaceId: string,
    id: string,
    matches: ScheduleTickMatches,
  ): Promise<void> {
    await this.txHost.tx
      .update(scheduleTicks)
      .set({ ...matches, updatedAt: this.clock.now() })
      .where(and(eq(scheduleTicks.workspaceId, workspaceId), eq(scheduleTicks.id, id)));
  }
}
