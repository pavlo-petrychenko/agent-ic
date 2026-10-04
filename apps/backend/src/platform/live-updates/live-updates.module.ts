import { ChannelPublisherService } from '@/platform/live-updates/services/channel-publisher.service';
import { ChannelSubscriberService } from '@/platform/live-updates/services/channel-subscriber.service';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class LiveUpdatesModule extends defineModule({
  global: true,
  providers: [ChannelPublisherService, ChannelSubscriberService, LiveUpdatesService],
  exports: [LiveUpdatesService],
}) {}
