import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { inboxActivityChannel } from '@/modules/conversations/channels/inbox-activity.channel';
import type { InboxActivity } from '@/modules/conversations/typedefs/inbox-activity.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { mapChannelStream } from '@/platform/live-updates/helpers/channel-stream.helpers';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Injectable()
export class SubscribeToInboxActivityUseCase {
  constructor(
    private readonly liveUpdates: LiveUpdatesService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<ChannelStream<InboxActivity>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Inbox, PermissionAction.View);
    const events = await this.liveUpdates.subscribe(channelFor(inboxActivityChannel, workspaceId));
    return mapChannelStream(events, (event) => ({
      conversationId: this.ids.toPublic(IdPrefix.Conversation, event.conversationId),
      kind: event.kind,
    }));
  }
}
