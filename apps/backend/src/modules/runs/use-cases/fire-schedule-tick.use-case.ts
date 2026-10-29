import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import type { LiveScheduleTriggerState } from '@/modules/agents';
import { ScheduleAudienceService } from '@/modules/conversations';
import { RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import {
  SCHEDULED_FOR_INPUT_KEY,
  ScheduleMatchOutcome,
  ScheduleTickOutcome,
} from '@/modules/runs/constants/schedule-tick.constants';
import { runWorkspaceOf } from '@/modules/runs/helpers/run-ctx.helpers';
import { stillSchedules, usesPlatformModel } from '@/modules/runs/helpers/schedule-tick.helpers';
import { ScheduleTicksRepository } from '@/modules/runs/repositories/schedule-ticks.repository';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { ScheduleMetricsService } from '@/modules/runs/services/schedule-metrics.service';
import type {
  FireScheduleTickJobData,
  ScheduleTickMatches,
  ScheduleTickResult,
} from '@/modules/runs/typedefs/schedule-tick.typedefs';
import { UsageLimitsService } from '@/modules/usage';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class FireScheduleTickUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly audience: ScheduleAudienceService,
    private readonly lifecycle: RunLifecycleService,
    private readonly ticks: ScheduleTicksRepository,
    private readonly usage: UsageLimitsService,
    private readonly metrics: ScheduleMetricsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, data: FireScheduleTickJobData): Promise<ScheduleTickResult> {
    const workspaceId = runWorkspaceOf(ctx);
    const scheduledFor = new Date(data.scheduledFor);
    const result = await this.tenants.run(workspaceId, async () => {
      const state = await this.agents.findLiveScheduleTrigger(
        workspaceId,
        data.agentId,
        data.nodeId,
      );
      const outcome = await this.outcomeOf(workspaceId, data, state, scheduledFor);
      const id = this.ids.generate();
      const claimed = await this.ticks.claim({
        id,
        workspaceId,
        agentId: data.agentId,
        versionId: state?.trigger.versionId ?? data.versionId,
        nodeId: data.nodeId,
        scheduledFor,
        outcome,
        matched: 0,
        started: 0,
      });
      if (!claimed) {
        return { outcome: null, matched: 0, started: 0 };
      }
      if (outcome !== ScheduleTickOutcome.Fired || state === null) {
        return { outcome, matched: 0, started: 0 };
      }
      const matches = await this.contact(ctx, workspaceId, state, scheduledFor);
      await this.ticks.recordMatches(workspaceId, id, matches);
      return { outcome, ...matches };
    });
    this.observe(result, scheduledFor);
    return result;
  }

  private async outcomeOf(
    workspaceId: string,
    data: FireScheduleTickJobData,
    state: LiveScheduleTriggerState | null,
    scheduledFor: Date,
  ): Promise<ScheduleTickOutcome> {
    if (data.missed) {
      return ScheduleTickOutcome.SkippedMissed;
    }
    if (state === null || !stillSchedules(state.trigger, scheduledFor)) {
      return ScheduleTickOutcome.SkippedChanged;
    }
    if (state.paused) {
      return ScheduleTickOutcome.SkippedPaused;
    }
    const version = await this.agents.getVersion(workspaceId, state.trigger.versionId);
    if (usesPlatformModel(version.flow) && (await this.usage.creditLimitReached(workspaceId))) {
      return ScheduleTickOutcome.SkippedUsageLimit;
    }
    return ScheduleTickOutcome.Fired;
  }

  private async contact(
    ctx: UseCaseCtx,
    workspaceId: string,
    { trigger }: LiveScheduleTriggerState,
    tick: Date,
  ): Promise<ScheduleTickMatches> {
    const request = { agentId: trigger.agentId, node: trigger.node, tick };
    const candidates = await this.audience.findCandidates(workspaceId, request);
    let started = 0;
    for (const conversation of candidates) {
      const run = await this.lifecycle.startTriggeredRun(ctx, {
        workspaceId,
        conversationId: conversation.id,
        versionId: trigger.versionId,
        trigger: RunTrigger.Schedule,
        triggerNodeId: trigger.node.id,
        triggerInput: { [SCHEDULED_FOR_INPUT_KEY]: tick.toISOString() },
      });
      if (run.outcome === TriggeredRunOutcome.Started) {
        await this.audience.recordContact(workspaceId, {
          ...request,
          conversationId: conversation.id,
        });
        started += 1;
      }
    }
    return { matched: candidates.length, started };
  }

  private observe(result: ScheduleTickResult, scheduledFor: Date): void {
    if (result.outcome === null) {
      return;
    }
    this.metrics.tickHandled(result.outcome, scheduledFor, this.clock.now());
    if (result.outcome === ScheduleTickOutcome.SkippedMissed) {
      this.metrics.tickMissed();
    }
    this.metrics.matched(ScheduleMatchOutcome.Started, result.started);
    this.metrics.matched(ScheduleMatchOutcome.Busy, result.matched - result.started);
  }
}
