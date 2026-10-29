import { Injectable } from '@nestjs/common';
import { and, asc, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { inactivityTimers } from '@/modules/runs/db/inactivity-timers.table';
import type {
  ClaimedInactivityTimer,
  InactivityClaim,
} from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class InactivitySweepRepository {
  constructor(
    private readonly systemDb: SystemDatabaseService,
    private readonly clock: ClockService,
  ) {}

  claimDue(claim: InactivityClaim): Promise<ClaimedInactivityTimer[]> {
    const { db } = this.systemDb;
    const due = and(
      lte(inactivityTimers.dueAt, claim.now),
      or(isNull(inactivityTimers.leaseUntil), lte(inactivityTimers.leaseUntil, claim.now)),
    );
    const ranked = db.$with('ranked').as(
      db
        .select({
          id: inactivityTimers.id,
          dueAt: inactivityTimers.dueAt,
          rank: sql<number>`row_number() over (partition by ${inactivityTimers.workspaceId} order by ${inactivityTimers.dueAt}, ${inactivityTimers.id})`.as(
            'rank',
          ),
        })
        .from(inactivityTimers)
        .where(due),
    );
    const chosen = db
      .with(ranked)
      .select({ id: ranked.id })
      .from(ranked)
      .where(lte(ranked.rank, claim.perWorkspace))
      .orderBy(asc(ranked.dueAt))
      .limit(claim.limit);
    const locked = db
      .select({ id: inactivityTimers.id })
      .from(inactivityTimers)
      .where(and(inArray(inactivityTimers.id, chosen), due))
      .for('update', { skipLocked: true });
    return db
      .update(inactivityTimers)
      .set({ leaseUntil: claim.leaseUntil, updatedAt: this.clock.now() })
      .where(inArray(inactivityTimers.id, locked))
      .returning({
        id: inactivityTimers.id,
        workspaceId: inactivityTimers.workspaceId,
        dueAt: inactivityTimers.dueAt,
      });
  }
}
