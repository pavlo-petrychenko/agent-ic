import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationMode,
  ConversationRunsService,
  ConversationState,
} from '@/modules/conversations';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunStart } from '@/modules/runs/typedefs/run-start.typedefs';
import type { NewRun, Run } from '@/modules/runs/typedefs/run.typedefs';
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

  async startRun(ctx: UseCaseCtx, start: RunStart): Promise<NewRun | null> {
    const { workspaceId, conversationId } = start;
    const conversation = await this.conversations.getConversation(workspaceId, conversationId);
    if (conversation.state !== ConversationState.AgentActive) {
      return null;
    }
    const runId = this.ids.generate();
    if (!(await this.conversations.claimRun(workspaceId, conversationId, runId))) {
      return null;
    }
    const lastCoveredMessageId = await this.lastUncoveredMessageId(start);
    if (lastCoveredMessageId === null) {
      await this.conversations.releaseRun(workspaceId, conversationId, runId);
      return null;
    }
    const run: NewRun = {
      id: runId,
      workspaceId,
      conversationId,
      agentId: conversation.agentId,
      versionId: start.versionId,
      mode: start.mode,
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
    return this.startRun(ctx, {
      workspaceId,
      conversationId: run.conversationId,
      versionId: await this.followUpVersionId(run),
      mode: run.mode,
      triggerMessageId: run.lastCoveredMessageId,
    });
  }

  private async lastUncoveredMessageId(start: RunStart): Promise<string | null> {
    const { workspaceId, conversationId, triggerMessageId } = start;
    const latest = await this.runs.findLatestByConversation(workspaceId, conversationId);
    const newer = await this.conversations.messagesAfter(
      workspaceId,
      conversationId,
      latest?.lastCoveredMessageId ?? triggerMessageId,
    );
    return newer.at(-1)?.id ?? (latest === null ? triggerMessageId : null);
  }

  private async followUpVersionId(run: Run): Promise<string> {
    if (run.mode !== ConversationMode.Live) {
      return run.versionId;
    }
    const live = await this.agents.getLiveVersion(run.workspaceId, run.agentId);
    return live?.id ?? run.versionId;
  }
}
