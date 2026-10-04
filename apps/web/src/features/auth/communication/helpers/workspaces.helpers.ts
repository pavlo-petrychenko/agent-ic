import type { MyWorkspacesQuery } from '@/features/auth/communication/gql/query/myWorkspaces.generated';

export const firstWorkspaceId = (data: MyWorkspacesQuery | null): string | null =>
  data?.myWorkspaces[0]?.workspace.id ?? null;
