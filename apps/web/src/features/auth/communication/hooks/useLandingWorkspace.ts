import { useApolloClient } from '@apollo/client/react';
import { useCallback } from 'react';
import { MyWorkspacesDocument } from '@/features/auth/communication/gql/query/myWorkspaces.generated';
import { firstWorkspaceId } from '@/features/auth/communication/helpers/workspaces.helpers';

export function useLandingWorkspace(): () => Promise<string | null> {
  const client = useApolloClient();

  return useCallback(async () => {
    const { data } = await client.query({
      query: MyWorkspacesDocument,
      fetchPolicy: 'network-only',
    });
    return firstWorkspaceId(data ?? null);
  }, [client]);
}
