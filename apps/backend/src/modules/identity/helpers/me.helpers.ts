import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';

export const openableWorkspaceId = (
  memberships: readonly WorkspaceMembership[],
  workspaceId: string | null,
): string | null =>
  memberships.some((membership) => membership.workspace.id === workspaceId) ? workspaceId : null;
