import { PortName, createScopeLookup, nodePorts } from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationHistoryService, ConversationRunsService } from '@/modules/conversations';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import {
  ROOT_BRANCH_KEY,
  RunStatus,
  RunStepStatus,
  UNFINISHED_RUN_STATUSES,
} from '@/modules/runs/constants/run.constants';
import { RunFlowInvalidError } from '@/modules/runs/errors/run-flow-invalid.error';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { UnsupportedNodeTypeError } from '@/modules/runs/errors/unsupported-node-type.error';
import { runFailureOf } from '@/modules/runs/helpers/run-failure.helpers';
import { messageTriggerOf, nextNode } from '@/modules/runs/helpers/run-flow.helpers';
import { messageTriggerVariables, stepVariables } from '@/modules/runs/helpers/run-scope.helpers';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { RunWalk } from '@/modules/runs/typedefs/run-execution.typedefs';
import type { RunStep, RunStepResult } from '@/modules/runs/typedefs/run-step.typedefs';
import type { RunEnd } from '@/modules/runs/typedefs/run.typedefs';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { IdService } from '@/platform/ids/services/id.service';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';

@Injectable()
export class RunExecutionService {
  constructor(
    private readonly runs: RunsRepository,
    private readonly steps: RunStepsRepository,
    private readonly executors: StepExecutorRegistry,
    private readonly agents: AgentRuntimeReader,
    private readonly conversations: ConversationRunsService,
    private readonly conversationHistory: ConversationHistoryService,
    private readonly tenants: TenantTransactionService,
    private readonly liveUpdates: LiveUpdatesService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, workspaceId: string, runId: string): Promise<RunStatus> {
    const walk = await this.tenants.run(workspaceId, () => this.load(ctx, workspaceId, runId));
    if (!UNFINISHED_RUN_STATUSES.includes(walk.run.status)) {
      return walk.run.status;
    }
    const end = await this.walk(walk);
    await this.tenants.run(workspaceId, () => this.runs.finish(workspaceId, runId, end));
    return end.status;
  }

  private async load(ctx: UseCaseCtx, workspaceId: string, runId: string): Promise<RunWalk> {
    const run = await this.runs.findById(workspaceId, runId);
    if (run === null) {
      throw new RunNotFoundError(runId);
    }
    const today = this.clock.now();
    await this.runs.markRunning(workspaceId, runId, today);
    const version = await this.agents.getVersion(workspaceId, run.versionId);
    const conversation = await this.conversations.getConversation(workspaceId, run.conversationId);
    const history = await this.conversationHistory.forRun(
      workspaceId,
      run.conversationId,
      run.lastCoveredMessageId,
    );
    const finished = (await this.steps.listByRun(workspaceId, runId)).filter(
      (step) => step.branchKey === ROOT_BRANCH_KEY && step.status !== RunStepStatus.Running,
    );
    return {
      ctx,
      run,
      flow: version.flow,
      lookup: createScopeLookup(version.flow),
      trigger: messageTriggerVariables(conversation, history, today),
      history,
      today,
      steps: new Map(finished.map((step) => [step.nodeId, step])),
    };
  }

  private async walk(walk: RunWalk): Promise<RunEnd> {
    const visited = new Set<string>();
    let node = messageTriggerOf(walk.flow);
    while (node !== null) {
      if (visited.has(node.id)) {
        return this.failed(new RunFlowInvalidError(walk.run.versionId, node.id), node.id);
      }
      visited.add(node.id);
      const executor = this.executors.find(node);
      if (executor === null) {
        return this.failed(new UnsupportedNodeTypeError(node.id, node.type), node.id);
      }
      const step = walk.steps.get(node.id) ?? (await this.runStep(walk, node, executor));
      if (step.port === null) {
        return step.status === RunStepStatus.Failed
          ? { status: RunStatus.Failed, error: step.error, finishedAt: this.clock.now() }
          : this.succeeded();
      }
      node = nextNode(walk.flow, node.id, step.port);
    }
    return visited.size === 0
      ? this.failed(new RunFlowInvalidError(walk.run.versionId, null), null)
      : this.succeeded();
  }

  private async runStep(walk: RunWalk, node: FlowNode, executor: StepExecutor): Promise<RunStep> {
    const { workspaceId, id: runId } = walk.run;
    const variables = stepVariables(walk, node.id);
    const started = await this.tenants.run(workspaceId, () =>
      this.steps.start({
        id: this.ids.generate(),
        workspaceId,
        runId,
        nodeId: node.id,
        nodeKey: node.key,
        branchKey: ROOT_BRANCH_KEY,
        input: variables,
        startedAt: this.clock.now(),
      }),
    );
    if (started === null) {
      return this.reloadStep(walk, node);
    }
    const result = await this.outcome(walk, node, executor, variables);
    await this.tenants.run(workspaceId, async () => {
      if (await this.steps.finish(workspaceId, started.id, result)) {
        await this.liveUpdates.publish(channelFor(runStepsChannel, runId), {
          runId,
          stepId: started.id,
          nodeId: node.id,
          branchKey: started.branchKey,
          status: result.status,
          port: result.port,
        });
      }
    });
    const step = { ...started, ...result };
    walk.steps.set(node.id, step);
    return step;
  }

  private async outcome(
    walk: RunWalk,
    node: FlowNode,
    executor: StepExecutor,
    variables: RunStep['input'],
  ): Promise<RunStepResult> {
    try {
      const { port, output } = await executor.execute({
        ctx: walk.ctx,
        run: walk.run,
        node,
        branchKey: ROOT_BRANCH_KEY,
        scope: { variables, history: walk.history, today: walk.today },
      });
      return {
        status: RunStepStatus.Succeeded,
        output,
        port,
        error: null,
        finishedAt: this.clock.now(),
      };
    } catch (error) {
      if (
        !(error instanceof DomainError) ||
        jobFailureActionFor(error) === JobFailureAction.Retry
      ) {
        throw error;
      }
      const errorPort =
        nodePorts(node).includes(PortName.Error) &&
        nextNode(walk.flow, node.id, PortName.Error) !== null;
      return {
        status: RunStepStatus.Failed,
        output: null,
        port: errorPort ? PortName.Error : null,
        error: runFailureOf(error, node.id),
        finishedAt: this.clock.now(),
      };
    }
  }

  private async reloadStep(walk: RunWalk, node: FlowNode): Promise<RunStep> {
    const { workspaceId, id: runId } = walk.run;
    const steps = await this.tenants.run(workspaceId, () =>
      this.steps.listByRun(workspaceId, runId),
    );
    const step = steps.find(
      (candidate) => candidate.nodeId === node.id && candidate.branchKey === ROOT_BRANCH_KEY,
    );
    if (step === undefined) {
      throw new RunNotFoundError(runId);
    }
    walk.steps.set(node.id, step);
    return step;
  }

  private failed(error: DomainError, nodeId: string | null): RunEnd {
    return {
      status: RunStatus.Failed,
      error: runFailureOf(error, nodeId),
      finishedAt: this.clock.now(),
    };
  }

  private succeeded(): RunEnd {
    return { status: RunStatus.Succeeded, error: null, finishedAt: this.clock.now() };
  }
}
