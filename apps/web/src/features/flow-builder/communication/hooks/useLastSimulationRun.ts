import { useQuery } from '@apollo/client/react';
import { LastSimulationRunDocument } from '@/features/flow-builder/communication/gql/query/lastSimulationRun.generated';
import type { LastSimulationRunResult } from '@/features/flow-builder/typedefs/lastRun.typedefs';

export function useLastSimulationRun(agentId: string): LastSimulationRunResult {
  const { data, dataState } = useQuery(LastSimulationRunDocument, {
    variables: { agentId },
    fetchPolicy: 'cache-and-network',
  });
  return {
    run: dataState === 'complete' ? data.agent.lastSimulationRun : null,
    loaded: dataState === 'complete',
  };
}
