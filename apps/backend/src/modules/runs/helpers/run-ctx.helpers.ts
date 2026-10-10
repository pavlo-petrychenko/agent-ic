import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const runWorkspaceOf = (ctx: UseCaseCtx): string => {
  requireSystemActor(ctx);
  if (ctx.workspaceId === null) {
    throw new WorkspaceAccessDeniedError();
  }
  return ctx.workspaceId;
};
