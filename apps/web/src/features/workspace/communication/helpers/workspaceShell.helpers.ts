import type { WorkspaceShellQuery } from '@/features/workspace/communication/gql/query/workspaceShell.generated';
import type {
  WorkspaceShellData,
  WorkspaceSummary,
} from '@/features/workspace/typedefs/workspace.typedefs';
import { LOCALE_FROM_API } from '@/shared/api/constants/locale.constants';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';

export const toWorkspaceShellData = (
  data: WorkspaceShellQuery,
  activeWorkspaceId: string,
): WorkspaceShellData => {
  const workspaces: readonly WorkspaceSummary[] = data.myWorkspaces.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    timeZone: membership.workspace.timeZone,
    memberCount: membership.workspace.memberCount,
    role: ROLE_FROM_API[membership.role],
  }));
  return {
    user: { name: data.me.name, email: data.me.email, locale: LOCALE_FROM_API[data.me.locale] },
    workspaces,
    active: workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
  };
};
