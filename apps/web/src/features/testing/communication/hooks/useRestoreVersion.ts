import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RestoreVersionDocument } from '@/features/testing/communication/gql/mutation/restoreVersion.generated';
import type { RestoreVersionResult } from '@/features/testing/typedefs/versions.typedefs';

export function useRestoreVersion(): RestoreVersionResult {
  const [restoreVersion, { loading }] = useMutation(RestoreVersionDocument);
  const restore = useCallback(
    async (versionId: string, revision: number) => {
      await restoreVersion({ variables: { input: { versionId, revision } } });
    },
    [restoreVersion],
  );
  return { restore, restoring: loading };
}
