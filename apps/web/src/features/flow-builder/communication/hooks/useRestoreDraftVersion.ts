import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { BuilderRestoreVersionDocument } from '@/features/flow-builder/communication/gql/mutation/builderRestoreVersion.generated';
import type { RestoreDraftResult } from '@/features/flow-builder/typedefs/versions.typedefs';

export function useRestoreDraftVersion(): RestoreDraftResult {
  const [restoreVersion, { loading }] = useMutation(BuilderRestoreVersionDocument);

  const restore = useCallback(
    async (versionId: string, revision: number) => {
      await restoreVersion({ variables: { input: { versionId, revision } } });
    },
    [restoreVersion],
  );

  return { restore, restoring: loading };
}
