import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateWorkspaceDocument } from '@/features/auth/communication/gql/mutation/createWorkspace.generated';
import { MY_WORKSPACES_FIELD } from '@/features/auth/constants/workspaceStep.constants';
import type { CreateWorkspaceRequest } from '@/features/auth/typedefs/workspaceStep.typedefs';

export function useCreateWorkspace(): (request: CreateWorkspaceRequest) => Promise<string | null> {
  const [createWorkspace] = useMutation(CreateWorkspaceDocument, {
    update: (cache) => {
      cache.evict({ fieldName: MY_WORKSPACES_FIELD });
      cache.gc();
    },
  });

  return useCallback(
    async (request) => {
      const { data } = await createWorkspace({ variables: { input: request } });
      return data?.createWorkspace.workspace.id ?? null;
    },
    [createWorkspace],
  );
}
