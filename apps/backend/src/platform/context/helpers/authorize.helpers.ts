import { hasPermission, permissionsForRole } from '@agent-ic/contracts';
import type { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';

export const requireWorkspaceMember = (ctx: UseCaseCtx): WorkspaceAccess => {
  const { userId } = requireUserActor(ctx);
  if (ctx.workspaceId === null || ctx.workspaceRole === null) {
    throw new WorkspaceAccessDeniedError();
  }
  return { userId, workspaceId: ctx.workspaceId, role: ctx.workspaceRole };
};

export const authorize = (
  ctx: UseCaseCtx,
  resource: PermissionResource,
  action: PermissionAction,
): WorkspaceAccess => {
  const access = requireWorkspaceMember(ctx);
  if (!hasPermission(ctx.permissions ?? permissionsForRole(access.role), resource, action)) {
    throw new PermissionDeniedError(resource, action);
  }
  return access;
};
