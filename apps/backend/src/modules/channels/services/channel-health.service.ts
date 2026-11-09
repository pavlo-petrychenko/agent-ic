import { Injectable } from '@nestjs/common';
import { telegramTokenRevokedEvent } from '@/modules/channels/events/telegram-token-revoked.event';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';

@Injectable()
export class ChannelHealthService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly clock: ClockService,
    private readonly contexts: UseCaseCtxService,
    private readonly traceIds: TraceIdService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  markBroken(workspaceId: string, channelId: string): Promise<boolean> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const marked = await this.channels.markBroken(workspaceId, channelId, this.clock.now());
      if (!marked) {
        return false;
      }
      await this.domainEvents.emit(
        this.systemCtx(workspaceId),
        telegramTokenRevokedEvent,
        { workspaceId, channelId },
        { durable: true },
      );
      return true;
    });
  }

  private systemCtx(workspaceId: string): UseCaseCtx {
    return this.contexts.system({
      reason: SystemReason.ChannelHealth,
      workspaceId,
      traceId: this.traceIds.current(),
      initiatedBy: null,
    });
  }
}
