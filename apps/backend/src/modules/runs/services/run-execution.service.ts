import { IdPrefix } from '@agent-ic/contracts';
import {
  AGENT_MESSAGES_FIELD_NAME,
  AgentExitKind,
  NodeType,
  PortName,
  buildFlowGraph,
  createScopeLookup,
  nodePorts,
} from '@agent-ic/flow';
import type { FlowNode, ParallelNode, TriggerNode } from '@agent-ic/flow';
import { Injectable, Logger } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  ConversationActivityService,
  ConversationMode,
  ConversationHistoryService,
  ConversationRunsService,
} from '@/modules/conversations';
import { PromptFlowReader } from '@/modules/prompts';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import {
  AGENT_EXIT_RUN_STATUS,
  HANDOFF_ON_FAILURE_NODE_TYPES,
} from '@/modules/runs/constants/agent-exit.constants';
import { RunLogMessage } from '@/modules/runs/constants/run-log.constants';
import {
  ROOT_BRANCH_KEY,
  RunStatus,
  RunStepStatus,
  RunTrigger,
  UNFINISHED_RUN_STATUSES,
} from '@/modules/runs/constants/run.constants';
import { RunFlowInvalidError } from '@/modules/runs/errors/run-flow-invalid.error';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { UnsupportedNodeTypeError } from '@/modules/runs/errors/unsupported-node-type.error';
import {
  inactivityTriggerInputOf,
  inactivityTriggerVariables,
} from '@/modules/runs/helpers/inactivity-trigger.helpers';
import { listTexts, templateTexts } from '@/modules/runs/helpers/outbound-message.helpers';
import {
  joinBranches,
  parallelBranches,
  settleBranch,
} from '@/modules/runs/helpers/run-branch.helpers';
import { runFailureOf } from '@/modules/runs/helpers/run-failure.helpers';
import {
  defaultExitOf,
  endStatusOf,
  nextNode,
  triggerNodeOf,
} from '@/modules/runs/helpers/run-flow.helpers';
import {
  messageTriggerVariables,
  scheduleTriggerVariables,
  stepInput,
  stepVariables,
} from '@/modules/runs/helpers/run-scope.helpers';
import { runTraceTags, stepTraceMetadata } from '@/modules/runs/helpers/run-tracing.helpers';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { ConversationExitService } from '@/modules/runs/services/conversation-exit.service';
import { RunMetricsService } from '@/modules/runs/services/run-metrics.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { InactivityScopeSource } from '@/modules/runs/typedefs/inactivity-trigger.typedefs';
import type { BranchSettlement } from '@/modules/runs/typedefs/run-branch.typedefs';
import type { RunWalk, TriggerVariables } from '@/modules/runs/typedefs/run-execution.typedefs';
import type { RunStep, RunStepResult, StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
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
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { LogContextField } from '@/platform/observability/constants/logger.constants';
import { LogContextService } from '@/platform/observability/services/log-context.service';
import type { JobAttempt } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class RunExecutionService {
  private readonly logger = new Logger(RunExecutionService.name);

  constructor(
    private readonly runs: RunsRepository,
    private readonly steps: RunStepsRepository,
    private readonly executors: StepExecutorRegistry,
    private readonly agents: AgentRuntimeReader,
    private readonly prompts: PromptFlowReader,
    private readonly conversations: ConversationRunsService,
    private readonly conversationHistory: ConversationHistoryService,
    private readonly activity: ConversationActivityService,
    private readonly tenants: TenantTransactionService,
    private readonly liveUpdates: LiveUpdatesService,
    private readonly traces: LlmTraceContextService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
    private readonly logContext: LogContextService,
    private readonly metrics: RunMetricsService,
    private readonly exits: ConversationExitService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    workspaceId: string,
    runId: string,
    attempt: JobAttempt,
  ): Promise<RunStatus> {
    const walk = await this.tenants.run(workspaceId, () =>
      this.load(ctx, workspaceId, runId, attempt),
    );
    if (!UNFINISHED_RUN_STATUSES.includes(walk.run.status)) {
      return walk.run.status;
    }
    this.logContext.assign({
      [LogContextField.WorkspaceId]: workspaceId,
      [LogContextField.RunId]: runId,
      [LogContextField.ConversationId]: walk.run.conversationId,
    });
    this.logger.log({ msg: RunLogMessage.Started, mode: walk.run.mode });
    return this.traces.run(runTraceTags(walk.run), async (traceId) => {
      await this.tenants.run(workspaceId, () => this.runs.setTraceId(workspaceId, runId, traceId));
      const walked = await this.walk(walk);
      const end = walked.status === RunStatus.Failed ? walked : (walk.ending ?? walked);
      await this.tenants.run(workspaceId, async () => {
        if (await this.runs.finish(workspaceId, runId, end)) {
          await this.activity.runFinished(walk.run.conversationId, runId);
          this.metrics.runFinished(
            walk.run,
            end.status,
            walk.run.startedAt ?? walk.today,
            end.finishedAt,
          );
        }
      });
      this.logger.log({ msg: RunLogMessage.Finished, status: end.status });
      return end.status;
    });
  }

  private async load(
    ctx: UseCaseCtx,
    workspaceId: string,
    runId: string,
    attempt: JobAttempt,
  ): Promise<RunWalk> {
    const run = await this.runs.findById(workspaceId, runId);
    if (run === null) {
      throw new RunNotFoundError(runId);
    }
    const today = this.clock.now();
    if (await this.runs.markRunning(workspaceId, runId, today)) {
      await this.activity.runStarted(run.conversationId, runId);
      this.metrics.runStarted(run, today);
    }
    if (run.mode === ConversationMode.Live) {
      await this.agents.getAgent(workspaceId, run.agentId);
    }
    const version = await this.agents.getVersion(workspaceId, run.versionId);
    const prompts = await this.prompts.forFlow(workspaceId, version.flow);
    const conversation = await this.conversations.getConversation(workspaceId, run.conversationId);
    const history = await this.conversationHistory.forRun(
      workspaceId,
      run.conversationId,
      run.lastCoveredMessageId,
    );
    const finished = (await this.steps.listByRun(workspaceId, runId)).filter(
      (step) => step.status !== RunStepStatus.Running,
    );
    return {
      ctx,
      finalAttempt: attempt.final,
      run,
      flow: version.flow,
      graph: buildFlowGraph(version.flow),
      lookup: createScopeLookup(version.flow),
      trigger: this.triggerVariables(triggerNodeOf(version.flow, run), run, {
        conversation,
        history,
        today,
      }),
      history,
      today,
      prompts,
      steps: new Map(finished.map((step) => [step.nodeId, step])),
      background: [],
      ending: null,
    };
  }

  private triggerVariables(
    node: TriggerNode | null,
    run: Run,
    { conversation, history, today }: Omit<InactivityScopeSource, 'conversationId' | 'input'>,
  ): TriggerVariables {
    if (run.trigger === RunTrigger.Schedule) {
      return scheduleTriggerVariables(
        conversation,
        this.ids.toPublic(IdPrefix.Conversation, run.conversationId),
        history,
        today,
      );
    }
    if (node?.type !== NodeType.TriggerInactivity) {
      return messageTriggerVariables(conversation, history, today);
    }
    return inactivityTriggerVariables(node, {
      conversation,
      conversationId: this.ids.toPublic(IdPrefix.Conversation, run.conversationId),
      history,
      today,
      input: inactivityTriggerInputOf(run.triggerInput),
    });
  }

  private async walk(walk: RunWalk): Promise<RunEnd> {
    const trigger = triggerNodeOf(walk.flow, walk.run);
    if (trigger === null) {
      return this.failed(new RunFlowInvalidError(walk.run.versionId, null), null);
    }
    try {
      return await this.walkFrom(walk, trigger, ROOT_BRANCH_KEY, false);
    } finally {
      await this.drain(walk);
    }
  }

  private async walkFrom(
    walk: RunWalk,
    start: FlowNode,
    branchKey: string,
    background: boolean,
  ): Promise<RunEnd> {
    const visited = new Set<string>();
    let node: FlowNode | null = start;
    while (node !== null) {
      if (walk.ending !== null) {
        return walk.ending;
      }
      if (visited.has(node.id)) {
        return this.failed(new RunFlowInvalidError(walk.run.versionId, node.id), node.id);
      }
      visited.add(node.id);
      const executor = this.executors.find(node);
      if (executor === null) {
        return this.failed(new UnsupportedNodeTypeError(node.id, node.type), node.id);
      }
      const failedBranch =
        node.type === NodeType.Parallel ? await this.fork(walk, node, background) : null;
      if (failedBranch !== null) {
        return failedBranch;
      }
      const step = walk.steps.get(node.id) ?? (await this.runStep(walk, node, executor, branchKey));
      if (step.status === RunStepStatus.Succeeded && node.type === NodeType.Escalation) {
        walk.ending ??= { status: endStatusOf(node), error: null, finishedAt: this.clock.now() };
        return walk.ending;
      }
      const exit =
        step.status === RunStepStatus.Succeeded ? defaultExitOf(walk.flow, node, step.port) : null;
      if (exit !== null) {
        return this.defaultExit(walk, node, step, exit);
      }
      if (step.port === null) {
        return step.status === RunStepStatus.Failed
          ? this.unhandledFailure(walk, node, step, background)
          : this.succeeded();
      }
      node = nextNode(walk.flow, node.id, step.port);
    }
    return this.succeeded();
  }

  private async defaultExit(
    walk: RunWalk,
    node: FlowNode,
    step: RunStep,
    exit: AgentExitKind,
  ): Promise<RunEnd> {
    if (walk.ending !== null) {
      return walk.ending;
    }
    walk.ending = {
      status: AGENT_EXIT_RUN_STATUS[exit],
      error: null,
      finishedAt: this.clock.now(),
    };
    const { ctx, run } = walk;
    const target = {
      ctx,
      run,
      nodeId: node.id,
      texts: listTexts(step.output?.[AGENT_MESSAGES_FIELD_NAME]),
    };
    await this.tenants.run(run.workspaceId, () =>
      exit === AgentExitKind.End ? this.exits.end(target) : this.exits.handOff(target),
    );
    return walk.ending;
  }

  private async unhandledFailure(
    walk: RunWalk,
    node: FlowNode,
    step: RunStep,
    background: boolean,
  ): Promise<RunEnd> {
    const failed: RunEnd = {
      status: RunStatus.Failed,
      error: step.error,
      finishedAt: this.clock.now(),
    };
    const settings = walk.flow.settings.onUnhandledFailure;
    if (background || settings === null || !HANDOFF_ON_FAILURE_NODE_TYPES.includes(node.type)) {
      return failed;
    }
    if (walk.ending !== null) {
      return walk.ending;
    }
    walk.ending = failed;
    const { ctx, run } = walk;
    const texts = templateTexts(settings.customerMessage, stepVariables(walk, node.id));
    await this.tenants.run(run.workspaceId, () =>
      this.exits.handOff({ ctx, run, nodeId: node.id, texts }),
    );
    return failed;
  }

  private async fork(
    walk: RunWalk,
    parallel: ParallelNode,
    background: boolean,
  ): Promise<RunEnd | null> {
    const branches = parallelBranches(walk.graph, parallel).map((branch) => ({
      ...branch,
      settled: settleBranch(
        this.walkFrom(walk, branch.start, branch.key, background || branch.background),
      ),
    }));
    walk.background.push(...branches.map((branch) => branch.settled));
    const joined = await joinBranches(parallel.config.waitFor, branches);
    return this.endsOf(joined).find((end) => end.status !== RunStatus.Succeeded) ?? walk.ending;
  }

  private async drain(walk: RunWalk): Promise<void> {
    while (walk.background.length > 0) {
      this.endsOf(await Promise.all(walk.background.splice(0)));
    }
  }

  private endsOf(settlements: readonly BranchSettlement[]): RunEnd[] {
    return settlements.map((settlement) => {
      if (!settlement.ok) {
        throw settlement.error;
      }
      return settlement.end;
    });
  }

  private async runStep(
    walk: RunWalk,
    node: FlowNode,
    executor: StepExecutor,
    branchKey: string,
  ): Promise<RunStep> {
    const { workspaceId, id: runId } = walk.run;
    const variables = stepVariables(walk, node.id);
    const started = await this.tenants.run(workspaceId, async () => {
      const created = await this.steps.start({
        id: this.ids.generate(),
        workspaceId,
        runId,
        nodeId: node.id,
        nodeKey: node.key,
        branchKey,
        input: stepInput(variables),
        startedAt: this.clock.now(),
      });
      if (created !== null) {
        await this.publishStep(created);
      }
      return created;
    });
    if (started === null) {
      return this.reloadStep(walk, node, branchKey);
    }
    const result = await this.outcome(walk, node, executor, variables, branchKey);
    const step = { ...started, ...result };
    await this.tenants.run(workspaceId, async () => {
      if (await this.steps.finish(workspaceId, started.id, result)) {
        this.metrics.stepFinished(node.type, result.status, started.startedAt, result.finishedAt);
        await this.publishStep(step);
      }
    });
    walk.steps.set(node.id, step);
    return step;
  }

  private async outcome(
    walk: RunWalk,
    node: FlowNode,
    executor: StepExecutor,
    variables: StepData,
    branchKey: string,
  ): Promise<RunStepResult> {
    try {
      const { port, output } = await this.traces.span(
        node.key,
        stepTraceMetadata(node, branchKey),
        () =>
          executor.execute({
            ctx: walk.ctx,
            run: walk.run,
            node,
            branchKey: branchKey,
            scope: {
              variables,
              history: walk.history,
              today: walk.today,
              prompts: walk.prompts,
            },
          }),
      );
      return {
        status: RunStepStatus.Succeeded,
        output,
        port,
        error: null,
        finishedAt: this.clock.now(),
      };
    } catch (error) {
      if (!walk.finalAttempt && jobFailureActionFor(error) === JobFailureAction.Retry) {
        throw error;
      }
      this.logger.warn({
        msg: RunLogMessage.StepFailed,
        nodeId: node.id,
        nodeType: node.type,
        branchKey,
        err: error,
      });
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

  private publishStep(step: RunStep): Promise<void> {
    return this.liveUpdates.publish(channelFor(runStepsChannel, step.runId), {
      runId: step.runId,
      stepId: step.id,
      nodeId: step.nodeId,
      branchKey: step.branchKey,
      status: step.status,
      port: step.port,
    });
  }

  private async reloadStep(walk: RunWalk, node: FlowNode, branchKey: string): Promise<RunStep> {
    const { workspaceId, id: runId } = walk.run;
    const steps = await this.tenants.run(workspaceId, () =>
      this.steps.listByRun(workspaceId, runId),
    );
    const step = steps.find(
      (candidate) => candidate.nodeId === node.id && candidate.branchKey === branchKey,
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
