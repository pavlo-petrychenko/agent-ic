import type { MyWorkspacesQuery } from '@/features/auth/communication/gql/query/myWorkspaces.generated';

export const landingWorkspaceId = (data: MyWorkspacesQuery | null): string | null => {
  const workspaceIds = data === null ? [] : data.myWorkspaces.map(({ workspace }) => workspace.id);
  const lastWorkspaceId = data === null ? null : (data.me.lastWorkspaceId ?? null);
  return lastWorkspaceId !== null && workspaceIds.includes(lastWorkspaceId)
    ? lastWorkspaceId
    : (workspaceIds[0] ?? null);
};
