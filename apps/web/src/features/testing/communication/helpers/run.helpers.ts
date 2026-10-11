import type { TestingRunQuery } from '@/features/testing/communication/gql/query/testingRun.generated';
import type { RunDetails } from '@/features/testing/typedefs/trace.typedefs';

export const toRunDetails = ({
  id,
  status,
  durationMs,
  error,
  totals,
  steps,
}: TestingRunQuery['run']): RunDetails => ({
  id,
  status,
  durationMs,
  failedNodeId: error?.nodeId ?? null,
  totals,
  steps: steps.map(({ id: stepId, nodeId, status: stepStatus, output, error: failure }) => ({
    id: stepId,
    nodeId,
    status: stepStatus,
    output: output ?? null,
    errorMessage: failure?.message ?? null,
  })),
});
