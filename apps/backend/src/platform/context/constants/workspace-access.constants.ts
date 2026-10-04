import type { ResolvedWorkspace } from '@/platform/context/typedefs/workspace-access.typedefs';

export const WORKSPACE_ACCESS_DENIED_MESSAGE = 'You are not a member of this workspace.';
export const PERMISSION_DENIED_MESSAGE = 'Your role does not allow this action.';

export const NO_WORKSPACE: ResolvedWorkspace = { workspaceId: null, workspaceRole: null };
