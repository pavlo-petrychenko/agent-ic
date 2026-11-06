import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { NotificationSettingsUnavailableError } from '@/modules/notifications/errors/notification-settings-unavailable.error';
import {
  defaultNotificationChannelRows,
  enabledNotificationChannels,
  toNotificationSettingsView,
} from '@/modules/notifications/helpers/notification-settings.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import type {
  NotificationChannelValue,
  NotificationSettingsRecord,
  NotificationSettingsView,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class NotificationSettingsService {
  constructor(
    private readonly settings: NotificationSettingsRepository,
    private readonly ids: IdService,
  ) {}

  async describe(workspaceId: string, userId: string): Promise<NotificationSettingsView> {
    return toNotificationSettingsView(await this.settings.findByUser(workspaceId, userId));
  }

  async channelsFor(
    workspaceId: string,
    userId: string,
  ): Promise<readonly NotificationChannelValue[]> {
    return enabledNotificationChannels(await this.describe(workspaceId, userId));
  }

  async setChannelEnabled(
    workspaceId: string,
    userId: string,
    channel: NotificationChannelValue,
    enabled: boolean,
  ): Promise<NotificationSettingsView> {
    const settings = await this.ensure(workspaceId, userId);
    if (!(await this.settings.updateChannel(workspaceId, settings.id, channel, enabled))) {
      throw new NotificationSettingsUnavailableError();
    }
    return this.describe(workspaceId, userId);
  }

  async setEmail(
    workspaceId: string,
    userId: string,
    email: string,
  ): Promise<NotificationSettingsView> {
    const settings = await this.ensure(workspaceId, userId);
    const emailChannel = settings.channels.find(
      (channel) => channel.channel === NotificationChannel.Email,
    );
    if (emailChannel === undefined) {
      throw new NotificationSettingsUnavailableError();
    }
    await this.settings.setEmail(workspaceId, emailChannel.id, email);
    return this.describe(workspaceId, userId);
  }

  private async ensure(workspaceId: string, userId: string): Promise<NotificationSettingsRecord> {
    const settingsId = await this.settings.insertIfAbsent(workspaceId, userId, this.ids.generate());
    if (settingsId === null) {
      throw new NotificationSettingsUnavailableError();
    }
    await this.settings.insertChannels(
      defaultNotificationChannelRows(workspaceId, settingsId, () => this.ids.generate()),
    );
    const created = await this.settings.findByUser(workspaceId, userId);
    if (created === null) {
      throw new NotificationSettingsUnavailableError();
    }
    return created;
  }
}
