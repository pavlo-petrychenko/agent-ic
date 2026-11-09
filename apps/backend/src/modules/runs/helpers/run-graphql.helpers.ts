import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { RunToolCallStatus } from '@/modules/runs/constants/tool-call.constants';
import { toGraphqlRunStepStatus } from '@/modules/runs/helpers/run-step-graphql.helpers';
import type {
  RunStepView,
  RunView,
  SimulationRunSummary,
} from '@/modules/runs/typedefs/run-details.typedefs';
import type { RunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import type { RunToolCall } from '@/modules/runs/typedefs/tool-call.typedefs';
import type {
  RunStep,
  RunToolCall as GraphqlRunToolCall,
  SimulationRunSummary as GraphqlSimulationRunSummary,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  RunStatus as GraphqlRunStatus,
  RunToolCallStatus as GraphqlRunToolCallStatus,
  RunTrigger as GraphqlRunTrigger,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_RUN_STATUS: Readonly<Record<RunStatus, GraphqlRunStatus>> = {
  [RunStatus.Queued]: GraphqlRunStatus.Queued,
  [RunStatus.Running]: GraphqlRunStatus.Running,
  [RunStatus.Succeeded]: GraphqlRunStatus.Succeeded,
  [RunStatus.Failed]: GraphqlRunStatus.Failed,
  [RunStatus.Escalated]: GraphqlRunStatus.Escalated,
};

const GRAPHQL_RUN_TRIGGER: Readonly<Record<RunTrigger, GraphqlRunTrigger>> = {
  [RunTrigger.Message]: GraphqlRunTrigger.Message,
  [RunTrigger.Schedule]: GraphqlRunTrigger.Schedule,
  [RunTrigger.Inactivity]: GraphqlRunTrigger.Inactivity,
};

const GRAPHQL_RUN_TOOL_CALL_STATUS: Readonly<Record<RunToolCallStatus, GraphqlRunToolCallStatus>> =
  {
    [RunToolCallStatus.Ok]: GraphqlRunToolCallStatus.Ok,
    [RunToolCallStatus.Error]: GraphqlRunToolCallStatus.Error,
  };

export const toGraphqlRunToolCall = (call: RunToolCall): GraphqlRunToolCall => ({
  ...call,
  status: GRAPHQL_RUN_TOOL_CALL_STATUS[call.status],
});

export const toGraphqlRunStep = (step: RunStepView): RunStep => ({
  ...step,
  status: toGraphqlRunStepStatus(step.status),
  toolCalls: (step.toolCalls ?? []).map(toGraphqlRunToolCall),
  startedAt: step.startedAt.toISOString(),
  finishedAt: step.finishedAt?.toISOString() ?? null,
});

export const toGraphqlRun = (run: RunView): RunParent => ({
  ...run,
  trigger: GRAPHQL_RUN_TRIGGER[run.trigger],
  status: GRAPHQL_RUN_STATUS[run.status],
  createdAt: run.createdAt.toISOString(),
  startedAt: run.startedAt?.toISOString() ?? null,
  finishedAt: run.finishedAt?.toISOString() ?? null,
});

export const toGraphqlSimulationRunSummary = (
  summary: SimulationRunSummary,
): GraphqlSimulationRunSummary => ({
  ...summary,
  status: GRAPHQL_RUN_STATUS[summary.status],
  finishedAt: summary.finishedAt?.toISOString() ?? null,
});
