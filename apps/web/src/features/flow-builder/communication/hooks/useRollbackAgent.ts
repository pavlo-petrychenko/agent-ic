import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RollbackAgentDocument } from '@/features/flow-builder/communication/gql/mutation/rollbackAgent.generated';
import type { RollbackAgentResult } from '@/features/flow-builder/typedefs/versions.typedefs';

export function useRollbackAgent(): RollbackAgentResult {
  const [rollbackAgent, { loading }] = useMutation(RollbackAgentDocument);

  const rollback = useCallback(
    async (versionId: string, revision: number, note: string) => {
      const trimmed = note.trim();
      const { data } = await rollbackAgent({
        variables: { input: { versionId, revision, note: trimmed === '' ? null : trimmed } },
      });
      return data?.rollbackAgent.version.number ?? null;
    },
    [rollbackAgent],
  );

  return { rollback, rollingBack: loading };
}
