import { RunStepStatus } from '@/modules/runs/constants/run.constants';
import type { RunStepUpdate } from '@/modules/runs/typedefs/run-step-update.typedefs';
import type { RunStepEvent } from '@/platform/graphql-server/generated/schema.generated';
import { RunStepStatus as GraphqlRunStepStatus } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_RUN_STEP_STATUS: Readonly<Record<RunStepStatus, GraphqlRunStepStatus>> = {
  [RunStepStatus.Running]: GraphqlRunStepStatus.Running,
  [RunStepStatus.Succeeded]: GraphqlRunStepStatus.Succeeded,
  [RunStepStatus.Failed]: GraphqlRunStepStatus.Failed,
};

export const toGraphqlRunStepEvent = (update: RunStepUpdate): RunStepEvent => ({
  runId: update.runId,
  stepId: update.stepId,
  nodeId: update.nodeId,
  status: GRAPHQL_RUN_STEP_STATUS[update.status],
});
