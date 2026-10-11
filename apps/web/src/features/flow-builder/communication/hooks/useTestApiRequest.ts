import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { TestApiRequestDocument } from '@/features/flow-builder/communication/gql/mutation/testApiRequest.generated';
import type { UseTestApiRequestResult } from '@/features/flow-builder/typedefs/apiRequest.typedefs';

const IDLE = { result: null, running: false, failed: false };

export function useTestApiRequest(agentId: string): UseTestApiRequestResult {
  const [test, { data, loading, error }] = useMutation(TestApiRequestDocument);
  const [testedNodeId, setTestedNodeId] = useState<string | null>(null);

  return {
    stateOf: (nodeId) =>
      nodeId === testedNodeId
        ? { result: data?.testApiRequest ?? null, running: loading, failed: error !== undefined }
        : IDLE,
    run: (nodeId) => {
      setTestedNodeId(nodeId);
      test({ variables: { input: { agentId, nodeId, variables: null } } }).catch(() => undefined);
    },
  };
}
