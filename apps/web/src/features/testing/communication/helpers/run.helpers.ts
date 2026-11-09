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
  steps: steps.map(
    ({ id: stepId, nodeId, status: stepStatus, input, output, error: failure, toolCalls }) => ({
      id: stepId,
      nodeId,
      status: stepStatus,
      input,
      output: output ?? null,
      errorMessage: failure?.message ?? null,
      toolCalls: toolCalls.map((call) => ({
        name: call.name,
        status: call.status,
        input: call.input ?? null,
        inputTruncated: call.inputTruncated,
        output: call.output ?? null,
        outputTruncated: call.outputTruncated,
        error: call.error ?? null,
        durationMs: call.durationMs ?? null,
      })),
    }),
  ),
});
