import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { WorkspaceShellDocument } from '@/features/workspace/communication/gql/query/workspaceShell.generated';
import { toWorkspaceShellData } from '@/features/workspace/communication/helpers/workspaceShell.helpers';
import type { UseWorkspaceShellResult } from '@/features/workspace/typedefs/workspace.typedefs';

export function useWorkspaceShell(workspaceId: string): UseWorkspaceShellResult {
  const { data, loading } = useQuery(WorkspaceShellDocument);
  const shell = useMemo(
    () => (data === undefined ? null : toWorkspaceShellData(data, workspaceId)),
    [data, workspaceId],
  );
  return { data: shell, loading };
}
