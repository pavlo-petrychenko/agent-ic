import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateWorkspaceDocument } from '@/features/auth/communication/gql/mutation/createWorkspace.generated';
import { MyWorkspacesDocument } from '@/features/auth/communication/gql/query/myWorkspaces.generated';
import type { CreateWorkspaceRequest } from '@/features/auth/typedefs/workspaceStep.typedefs';

export function useCreateWorkspace(): (request: CreateWorkspaceRequest) => Promise<string | null> {
  const [createWorkspace] = useMutation(CreateWorkspaceDocument, {
    refetchQueries: [MyWorkspacesDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (request) => {
      const { data } = await createWorkspace({ variables: { input: request } });
      return data?.createWorkspace.workspace.id ?? null;
    },
    [createWorkspace],
  );
}
