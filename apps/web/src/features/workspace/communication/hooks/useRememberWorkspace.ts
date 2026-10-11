import { useMutation } from '@apollo/client/react';
import { useEffect, useRef } from 'react';
import { RememberWorkspaceDocument } from '@/features/workspace/communication/gql/mutation/rememberWorkspace.generated';

export function useRememberWorkspace(workspaceId: string | null): void {
  const [rememberWorkspace] = useMutation(RememberWorkspaceDocument);
  const remembered = useRef<string | null>(null);

  useEffect(() => {
    if (workspaceId === null || remembered.current === workspaceId) {
      return;
    }
    remembered.current = workspaceId;
    rememberWorkspace({ variables: { workspaceId } }).catch(() => undefined);
  }, [workspaceId, rememberWorkspace]);
}
