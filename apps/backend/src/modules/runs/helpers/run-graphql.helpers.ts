import { RunStatus } from '@/modules/runs/constants/run.constants';
import { toGraphqlRunStepStatus } from '@/modules/runs/helpers/run-step-graphql.helpers';
import type { RunStepView, RunView } from '@/modules/runs/typedefs/run-details.typedefs';
import type { Run, RunStep } from '@/platform/graphql-server/generated/schema.generated';
import { RunStatus as GraphqlRunStatus } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_RUN_STATUS: Readonly<Record<RunStatus, GraphqlRunStatus>> = {
  [RunStatus.Queued]: GraphqlRunStatus.Queued,
  [RunStatus.Running]: GraphqlRunStatus.Running,
  [RunStatus.Succeeded]: GraphqlRunStatus.Succeeded,
  [RunStatus.Failed]: GraphqlRunStatus.Failed,
  [RunStatus.Escalated]: GraphqlRunStatus.Escalated,
};

const toGraphqlRunStep = (step: RunStepView): RunStep => ({
  ...step,
  status: toGraphqlRunStepStatus(step.status),
  startedAt: step.startedAt.toISOString(),
  finishedAt: step.finishedAt?.toISOString() ?? null,
});

export const toGraphqlRun = (run: RunView): Run => ({
  ...run,
  status: GRAPHQL_RUN_STATUS[run.status],
  createdAt: run.createdAt.toISOString(),
  startedAt: run.startedAt?.toISOString() ?? null,
  finishedAt: run.finishedAt?.toISOString() ?? null,
  steps: run.steps.map(toGraphqlRunStep),
});
