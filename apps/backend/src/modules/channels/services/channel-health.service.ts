import { Injectable } from '@nestjs/common';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ChannelHealthService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly clock: ClockService,
  ) {}

  markBroken(workspaceId: string, channelId: string): Promise<boolean> {
    return this.tenantTransactions.run(workspaceId, () =>
      this.channels.markBroken(workspaceId, channelId, this.clock.now()),
    );
  }
}
