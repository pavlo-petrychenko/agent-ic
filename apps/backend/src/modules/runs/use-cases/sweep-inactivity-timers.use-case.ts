import { Injectable } from '@nestjs/common';
import {
  INACTIVITY_LEASE_SECONDS,
  INACTIVITY_SWEEP_LIMIT,
  INACTIVITY_SWEEP_WORKSPACE_LIMIT,
} from '@/modules/runs/constants/inactivity.constants';
import { fireInactivityTimerJob } from '@/modules/runs/jobs/fire-inactivity-timer.job';
import { InactivitySweepRepository } from '@/modules/runs/repositories/inactivity-sweep.repository';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class SweepInactivityTimersUseCase {
  constructor(
    private readonly sweep: InactivitySweepRepository,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<number> {
    requireSystemActor(ctx);
    const now = this.clock.now();
    const claimed = await this.sweep.claimDue({
      now,
      leaseUntil: new Date(now.getTime() + INACTIVITY_LEASE_SECONDS * MILLISECONDS_PER_SECOND),
      limit: INACTIVITY_SWEEP_LIMIT,
      perWorkspace: INACTIVITY_SWEEP_WORKSPACE_LIMIT,
    });
    for (const timer of claimed) {
      await this.jobs.enqueue({ ...ctx, workspaceId: timer.workspaceId }, fireInactivityTimerJob, {
        timerId: timer.id,
      });
    }
    return claimed.length;
  }
}
