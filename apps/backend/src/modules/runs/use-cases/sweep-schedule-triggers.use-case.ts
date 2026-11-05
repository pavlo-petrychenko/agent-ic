import { dueTick } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { ScheduleTriggerDirectoryService } from '@/modules/agents';
import { scheduleTickJobId } from '@/modules/runs/helpers/schedule-tick.helpers';
import { fireScheduleTickJob } from '@/modules/runs/jobs/fire-schedule-tick.job';
import { ScheduleMetricsService } from '@/modules/runs/services/schedule-metrics.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class SweepScheduleTriggersUseCase {
  constructor(
    private readonly directory: ScheduleTriggerDirectoryService,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly metrics: ScheduleMetricsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<void> {
    requireSystemActor(ctx);
    const now = this.clock.now();
    for (const trigger of await this.directory.listLive()) {
      const due = dueTick(trigger.node.config.schedule, { now, notBefore: trigger.publishedAt });
      if (due !== null) {
        await this.jobs.enqueue(
          { ...ctx, workspaceId: trigger.workspaceId },
          fireScheduleTickJob,
          {
            agentId: trigger.agentId,
            versionId: trigger.versionId,
            nodeId: trigger.node.id,
            scheduledFor: due.tick.toISOString(),
            missed: due.missed,
          },
          {
            jobId: scheduleTickJobId(trigger.agentId, trigger.node.id, due.tick),
            detachedTrace: true,
          },
        );
      }
    }
    this.metrics.swept();
  }
}
