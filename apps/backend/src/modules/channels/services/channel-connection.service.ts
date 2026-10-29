import { Injectable, Logger } from '@nestjs/common';
import { ChannelReconnectLogMessage } from '@/modules/channels/constants/channel-reconnect.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelAlreadyConnectedError } from '@/modules/channels/errors/channel-already-connected.error';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { toChannelView } from '@/modules/channels/helpers/channel-view.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type {
  ChannelRecord,
  ChannelView,
  CompleteChannelConnectionInput,
  NewChannel,
  PrepareChannelConnectionInput,
  ReplaceChannelCredentialsInput,
  StoreReconnectCredentialsInput,
  UpdateChannelSettingsInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ChannelConnectionService {
  private readonly logger = new Logger(ChannelConnectionService.name);

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  prepare(input: PrepareChannelConnectionInput): Promise<string> {
    const now = this.clock.now();
    return this.tenantTransactions.run(input.workspaceId, async () => {
      const existing = await this.channels.findByKindAndExternalId(
        input.workspaceId,
        input.kind,
        input.externalId,
      );
      if (existing !== null) {
        if (existing.status === ChannelStatus.Connected) {
          throw new ChannelAlreadyConnectedError();
        }
        const updated = await this.channels.update(input.workspaceId, existing.id, {
          status: ChannelStatus.Pending,
          agentId: input.agentId,
          identity: input.identity,
          showTyping: input.showTyping,
          credentialsSealed: input.credentialsSealed,
          updatedAt: now,
          updatedByUserId: input.updatedByUserId,
        });
        if (updated === null) {
          throw new ChannelNotFoundError();
        }
        return existing.id;
      }
      const channelId = this.ids.generate();
      const channel: NewChannel = {
        id: channelId,
        workspaceId: input.workspaceId,
        kind: input.kind,
        status: ChannelStatus.Pending,
        agentId: input.agentId,
        externalId: input.externalId,
        identity: input.identity,
        showTyping: input.showTyping,
        credentialsSealed: input.credentialsSealed,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId,
        createdAt: now,
        updatedAt: now,
      };
      if (!(await this.channels.insertIfAbsent(channel))) {
        throw new ChannelAlreadyConnectedError();
      }
      return channelId;
    });
  }

  complete(input: CompleteChannelConnectionInput): Promise<ChannelView> {
    return this.tenantTransactions.run(input.workspaceId, async () => {
      const channel = await this.channels.updateStatus(
        input.workspaceId,
        input.channelId,
        ChannelStatus.Connected,
        this.clock.now(),
        input.updatedByUserId,
      );
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
      return toChannelView(channel, this.ids);
    });
  }

  claimReconnect(
    workspaceId: string,
    channelId: string,
    userId: string,
  ): Promise<ChannelRecord | null> {
    return this.tenantTransactions.run(workspaceId, () =>
      this.channels.updateStatusIfCurrent(
        workspaceId,
        channelId,
        ChannelStatus.Disconnected,
        ChannelStatus.Pending,
        this.clock.now(),
        userId,
      ),
    );
  }

  storeReconnectCredentials(input: StoreReconnectCredentialsInput): Promise<void> {
    return this.tenantTransactions.run(input.workspaceId, async () => {
      const channel = await this.channels.updateCredentials(input.workspaceId, input.channelId, {
        status: ChannelStatus.Pending,
        identity: input.identity,
        credentialsSealed: input.credentialsSealed,
        updatedAt: this.clock.now(),
        updatedByUserId: input.updatedByUserId,
      });
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
    });
  }

  completeReconnect(workspaceId: string, channelId: string, userId: string): Promise<ChannelView> {
    return this.complete({ workspaceId, channelId, updatedByUserId: userId });
  }

  async releaseReconnect(workspaceId: string, channelId: string, userId: string): Promise<void> {
    await this.tenantTransactions
      .run(workspaceId, () =>
        this.channels.updateStatusIfCurrent(
          workspaceId,
          channelId,
          ChannelStatus.Pending,
          ChannelStatus.Disconnected,
          this.clock.now(),
          userId,
        ),
      )
      .catch((error: unknown) => {
        this.logger.error({
          msg: ChannelReconnectLogMessage.RollbackError,
          channelId,
          err: error,
        });
      });
  }

  updateSettings(input: UpdateChannelSettingsInput): Promise<ChannelView> {
    return this.tenantTransactions.run(input.workspaceId, async () => {
      const channel = await this.channels.updateSettings(input.workspaceId, input.channelId, {
        agentId: input.agentId,
        showTyping: input.showTyping,
        updatedAt: this.clock.now(),
        updatedByUserId: input.updatedByUserId,
      });
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
      return toChannelView(channel, this.ids);
    });
  }

  replaceCredentials(input: ReplaceChannelCredentialsInput): Promise<ChannelView> {
    return this.tenantTransactions.run(input.workspaceId, async () => {
      const channel = await this.channels.updateCredentials(input.workspaceId, input.channelId, {
        status: ChannelStatus.Connected,
        identity: input.identity,
        credentialsSealed: input.credentialsSealed,
        updatedAt: this.clock.now(),
        updatedByUserId: input.updatedByUserId,
      });
      if (channel === null) {
        throw new ChannelNotFoundError();
      }
      return toChannelView(channel, this.ids);
    });
  }
}
