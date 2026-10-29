import { Injectable } from '@nestjs/common';
import { AutoCloseVersionsRepository } from '@/modules/agents';
import { AUTO_CLOSE_BATCH_SIZE } from '@/modules/conversations/constants/conversation-job.constants';
import { inactivityScopesByWorkspace } from '@/modules/conversations/helpers/auto-close.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import type { InactivityScope } from '@/modules/conversations/typedefs/auto-close.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CloseInactiveConversationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly autoCloseVersions: AutoCloseVersionsRepository,
    private readonly conversations: ConversationsRepository,
    private readonly activity: ConversationActivityService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<void> {
    requireSystemActor(ctx);
    const now = this.clock.now();
    const versions = await this.autoCloseVersions.listEnabled();
    for (const [workspaceId, scopes] of inactivityScopesByWorkspace(versions, now)) {
      await this.closeWorkspace(workspaceId, scopes, now);
    }
  }

  private async closeWorkspace(
    workspaceId: string,
    scopes: readonly InactivityScope[],
    now: Date,
  ): Promise<void> {
    let closed = 0;
    do {
      closed = await this.tenants.run(workspaceId, async () => {
        const ids = await this.conversations.closeInactive(
          workspaceId,
          scopes,
          now,
          AUTO_CLOSE_BATCH_SIZE,
        );
        for (const id of ids) {
          await this.activity.conversationClosed(id);
        }
        return ids.length;
      });
    } while (closed === AUTO_CLOSE_BATCH_SIZE);
  }
}
