import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationMode,
  ConversationRunsService,
  ConversationState,
} from '@/modules/conversations';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { runFailureOf } from '@/modules/runs/helpers/run-failure.helpers';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunStart, RunTarget } from '@/modules/runs/typedefs/run-start.typedefs';
import type { NewRun, Run, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class RunLifecycleService {
  constructor(
    private readonly runs: RunsRepository,
    private readonly conversations: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
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
    const runId = this.ids.generate();
    if (!(await this.conversations.claimRun(workspaceId, conversationId, runId))) {
      return null;
    }
    const lastCoveredMessageId = await this.lastUncoveredMessageId(target);
    const versionId = lastCoveredMessageId === null ? null : await resolveVersion();
    if (lastCoveredMessageId === null || versionId === null) {
      await this.conversations.releaseRun(workspaceId, conversationId, runId);
      return null;
    }
    const run: NewRun = {
      id: runId,
      workspaceId,
      conversationId,
      agentId: conversation.agentId,
      versionId,
      mode: target.mode,
      trigger: RunTrigger.Message,
      status: RunStatus.Queued,
      lastCoveredMessageId,
      createdAt: this.clock.now(),
    };
    await this.runs.insert(run);
    await this.jobs.enqueue(ctx, executeRunJob, { runId }, { durable: true, jobId: runId });
    return run;
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
    await this.runs.finish(workspaceId, runId, end);
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

  private async followUpVersionId(run: Run): Promise<string | null> {
    if (run.mode !== ConversationMode.Live) {
      return run.versionId;
    }
    return this.agents.findAnsweringVersionId(run.workspaceId, run.agentId);
  }
}
