import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { useEffect, useMemo, useRef } from 'react';
import { TestingRunDocument } from '@/features/testing/communication/gql/query/testingRun.generated';
import { RunStepsDocument } from '@/features/testing/communication/gql/subscription/runSteps.generated';
import { toRunDetails } from '@/features/testing/communication/helpers/run.helpers';
import type { TestingRunResult } from '@/features/testing/typedefs/trace.typedefs';
import type { RunStatus } from '@/shared/api/generated/schema.generated';

export function useTestingRun(runId: string | null, status: RunStatus | null): TestingRunResult {
  const { data, dataState, error, refetch } = useQuery(
    TestingRunDocument,
    runId === null ? skipToken : { variables: { id: runId }, fetchPolicy: 'network-only' },
  );
  const seen = useRef({ runId, status });

  useSubscription(
    RunStepsDocument,
    runId === null ? skipToken : { variables: { runId }, onData: () => void refetch() },
  );

  useEffect(() => {
    const previous = seen.current;
    seen.current = { runId, status };
    if (runId !== null && previous.runId === runId && previous.status !== status) {
      void refetch();
    }
  }, [refetch, runId, status]);

  const run = useMemo(
    () => (runId !== null && dataState === 'complete' ? toRunDetails(data.run) : null),
    [runId, data, dataState],
  );
  return { run, failed: error !== undefined && run === null };
}
