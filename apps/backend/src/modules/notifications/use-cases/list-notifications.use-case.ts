import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import type {
  ListNotificationsInput,
  NotificationsPage,
} from '@/modules/notifications/typedefs/notification.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { toConnection, toPageRequest } from '@/platform/graphql-server/helpers/relay.helpers';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx, input: ListNotificationsInput): Promise<NotificationsPage> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    const page = toPageRequest(input);
    return this.tenants.run(workspaceId, async () => {
      const rows = await this.notifications.listForUser(workspaceId, userId, {
        afterId: page.afterId,
        limit: page.fetchSize,
        unreadOnly: input.unreadOnly === true,
      });
      const connection = toConnection(rows, page, (row) => row.id);
      return {
        pageInfo: connection.pageInfo,
        edges: connection.edges.map((edge) => ({
          cursor: edge.cursor,
          node: {
            ...edge.node,
            conversationId: this.ids.toPublic(IdPrefix.Conversation, edge.node.conversationId),
          },
        })),
      };
    });
  }
}
