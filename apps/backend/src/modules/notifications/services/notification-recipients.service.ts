import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { RecipientsKind } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { MembershipsRepository } from '@/modules/identity';
import {
  intersectNotificationChannels,
  notificationChannelsOf,
} from '@/modules/notifications/helpers/notification-channel.helpers';
import { handoffNotifyOf } from '@/modules/notifications/helpers/notification-notify.helpers';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type {
  HandoffNotify,
  NotificationRecipient,
  NotificationRecipientSelection,
} from '@/modules/notifications/typedefs/notification-recipients.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class NotificationRecipientsService {
  constructor(
    private readonly agents: AgentRuntimeReader,
    private readonly members: MembershipsRepository,
    private readonly settings: NotificationSettingsService,
    private readonly ids: IdService,
  ) {}

  async recipientsFor(
    workspaceId: string,
    versionId: string,
    nodeId: string,
  ): Promise<readonly NotificationRecipient[]> {
    const version = await this.agents.getVersion(workspaceId, versionId);
    const node = version.flow.nodes.find((candidate) => candidate.id === nodeId);
    const notify = handoffNotifyOf(version.flow, node);
    if (notify === null) {
      return [];
    }
    const userIds = await this.members.listUserIds(
      workspaceId,
      this.selectionOf(notify.recipients),
    );
    const requested = notificationChannelsOf(notify);
    const recipients = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        channels: intersectNotificationChannels(
          await this.settings.channelsFor(workspaceId, userId),
          requested,
        ),
      })),
    );
    return recipients.filter((recipient) => recipient.channels.length > 0);
  }

  private selectionOf(recipients: HandoffNotify['recipients']): NotificationRecipientSelection {
    if (recipients.kind === RecipientsKind.Operators) {
      return { role: WorkspaceRole.Operator };
    }
    if (recipients.kind === RecipientsKind.Role) {
      return { role: recipients.role };
    }
    return {
      userIds: recipients.userIds.flatMap((id) => this.ids.tryFromPublic(IdPrefix.User, id) ?? []),
    };
  }
}
