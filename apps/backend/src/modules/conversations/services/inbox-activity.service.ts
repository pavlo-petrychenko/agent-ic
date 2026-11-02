import { Injectable } from '@nestjs/common';
import { inboxActivityChannel } from '@/modules/conversations/channels/inbox-activity.channel';
import { InboxActivityKind } from '@/modules/conversations/constants/inbox-activity.constants';
import type { InboxActivity } from '@/modules/conversations/typedefs/inbox-activity.typedefs';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';

@Injectable()
export class InboxActivityService {
  constructor(private readonly liveUpdates: LiveUpdatesService) {}

  conversationChanged(workspaceId: string, conversationId: string): Promise<void> {
    return this.liveUpdates.publish(channelFor(inboxActivityChannel, workspaceId), {
      conversationId,
      kind: InboxActivityKind.ConversationChanged,
    } satisfies InboxActivity);
  }
}
