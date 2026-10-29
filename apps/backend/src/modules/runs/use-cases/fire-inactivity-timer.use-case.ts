import { Injectable } from '@nestjs/common';
import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { isInactivityTimerDue } from '@/modules/runs/helpers/inactivity-timer.helpers';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { InactivityTimersRepository } from '@/modules/runs/repositories/inactivity-timers.repository';
import { InactivityFiringService } from '@/modules/runs/services/inactivity-firing.service';
import { RunMetricsService } from '@/modules/runs/services/run-metrics.service';
import type { InactivityFire } from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import type { FireInactivityTimerJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class FireInactivityTimerUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly timers: InactivityTimersRepository,
    private readonly firing: InactivityFiringService,
    private readonly metrics: RunMetricsService,
    private readonly afterCommit: AfterCommitService,
    private readonly clock: ClockService,
  ) {}

  execute(ctx: UseCaseCtx, { timerId }: FireInactivityTimerJobData): Promise<InactivityFire> {
    const workspaceId = runWorkspaceOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      const now = this.clock.now();
      const timer = await this.timers.findById(workspaceId, timerId);
      const fired =
        timer === null || !isInactivityTimerDue(timer, now)
          ? { outcome: InactivityFireOutcome.Stale, run: null }
          : await this.firing.fire(ctx, timer, now);
      await this.afterCommit.schedule(() =>
        Promise.resolve(this.metrics.inactivityFired(fired.outcome, timer?.dueAt ?? null, now)),
      );
      return fired;
    });
  }
}
