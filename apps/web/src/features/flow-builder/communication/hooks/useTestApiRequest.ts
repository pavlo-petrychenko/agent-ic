import type { ApiRequestNode } from '@agent-ic/flow';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { TestApiRequestDocument } from '@/features/flow-builder/communication/gql/mutation/testApiRequest.generated';
import { IDLE_API_TEST } from '@/features/flow-builder/constants/apiRequest.constants';
import type { UseTestApiRequestResult } from '@/features/flow-builder/typedefs/apiRequest.typedefs';

export function useTestApiRequest(agentId: string): UseTestApiRequestResult {
  const [test, { data, loading, error }] = useMutation(TestApiRequestDocument);
  const [tested, setTested] = useState<ApiRequestNode | null>(null);

  return {
    stateOf: (node) =>
      node.id === tested?.id && node.config === tested.config
        ? { result: data?.testApiRequest ?? null, running: loading, failed: error !== undefined }
        : IDLE_API_TEST,
    run: (node) => {
      setTested(node);
      test({ variables: { input: { agentId, nodeId: node.id, variables: null } } }).catch(
        () => undefined,
      );
    },
  };
}
