import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationActivityService,
  ConversationMode,
  ConversationRunsService,
  ConversationState,
} from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import { RunStatus, RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { runFailureOf } from '@/modules/runs/helpers/run-failure.helpers';
import { executeProactiveRunJob } from '@/modules/runs/jobs/execute-proactive-run.job';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunMetricsService } from '@/modules/runs/services/run-metrics.service';
import type { ExecuteRunJobData } from '@/modules/runs/typedefs/run-job.typedefs';
import type {
  RunStart,
  RunTarget,
  TriggeredRun,
  TriggeredRunStart,
} from '@/modules/runs/typedefs/run-start.typedefs';
import type { NewRun, Run, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';
import type { JobDefinition, JobEnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class RunLifecycleService {
  constructor(
    private readonly runs: RunsRepository,
    private readonly conversations: ConversationRunsService,
    private readonly activity: ConversationActivityService,
    private readonly agents: AgentRuntimeReader,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
    private readonly metrics: RunMetricsService,
    private readonly afterCommit: AfterCommitService,
  ) {}

  startRun(ctx: UseCaseCtx, start: RunStart): Promise<NewRun | null> {
    return this.startCovering(ctx, start, () => Promise.resolve(start.versionId));
  }

  private async startCovering(
    ctx: UseCaseCtx,
    target: RunTarget,
    resolveVersion: () => Promise<string | null>,
  ): Promise<NewRun | null> {
    const { workspaceId, conversationId } = target;
    const conversation = await this.conversations.getConversation(workspaceId, conversationId);
    if (conversation.state !== ConversationState.AgentActive) {
      return null;
    }
    if (!(await this.conversations.lockIdleConversation(workspaceId, conversationId))) {
      return null;
    }
    const lastCoveredMessageId = await this.lastUncoveredMessageId(target);
    const versionId = lastCoveredMessageId === null ? null : await resolveVersion();
    if (lastCoveredMessageId === null || versionId === null) {
      return null;
    }
    const run: NewRun = {
      id: this.ids.generate(),
      workspaceId,
      conversationId,
      agentId: conversation.agentId,
      versionId,
      mode: target.mode,
      trigger: RunTrigger.Message,
      status: RunStatus.Queued,
      lastCoveredMessageId,
    };
    await this.queue(ctx, run, executeRunJob, {});
    return run;
  }

  async startTriggeredRun(ctx: UseCaseCtx, start: TriggeredRunStart): Promise<TriggeredRun> {
    const { workspaceId, conversationId } = start;
    const conversation = await this.conversations.getConversation(workspaceId, conversationId);
    if (
      conversation.state !== ConversationState.AgentActive ||
      !(await this.conversations.lockIdleConversation(workspaceId, conversationId))
    ) {
      return { outcome: TriggeredRunOutcome.Busy };
    }
    const latest = await this.latestMessageWhenCovered(workspaceId, conversationId);
    if (latest === null) {
      return { outcome: TriggeredRunOutcome.Busy };
    }
    const run: NewRun = {
      id: this.ids.generate(),
      workspaceId,
      conversationId,
      agentId: conversation.agentId,
      versionId: start.versionId,
      mode: conversation.mode,
      trigger: start.trigger,
      triggerNodeId: start.triggerNodeId,
      triggerInput: start.triggerInput,
      status: RunStatus.Queued,
      lastCoveredMessageId: latest.id,
    };
    await this.queue(ctx, run, executeProactiveRunJob, { detachedTrace: true });
    return { outcome: TriggeredRunOutcome.Started, run };
  }

  private async queue(
    ctx: UseCaseCtx,
    run: NewRun,
    job: JobDefinition<ExecuteRunJobData>,
    options: JobEnqueueOptions,
  ): Promise<void> {
    await this.runs.insert(run);
    await this.conversations.claimRun(run.workspaceId, run.conversationId, run.id);
    await this.jobs.enqueue(
      ctx,
      job,
      { runId: run.id },
      { ...options, durable: true, jobId: run.id },
    );
    await this.afterCommit.schedule(() => Promise.resolve(this.metrics.runCreated(run)));
  }

  async endRun(ctx: UseCaseCtx, workspaceId: string, runId: string): Promise<NewRun | null> {
    const run = await this.runs.findById(workspaceId, runId);
    if (run === null) {
      throw new RunNotFoundError(runId);
    }
    if (!(await this.conversations.releaseRun(workspaceId, run.conversationId, run.id))) {
      return null;
    }
    const target = { ...run, triggerMessageId: run.lastCoveredMessageId };
    return this.startCovering(ctx, target, () => this.followUpVersionId(run));
  }

  async failRun(workspaceId: string, runId: string, error: unknown): Promise<void> {
    const failure = runFailureOf(error, null);
    const end: RunEnd = { status: RunStatus.Failed, error: failure, finishedAt: this.clock.now() };
    const run = await this.runs.findById(workspaceId, runId);
    if (run !== null && (await this.runs.finish(workspaceId, runId, end))) {
      await this.activity.runFinished(run.conversationId, runId);
      this.metrics.runFinished(run, end.status, run.startedAt, end.finishedAt);
    }
  }

  private async lastUncoveredMessageId(target: RunTarget): Promise<string | null> {
    const { workspaceId, conversationId, triggerMessageId } = target;
    const latest = await this.runs.findLatestByConversation(workspaceId, conversationId);
    const newer = await this.conversations.messagesAfter(
      workspaceId,
      conversationId,
      latest?.lastCoveredMessageId ?? triggerMessageId,
    );
    return newer.at(-1)?.id ?? (latest === null ? triggerMessageId : null);
  }

  private async latestMessageWhenCovered(
    workspaceId: string,
    conversationId: string,
  ): Promise<Message | null> {
    const latest = await this.runs.findLatestByConversation(workspaceId, conversationId);
    if (latest === null) {
      return null;
    }
    const uncovered = await this.conversations.messagesAfter(
      workspaceId,
      conversationId,
      latest.lastCoveredMessageId,
    );
    return uncovered.length > 0
      ? null
      : this.conversations.latestMessage(workspaceId, conversationId);
  }

  private async followUpVersionId(run: Run): Promise<string | null> {
    if (run.mode !== ConversationMode.Live) {
      return run.versionId;
    }
    return this.agents.findAnsweringVersionId(run.workspaceId, run.agentId);
  }
}
