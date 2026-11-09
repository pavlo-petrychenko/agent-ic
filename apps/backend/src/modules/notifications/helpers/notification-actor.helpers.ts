import type { NotificationActor } from '@/modules/notifications/typedefs/notification-actor.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const notificationActorOf = (ctx: UseCaseCtx): NotificationActor => {
  const actor = requireUserActor(ctx);
  if (ctx.workspaceId === null) {
    throw new WorkspaceAccessDeniedError();
  }
  return { userId: actor.userId, workspaceId: ctx.workspaceId };
};
